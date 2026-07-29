import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const policyCode = read("modules/media/mediaPolicy.js");
const padCode = read("modules/signature/signaturePad.js");

assert.doesNotThrow(() => new vm.Script(padCode), "signaturePad.js must contain valid JavaScript");
assert.ok(padCode.includes("pointerdown"), "Signature Pad must support pointer input");
assert.ok(padCode.includes("touchstart"), "Signature Pad must support touch input");
assert.ok(padCode.includes("mousedown"), "Signature Pad must support mouse input");
assert.ok(padCode.includes("SIGNATURE_REQUIRED"), "Signature Pad must reject an empty required signature");
assert.ok(padCode.includes('toDataURL?.("image/png")'), "Signature Pad must export PNG evidence");
assert.ok(padCode.includes("validateSignature"), "Signature Pad must enforce MediaPolicy signature limits");
assert.ok(padCode.includes("buildSafeSummary"), "Signature Pad must expose a payload-free summary");

for (const forbidden of [
    "FirebaseService",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "QueueStorage",
    "stockTransactions/",
    "stockLog/",
    "atomicRoomStockDifference"
]) {
    assert.ok(!padCode.includes(forbidden), `Signature Pad must not contain ${forbidden}`);
}

class FakeEventTarget {
    constructor() {
        this.listeners = new Map();
    }

    addEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }

    removeEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        this.listeners.set(name, listeners.filter(item => item !== listener));
    }

    dispatch(name, event = {}) {
        for (const listener of this.listeners.get(name) || []) {
            listener({ type: name, ...event });
        }
    }

    listenerCount() {
        return [...this.listeners.values()].reduce((sum, listeners) => sum + listeners.length, 0);
    }
}

class FakeContext {
    constructor() {
        this.operations = [];
        this.lineWidth = 0;
        this.lineCap = "";
        this.lineJoin = "";
        this.strokeStyle = "";
        this.fillStyle = "";
    }

    beginPath() {
        this.operations.push(["beginPath"]);
    }

    arc(...args) {
        this.operations.push(["arc", ...args]);
    }

    fill() {
        this.operations.push(["fill"]);
    }

    moveTo(...args) {
        this.operations.push(["moveTo", ...args]);
    }

    lineTo(...args) {
        this.operations.push(["lineTo", ...args]);
    }

    stroke() {
        this.operations.push(["stroke"]);
    }

    clearRect(...args) {
        this.operations.push(["clearRect", ...args]);
    }
}

class FakeCanvas extends FakeEventTarget {
    constructor(options = {}) {
        super();
        this.clientWidth = options.clientWidth || 640;
        this.clientHeight = options.clientHeight || 240;
        this.width = options.width || this.clientWidth;
        this.height = options.height || this.clientHeight;
        this.rect = options.rect || { left: 10, top: 20, width: this.clientWidth, height: this.clientHeight };
        this.context = new FakeContext();
        this.captureIds = [];
        this.releaseIds = [];
        this.payloadFactory = options.payloadFactory || (() => {
            const payload = Buffer.from(`signature:${JSON.stringify(this.context.operations)}`).toString("base64");
            return `data:image/png;base64,${payload}`;
        });
    }

    getContext(kind) {
        return kind === "2d" ? this.context : null;
    }

    getBoundingClientRect() {
        return { ...this.rect };
    }

    setPointerCapture(id) {
        this.captureIds.push(id);
    }

    releasePointerCapture(id) {
        this.releaseIds.push(id);
    }

    toDataURL(mime) {
        assert.equal(mime, "image/png");
        return this.payloadFactory();
    }
}

function createRuntime({ pointer = true } = {}) {
    const windowTarget = new FakeEventTarget();
    const windowObject = Object.assign(windowTarget, {});
    if (pointer) windowObject.PointerEvent = function PointerEvent() {};
    const context = {
        window: windowObject,
        TextEncoder,
        Math,
        Number,
        String,
        Object,
        Array,
        Map,
        Set,
        Error,
        console
    };
    vm.runInNewContext(policyCode, context);
    vm.runInNewContext(padCode, context);
    return {
        window: windowObject,
        MediaPolicy: context.window.MediaPolicyClass,
        SignaturePad: context.window.SignaturePadClass
    };
}

function preventable(extra = {}) {
    let prevented = 0;
    return {
        event: {
            preventDefault() {
                prevented += 1;
            },
            ...extra
        },
        prevented: () => prevented
    };
}

const pointerRuntime = createRuntime({ pointer: true });
const pointerPolicy = new pointerRuntime.MediaPolicy({ maxSignatureBytes: 16 * 1024 });
const pointerCanvas = new FakeCanvas({ clientWidth: 900, clientHeight: 400 });
const pointerPad = new pointerRuntime.SignaturePad(pointerCanvas, pointerPolicy, {
    window: pointerRuntime.window,
    maxWidth: 640,
    maxHeight: 240,
    lineWidth: 3
});

const initialState = pointerPad.initialize();
assert.equal(initialState.eventMode, "pointer", "Pointer-capable browsers must use pointer events");
assert.equal(pointerCanvas.width, 640, "Signature canvas width must be bounded");
assert.equal(pointerCanvas.height, 240, "Signature canvas height must be bounded");
assert.equal(initialState.empty, true, "New Signature Pad must be empty");

const down = preventable({ pointerId: 7, isPrimary: true, clientX: 110, clientY: 70, pressure: 0.4 });
const move = preventable({ pointerId: 7, isPrimary: true, clientX: 310, clientY: 170, pressure: 0.8 });
const up = preventable({ pointerId: 7, isPrimary: true, clientX: 310, clientY: 170, pressure: 0.8 });
pointerCanvas.dispatch("pointerdown", down.event);
pointerCanvas.dispatch("pointermove", move.event);
pointerCanvas.dispatch("pointerup", up.event);

assert.equal(down.prevented(), 1, "Pointer down must prevent browser gesture interference");
assert.equal(move.prevented(), 1, "Pointer move must prevent browser gesture interference");
assert.equal(up.prevented(), 1, "Pointer up must prevent browser gesture interference");
assert.deepEqual(pointerCanvas.captureIds, [7], "Pointer capture must start for the active stroke");
assert.deepEqual(pointerCanvas.releaseIds, [7], "Pointer capture must release after the stroke");
assert.equal(pointerPad.getState().strokeCount, 1);
assert.equal(pointerPad.getState().pointCount, 2);
assert.equal(pointerPad.isEmpty(), false);

const pointerSignature = pointerPad.exportSignature();
assert.match(pointerSignature.id, /^signature-[0-9a-f]{16}$/, "Signature identifier must be deterministic and path-safe");
assert.equal(pointerSignature.mime, "image/png");
assert.ok(pointerSignature.size > 0 && pointerSignature.size <= 16 * 1024);
assert.equal(pointerSignature.width, 640);
assert.equal(pointerSignature.height, 240);
assert.equal(pointerSignature.strokeCount, 1);
assert.equal(pointerSignature.pointCount, 2);
assert.equal(pointerPad.exportSignature().id, pointerSignature.id, "Same strokes and PNG must produce the same identifier");

const pointerSummary = pointerPad.buildSafeSummary(pointerSignature);
assert.equal(pointerSummary.id, pointerSignature.id);
assert.equal(pointerSummary.size, pointerSignature.size);
assert.equal(pointerSummary.strokeCount, 1);
assert.equal(pointerSummary.pointCount, 2);
assert.equal("dataUrl" in pointerSummary, false, "Safe signature summary must exclude PNG payload");
assert.ok(!JSON.stringify(pointerSummary).includes("data:image"), "Safe summary must not expose Data URLs");

pointerPad.redraw();
assert.ok(pointerCanvas.context.operations.some(operation => operation[0] === "lineTo"), "Redraw must replay captured strokes");

pointerPad.clear();
assert.equal(pointerPad.isEmpty(), true, "Clear must remove all captured strokes");
assert.throws(
    () => pointerPad.exportSignature(),
    error => error?.code === "SIGNATURE_REQUIRED",
    "Required export must reject an empty signature"
);
const optionalEmpty = pointerPad.exportSignature({ required: false });
assert.equal(optionalEmpty.empty, true, "Optional empty signature must export as explicit empty metadata");
assert.equal(optionalEmpty.dataUrl, "");

const beforeDestroyListeners = pointerCanvas.listenerCount();
assert.ok(beforeDestroyListeners > 0, "Signature Pad must bind canvas listeners");
pointerPad.destroy();
assert.equal(pointerCanvas.listenerCount(), 0, "Destroy must remove pointer listeners");
assert.equal(pointerPad.getState().initialized, false);

const legacyRuntime = createRuntime({ pointer: false });
const legacyPolicy = new legacyRuntime.MediaPolicy({ maxSignatureBytes: 16 * 1024 });
const legacyCanvas = new FakeCanvas({ clientWidth: 400, clientHeight: 180 });
const legacyPad = new legacyRuntime.SignaturePad(legacyCanvas, legacyPolicy, {
    window: legacyRuntime.window,
    maxWidth: 640,
    maxHeight: 240
});
legacyPad.initialize();
assert.equal(legacyPad.getState().eventMode, "legacy", "Browsers without PointerEvent must bind mouse and touch fallbacks");

legacyCanvas.dispatch("mousedown", preventable({ button: 0, clientX: 20, clientY: 30 }).event);
legacyRuntime.window.dispatch("mousemove", preventable({ clientX: 120, clientY: 80 }).event);
legacyRuntime.window.dispatch("mouseup", preventable({ clientX: 120, clientY: 80 }).event);
assert.equal(legacyPad.getState().strokeCount, 1, "Mouse fallback must capture one stroke");

legacyCanvas.dispatch("touchstart", preventable({ touches: [{ clientX: 40, clientY: 50, force: 0.3 }] }).event);
legacyCanvas.dispatch("touchmove", preventable({ touches: [{ clientX: 180, clientY: 120, force: 0.7 }] }).event);
legacyCanvas.dispatch("touchend", preventable({ changedTouches: [{ clientX: 180, clientY: 120, force: 0.7 }] }).event);
assert.equal(legacyPad.getState().strokeCount, 2, "Touch fallback must capture a separate stroke");
assert.equal(legacyPad.getState().pointCount, 4);
assert.ok(legacyPad.exportSignature().size > 0, "Legacy mouse/touch drawing must export a PNG signature");

legacyPad.resize(2000, 1000);
assert.equal(legacyPad.getState().width, 640, "Resize must retain the maximum width boundary");
assert.equal(legacyPad.getState().height, 240, "Resize must retain the maximum height boundary");
assert.equal(legacyPad.getState().strokeCount, 2, "Resize redraw must preserve captured strokes");

const oversizedRuntime = createRuntime({ pointer: true });
const oversizedPolicy = new oversizedRuntime.MediaPolicy({ maxSignatureBytes: 16 });
const oversizedCanvas = new FakeCanvas({
    payloadFactory: () => `data:image/png;base64,${Buffer.alloc(64, 1).toString("base64")}`
});
const oversizedPad = new oversizedRuntime.SignaturePad(oversizedCanvas, oversizedPolicy, {
    window: oversizedRuntime.window
});
oversizedPad.initialize();
oversizedCanvas.dispatch("pointerdown", preventable({ pointerId: 1, isPrimary: true, clientX: 30, clientY: 40, pressure: 0.5 }).event);
oversizedCanvas.dispatch("pointerup", preventable({ pointerId: 1, isPrimary: true, clientX: 30, clientY: 40, pressure: 0.5 }).event);
assert.throws(
    () => oversizedPad.exportSignature(),
    error => error?.code === "SIGNATURE_SIZE_EXCEEDED",
    "Signature Pad must reject PNG evidence above MediaPolicy limit"
);

console.log("Signature Pad checks passed.");
