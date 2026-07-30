import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const policyCode = read("modules/media/mediaPolicy.js");
const managerCode = read("modules/media/attendanceEvidenceManager.js");
const adapterCode = read("modules/media/attendanceEvidenceAdapter.js");
const viewCode = read("modules/media/attendanceEvidenceView.js");
const appCode = read("modules/core/app.js");

for (const [name, code] of [
    ["attendanceEvidenceManager.js", managerCode],
    ["attendanceEvidenceAdapter.js", adapterCode],
    ["attendanceEvidenceView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage", "roomStock", "mainStock", "stockTransactions", "stockLog"]) {
    assert.ok(!managerCode.includes(forbidden), `AttendanceEvidenceManager must not contain ${forbidden}`);
    assert.ok(!viewCode.includes(forbidden), `AttendanceEvidenceView must not contain ${forbidden}`);
}
assert.ok(viewCode.includes("หลักฐานเช็กดื่มนมรายวัน"), "Attendance evidence panel must retain the daily evidence label");
assert.ok(viewCode.includes("attendance-photo-input"), "Attendance evidence panel must include photo input");
assert.ok(viewCode.includes("attendance-signature-canvas"), "Attendance evidence panel must include Teacher signature canvas");
assert.ok(viewCode.includes("สูงสุด 5 รูป"), "Attendance evidence panel must communicate the five-photo limit");
assert.ok(
    viewCode.includes("recordKey !== deletedKey"),
    "Deleting a different History date must not clear the active evidence context"
);
assert.ok(appCode.includes('import("../media/attendanceEvidenceManager.js")'), "App must load AttendanceEvidenceManager");
assert.ok(appCode.includes('import("../media/attendanceEvidenceAdapter.js")'), "App must load AttendanceEvidenceAdapter");
assert.ok(appCode.includes('import("../media/attendanceEvidenceView.js")'), "App must load AttendanceEvidenceView");
assert.ok(
    appCode.indexOf("ensureAttendanceEvidenceView") < appCode.indexOf("ensureSyncView"),
    "Attendance evidence integration must be prepared before Queue UI startup"
);

const context = {
    window: {},
    TextEncoder,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Set,
    Map,
    Error,
    Promise,
    console
};
vm.runInNewContext(policyCode, context);
const MediaPolicy = context.window.MediaPolicyClass;
const policy = new MediaPolicy({
    maxPhotosPerRecord: 5,
    maxProcessedBytes: 50 * 1024,
    maxSignatureBytes: 50 * 1024,
    maxAggregateBytes: 200 * 1024
});

const photoDataUrl = "data:image/jpeg;base64," + Buffer.alloc(1200, 7).toString("base64");
const photo2DataUrl = "data:image/jpeg;base64," + Buffer.alloc(1300, 8).toString("base64");
const signatureDataUrl = "data:image/png;base64," + Buffer.alloc(700, 9).toString("base64");
const payloads = new Map();
const removed = [];
let idCounter = 0;
const mediaStore = {
    async put(entry) {
        const mediaId = String(entry.id || `media-${++idCounter}`).padEnd(8, "0");
        const reference = {
            mediaId,
            kind: entry.kind,
            mime: entry.mime || (/png/.test(entry.dataUrl) ? "image/png" : "image/jpeg"),
            size: entry.size || policy.dataUrlByteLength(entry.dataUrl),
            width: Number(entry.width || 0),
            height: Number(entry.height || 0),
            recordKey: entry.recordKey || "",
            ownerKey: entry.ownerKey || "",
            createdAt: entry.createdAt || 1
        };
        payloads.set(mediaId, { ...reference, dataUrl: entry.dataUrl });
        return reference;
    },
    async getPayload(id) {
        return payloads.get(id) || null;
    },
    async remove(id) {
        removed.push(id);
        payloads.delete(id);
    },
    isReference(value) {
        return Boolean(value?.mediaId && !String(value.dataUrl || "").startsWith("data:"));
    },
    buildId(prefix) {
        return `${prefix}-${String(++idCounter).padStart(8, "0")}`;
    }
};
const processor = {
    async processFiles(files) {
        return Array.from(files).map((file, index) => ({
            id: `media-photo-${index + 1}`,
            dataUrl: index === 0 ? photoDataUrl : photo2DataUrl,
            mime: "image/jpeg",
            size: index === 0 ? 1200 : 1300,
            width: 1000,
            height: 500,
            thumbnail: { dataUrl: index === 0 ? photoDataUrl : photo2DataUrl }
        }));
    }
};
class FakeSignaturePad {
    constructor() {
        this.empty = true;
    }
    initialize() { return { initialized: true }; }
    clear() { this.empty = true; }
    destroy() {}
    exportSignature() {
        this.empty = false;
        return {
            id: "signature-1234567890abcdef",
            dataUrl: signatureDataUrl,
            mime: "image/png",
            size: 700,
            width: 640,
            height: 240,
            strokeCount: 1,
            pointCount: 3,
            empty: false
        };
    }
    buildSafeSummary(value) {
        return { id: value.id, mime: value.mime, size: value.size, strokeCount: 1, pointCount: 3, empty: false };
    }
}

context.window.MediaProcessor = processor;
context.window.MediaStore = mediaStore;
context.window.MediaPolicy = policy;
context.window.SignaturePadClass = FakeSignaturePad;
vm.runInNewContext(managerCode, context);
const AttendanceEvidenceManager = context.window.AttendanceEvidenceManagerClass;
const manager = new AttendanceEvidenceManager(processor, mediaStore, policy, FakeSignaturePad);
await manager.setRecordContext({ roomId: "room-media-test", date: "2026-08-12", record: null });
manager.attachSignaturePad({ getContext: () => ({}) });
await manager.addPhotos([
    { name: "fixture-a.jpg", type: "image/jpeg", size: 2000 },
    { name: "fixture-b.jpg", type: "image/jpeg", size: 2100 }
]);
await manager.commitSignature();

const state = plain(manager.getState());
assert.equal(state.photoCount, 2, "Attendance evidence draft must contain two photos");
assert.equal(state.signaturePresent, true, "Attendance evidence draft must contain Teacher signature");
assert.equal(state.queueSafe.summary.photoCount, 2);
assert.equal(state.queueSafe.summary.signatureCount, 1);
assert.equal(JSON.stringify(state).includes("data:image"), false, "Safe manager state must exclude Data URLs");

const legacyEvidence = await manager.buildLegacyEvidence();
assert.deepEqual(Array.from(legacyEvidence.photos), [photoDataUrl, photo2DataUrl], "Online save must hydrate legacy-compatible photo Data URLs");
assert.equal(legacyEvidence.signature, signatureDataUrl, "Online save must hydrate legacy-compatible Teacher signature");

let savedInput = null;
const attendanceManager = {
    async save(input) {
        savedInput = input;
        return { key: "room-media-test_2026-08-12", record: { clsId: input.roomId, ...input } };
    }
};
let queuedInput = null;
let replayedEntry = null;
const syncService = {
    queueAttendance(session, input) {
        queuedInput = input;
        return { ...input, type: "attendance" };
    },
    async replayEntry(session, entry) {
        replayedEntry = entry;
        return { record: entry.record };
    }
};
const adapterWindow = {
    AttendanceEvidenceManager: manager,
    AttendanceManager: attendanceManager,
    SyncService: syncService
};
const adapterContext = { window: adapterWindow, Error, Promise, console };
vm.runInNewContext(adapterCode, adapterContext);
const adapterStatus = plain(adapterWindow.AttendanceEvidenceAdapter.install());
assert.deepEqual(adapterStatus, { installed: true, attendanceManager: true, syncService: true });

await attendanceManager.save({
    roomId: "room-media-test",
    date: "2026-08-12",
    data: { s1: "present" },
    photos: [],
    signature: ""
});
assert.deepEqual(Array.from(savedInput.photos), [photoDataUrl, photo2DataUrl], "Adapter must hydrate photos only at online Attendance save boundary");
assert.equal(savedInput.signature, signatureDataUrl, "Adapter must hydrate signature only at online Attendance save boundary");
assert.equal(manager.getState().dirty, false, "Successful Attendance save must accept the evidence draft");

const queued = syncService.queueAttendance(
    { role: "teacher", roomId: "room-media-test" },
    {
        key: "room-media-test_2026-08-12",
        roomId: "room-media-test",
        record: savedInput,
        baselinePresent: 0
    }
);
const queueJson = JSON.stringify(queued);
assert.equal(queueJson.includes("data:image"), false, "Attendance Queue record must exclude photo and signature Data URLs");
assert.equal(queueJson.includes("fixture-a.jpg"), false, "Attendance Queue record must exclude original file names");
assert.equal(queuedInput.record.photos.length, 2);
assert.ok(queuedInput.record.photos.every(item => mediaStore.isReference(item)), "Attendance Queue must contain photo references only");
assert.ok(mediaStore.isReference(queuedInput.record.signature), "Attendance Queue must contain a signature reference only");

await syncService.replayEntry(
    { role: "teacher", roomId: "room-media-test" },
    { type: "attendance", roomId: "room-media-test", record: queuedInput.record }
);
assert.deepEqual(Array.from(replayedEntry.record.photos), [photoDataUrl, photo2DataUrl], "Attendance replay must hydrate photos immediately before Service replay");
assert.equal(replayedEntry.record.signature, signatureDataUrl, "Attendance replay must hydrate signature immediately before Service replay");
assert.equal("evidence" in replayedEntry.record, false, "Internal evidence manifest must not be written to the legacy Attendance record");

await manager.setRecordContext({
    roomId: "room-media-test",
    date: "2026-08-13",
    record: { photos: [photoDataUrl], signature: signatureDataUrl }
});
assert.throws(
    () => manager.buildQueueSafeRecordSync({ roomId: "room-media-test", date: "2026-08-13" }),
    error => error.code === "MEDIA_LEGACY_QUEUE_REQUIRES_ONLINE",
    "Legacy inline evidence must be blocked from Queue rather than leaked"
);

await manager.setRecordContext({ roomId: "room-media-test", date: "2026-08-14", record: null });
manager.attachSignaturePad({ getContext: () => ({}) });
await manager.addPhotos([{ name: "draft.jpg", type: "image/jpeg", size: 2000 }]);
const draftId = manager.photoReferences[0].mediaId;
await manager.clear();
assert.ok(removed.includes(draftId), "Logout or context cleanup must remove unsaved draft payloads");

console.log("Attendance Media and Signature integration checks passed.");
