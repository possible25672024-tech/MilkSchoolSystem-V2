import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const code = fs.readFileSync(path.join(root, "modules/media/vacationEvidenceAdapter.js"), "utf8");

assert.doesNotThrow(() => new vm.Script(code), "Vacation Evidence Adapter must contain valid JavaScript");
assert.ok(code.includes('"milkapp:teacher-refreshed"'), "Adapter must listen for live Teacher refresh events");
assert.ok(code.includes("sessionRoomId !== refreshedRoomId"), "Adapter must reject refresh events from another room");

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage", "atomicRoomStockDifference"]) {
    assert.ok(!code.includes(forbidden), `Vacation live stock replay must not own ${forbidden}`);
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

    dispatch(name, detail = null) {
        for (const listener of this.listeners.get(name) || []) listener({ type: name, detail });
    }
}

const events = new FakeEventTarget();
let session = { role: "teacher", roomId: "room-live" };
let previewRefreshCount = 0;
const fakeWindow = {
    addEventListener: events.addEventListener.bind(events),
    VacationEvidenceManager: {
        async buildLegacyEvidence() {
            return { photos: [], signature: "", signatures: {} };
        },
        markSaved() {}
    },
    VacationMilkManager: {
        async issue(input) {
            return { id: "isolated-record", record: input };
        }
    },
    VacationMilkService: {
        buildRecord(_session, _preview, input = {}) {
            return { ...input };
        }
    },
    VacationMilkView: {
        handlePreviewChange() {
            previewRefreshCount += 1;
        }
    },
    AuthService: {
        getSession() {
            return session;
        }
    }
};

const context = {
    window: fakeWindow,
    Promise,
    Boolean,
    String,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(code, context);

const Adapter = context.window.VacationEvidenceAdapterClass;
const adapter = new Adapter({ window: fakeWindow });
const firstStatus = adapter.install();
const secondStatus = adapter.install();

assert.equal(firstStatus.installed, true, "Vacation Evidence Adapter must install");
assert.equal(secondStatus.installed, true, "Repeated install must remain successful");
assert.deepEqual(
    JSON.parse(JSON.stringify(secondStatus)),
    { installed: true, vacationMilkService: true, vacationMilkManager: true },
    "Vacation Evidence Adapter status contract must remain backward compatible"
);
assert.equal(events.listeners.get("milkapp:login-success")?.length, 1, "Login replay listener must be idempotent");
assert.equal(events.listeners.get("milkapp:teacher-refreshed")?.length, 1, "Teacher refresh listener must be idempotent");
assert.equal(adapter.teacherRefreshBound, true, "Teacher refresh binding must be active internally");

events.dispatch("milkapp:login-success", { session });
await Promise.resolve();
assert.equal(previewRefreshCount, 1, "Teacher login must replay the Vacation preview once");

events.dispatch("milkapp:teacher-refreshed", { roomId: "room-live" });
await Promise.resolve();
assert.equal(previewRefreshCount, 2, "Matching live Teacher refresh must redraw Vacation stock once");

events.dispatch("milkapp:teacher-refreshed", { roomId: "another-room" });
await Promise.resolve();
assert.equal(previewRefreshCount, 2, "Another room refresh must not redraw the active Vacation preview");

session = { role: "admin", roomId: "room-live" };
events.dispatch("milkapp:teacher-refreshed", { roomId: "room-live" });
await Promise.resolve();
assert.equal(previewRefreshCount, 2, "Admin session must not replay Teacher Vacation preview");

console.log("Vacation live Teacher stock refresh checks passed.");