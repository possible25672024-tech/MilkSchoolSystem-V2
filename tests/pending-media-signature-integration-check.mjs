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
const managerCode = read("modules/media/pendingEvidenceManager.js");
const adapterCode = read("modules/media/pendingEvidenceAdapter.js");
const viewCode = read("modules/media/pendingEvidenceView.js");
const appCode = read("modules/core/app.js");

for (const [name, code] of [
    ["pendingEvidenceManager.js", managerCode],
    ["pendingEvidenceAdapter.js", adapterCode],
    ["pendingEvidenceView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage", "roomStock", "mainStock", "stockTransactions", "stockLog"]) {
    assert.ok(!managerCode.includes(forbidden), `PendingEvidenceManager must not contain ${forbidden}`);
    assert.ok(!viewCode.includes(forbidden), `PendingEvidenceView must not contain ${forbidden}`);
}
assert.ok(viewCode.includes("รูปถ่ายและลายเซ็นผู้รับนมค้าง"));
assert.ok(viewCode.includes("pending-evidence-photo-input"));
assert.ok(viewCode.includes("pending-evidence-signature-canvas"));
assert.ok(viewCode.includes("ชื่อผู้รับนม"));
assert.ok(appCode.includes('import("../media/pendingEvidenceManager.js")'));
assert.ok(appCode.includes('import("../media/pendingEvidenceAdapter.js")'));
assert.ok(appCode.includes('import("../media/pendingEvidenceView.js")'));

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

const photoDataUrl = "data:image/jpeg;base64," + Buffer.alloc(1200, 3).toString("base64");
const photo2DataUrl = "data:image/jpeg;base64," + Buffer.alloc(1300, 4).toString("base64");
const signatureDataUrls = [
    "data:image/png;base64," + Buffer.alloc(700, 5).toString("base64"),
    "data:image/png;base64," + Buffer.alloc(750, 6).toString("base64")
];
const payloads = new Map();
const removed = [];
let mediaCounter = 0;
const mediaStore = {
    async put(entry) {
        const mediaId = String(entry.id || `media-${++mediaCounter}`).padEnd(8, "0");
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
    }
};
const processor = {
    async processFiles(files) {
        return Array.from(files).map((file, index) => ({
            id: `pending-photo-${index + 1}`,
            dataUrl: index === 0 ? photoDataUrl : photo2DataUrl,
            mime: "image/jpeg",
            size: index === 0 ? 1200 : 1300,
            width: 1000,
            height: 500,
            thumbnail: { dataUrl: index === 0 ? photoDataUrl : photo2DataUrl }
        }));
    }
};
let signatureCounter = 0;
class FakeSignaturePad {
    initialize() { return { initialized: true }; }
    clear() {}
    destroy() {}
    exportSignature() {
        const index = signatureCounter++;
        return {
            id: `pending-signature-${String(index + 1).padStart(8, "0")}`,
            dataUrl: signatureDataUrls[index],
            mime: "image/png",
            size: index === 0 ? 700 : 750,
            width: 640,
            height: 240,
            empty: false
        };
    }
}

context.window.MediaProcessor = processor;
context.window.MediaStore = mediaStore;
context.window.MediaPolicy = policy;
context.window.SignaturePadClass = FakeSignaturePad;
vm.runInNewContext(managerCode, context);
const PendingEvidenceManager = context.window.PendingEvidenceManagerClass;
const evidenceManager = new PendingEvidenceManager(processor, mediaStore, policy, FakeSignaturePad);
const selectedPairs = [
    { key: "s1_2026-08-10", studentId: "s1", date: "2026-08-10", name: "นักเรียนหนึ่ง" },
    { key: "s2_2026-08-11", studentId: "s2", date: "2026-08-11", name: "นักเรียนสอง" }
];
await evidenceManager.setRecordContext({
    roomId: "pending-media-room",
    weekStart: "2026-08-10",
    weekEnd: "2026-08-14",
    record: null,
    owners: selectedPairs
});
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([
    { name: "pending-a.jpg", type: "image/jpeg", size: 2000 },
    { name: "pending-b.jpg", type: "image/jpeg", size: 2100 }
]);
evidenceManager.selectOwner(selectedPairs[0].key);
await evidenceManager.commitActiveSignature("ผู้ปกครองหนึ่ง");
evidenceManager.selectOwner(selectedPairs[1].key);
await evidenceManager.commitActiveSignature("ผู้ปกครองสอง");

const safeState = plain(evidenceManager.getState());
assert.equal(safeState.photoCount, 2);
assert.equal(safeState.selectedOwnerCount, 2);
assert.equal(safeState.signatureCount, 2);
assert.equal(JSON.stringify(safeState).includes("data:image"), false, "Safe Pending evidence state must exclude Data URLs");
assert.equal(JSON.stringify(safeState).includes("pending-a.jpg"), false, "Safe Pending evidence state must exclude original file names");

const legacyEvidence = await evidenceManager.buildLegacyEvidence(selectedPairs);
assert.deepEqual(Array.from(legacyEvidence.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(legacyEvidence.signature, "");
assert.equal(legacyEvidence.signatures[selectedPairs[0].key].sig, signatureDataUrls[0]);
assert.equal(legacyEvidence.signatures[selectedPairs[0].key].receiverName, "ผู้ปกครองหนึ่ง");
assert.equal(legacyEvidence.signatures[selectedPairs[1].key].sig, signatureDataUrls[1]);
assert.equal(legacyEvidence.signatures[selectedPairs[1].key].receiverName, "ผู้ปกครองสอง");

let capturedInput = null;
const pendingMilkService = {
    buildRecord(session, state, pairs, input) {
        capturedInput = input;
        return {
            record: {
                roomId: state.roomId,
                students: {},
                totalBoxes: pairs.length,
                signature: "",
                signatures: {},
                photos: []
            },
            selected: pairs
        };
    }
};
const pendingMilkManager = {
    async issue(input) {
        const built = pendingMilkService.buildRecord(
            { role: "teacher", roomId: "pending-media-room" },
            { roomId: "pending-media-room" },
            input.selectedPairs,
            input
        );
        return {
            id: "pending-record-1",
            record: built.record,
            quantity: input.selectedPairs.length,
            stockQueued: true,
            queueEntry: {
                type: "roomStockAdjust",
                roomId: "pending-media-room",
                referenceId: "pending-record-1",
                operationType: "PENDING",
                difference: input.selectedPairs.length
            }
        };
    }
};
const adapterWindow = {
    PendingEvidenceManager: evidenceManager,
    PendingMilkService: pendingMilkService,
    PendingMilkManager: pendingMilkManager
};
vm.runInNewContext(adapterCode, { window: adapterWindow, Object, Array, String, Error, Promise, console });
const adapterStatus = plain(adapterWindow.PendingEvidenceAdapter.install());
assert.deepEqual(adapterStatus, { installed: true, pendingMilkService: true, pendingMilkManager: true });

const issueResult = await pendingMilkManager.issue({
    weekDate: "2026-08-12",
    selectedPairs,
    note: "หลักฐานนมค้างแบบแยก"
});
assert.deepEqual(Array.from(capturedInput.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(capturedInput.signature, "");
assert.equal(capturedInput.signatures[selectedPairs[0].key].receiverName, "ผู้ปกครองหนึ่ง");
assert.deepEqual(Array.from(issueResult.record.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(issueResult.record.signatures[selectedPairs[1].key].sig, signatureDataUrls[1]);
assert.equal(issueResult.record.signature, "");
assert.equal(evidenceManager.getState().dirty, false, "Saved Pending evidence must no longer be treated as an unsaved draft");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("data:image"), false, "Pending Room Stock Queue entry must exclude evidence payloads");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("ผู้ปกครอง"), false, "Pending Room Stock Queue entry must exclude receiver identity");

await evidenceManager.setRecordContext({
    roomId: "pending-media-room",
    weekStart: "2026-08-17",
    weekEnd: "2026-08-21",
    record: null,
    owners: [selectedPairs[0]]
});
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([{ name: "draft.jpg", type: "image/jpeg", size: 2000 }]);
const draftId = evidenceManager.photoReferences[0].mediaId;
await evidenceManager.clear();
assert.ok(removed.includes(draftId), "Logout or context cleanup must remove unsaved Pending evidence payloads");

console.log("Pending Milk Media and Signature integration checks passed.");
