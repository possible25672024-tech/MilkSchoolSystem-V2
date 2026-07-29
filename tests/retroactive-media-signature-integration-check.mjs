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
const managerCode = read("modules/media/retroactiveEvidenceManager.js");
const adapterCode = read("modules/media/retroactiveEvidenceAdapter.js");
const viewCode = read("modules/media/retroactiveEvidenceView.js");
const retroManagerCode = read("modules/retroactive/retroactiveMilkManager.js");
const appCode = read("modules/core/app.js");

for (const [name, code] of [
    ["retroactiveEvidenceManager.js", managerCode],
    ["retroactiveEvidenceAdapter.js", adapterCode],
    ["retroactiveEvidenceView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage", "roomStock", "mainStock", "stockTransactions", "stockLog"]) {
    assert.ok(!managerCode.includes(forbidden), `RetroactiveEvidenceManager must not contain ${forbidden}`);
    assert.ok(!viewCode.includes(forbidden), `RetroactiveEvidenceView must not contain ${forbidden}`);
}
assert.ok(viewCode.includes("รูปถ่ายและลายเซ็นผู้รับนมย้อนหลัง"));
assert.ok(viewCode.includes("retroactive-evidence-photo-input"));
assert.ok(viewCode.includes("retroactive-evidence-signature-canvas"));
assert.ok(viewCode.includes("ชื่อผู้รับนม/ผู้ปกครอง"));
assert.ok(retroManagerCode.includes("milkapp:retro-preview-changed"), "Retroactive preview must publish evidence context");
assert.ok(appCode.includes('import("../media/retroactiveEvidenceManager.js")'));
assert.ok(appCode.includes('import("../media/retroactiveEvidenceAdapter.js")'));
assert.ok(appCode.includes('import("../media/retroactiveEvidenceView.js")'));

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

const photoDataUrl = "data:image/jpeg;base64," + Buffer.alloc(1200, 11).toString("base64");
const photo2DataUrl = "data:image/jpeg;base64," + Buffer.alloc(1300, 12).toString("base64");
const signatureDataUrls = [
    "data:image/png;base64," + Buffer.alloc(700, 13).toString("base64"),
    "data:image/png;base64," + Buffer.alloc(750, 14).toString("base64")
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
            id: `retro-photo-${index + 1}`,
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
            id: `retro-signature-${String(index + 1).padStart(8, "0")}`,
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
const RetroactiveEvidenceManager = context.window.RetroactiveEvidenceManagerClass;
const evidenceManager = new RetroactiveEvidenceManager(processor, mediaStore, policy, FakeSignaturePad);
const students = [
    { id: "s1", name: "นักเรียนหนึ่ง" },
    { id: "s2", name: "นักเรียนสอง" }
];
await evidenceManager.setRecordContext({
    roomId: "retro-media-room",
    academicYear: "2569",
    semester: "1",
    retroStart: "2026-08-03",
    retroEnd: "2026-08-07",
    record: null,
    owners: students
});
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([
    { name: "retro-a.jpg", type: "image/jpeg", size: 2000 },
    { name: "retro-b.jpg", type: "image/jpeg", size: 2100 }
]);
evidenceManager.selectOwner("s1");
await evidenceManager.commitActiveSignature("ผู้ปกครองหนึ่ง");
evidenceManager.selectOwner("s2");
await evidenceManager.commitActiveSignature("ผู้ปกครองสอง");

const safeState = plain(evidenceManager.getState());
assert.equal(safeState.photoCount, 2);
assert.equal(safeState.ownerCount, 2);
assert.equal(safeState.signatureCount, 2);
assert.equal(JSON.stringify(safeState).includes("data:image"), false, "Safe Retroactive evidence state must exclude Data URLs");
assert.equal(JSON.stringify(safeState).includes("retro-a.jpg"), false, "Safe Retroactive evidence state must exclude original file names");
assert.equal(JSON.stringify(safeState).includes("ผู้ปกครอง"), false, "Safe Retroactive evidence state must exclude receiver identities");

const legacyEvidence = await evidenceManager.buildLegacyEvidence();
assert.deepEqual(Array.from(legacyEvidence.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(legacyEvidence.signature, "");
assert.equal(legacyEvidence.signatures.s1.sig, signatureDataUrls[0]);
assert.equal(legacyEvidence.signatures.s1.receiverName, "ผู้ปกครองหนึ่ง");
assert.equal(legacyEvidence.signatures.s2.sig, signatureDataUrls[1]);
assert.equal(legacyEvidence.signatures.s2.receiverName, "ผู้ปกครองสอง");

let capturedInput = null;
const retroactiveMilkService = {
    buildRecord(session, preview, input) {
        capturedInput = input;
        return {
            roomId: preview.roomId,
            studentCount: preview.studentCount,
            totalBoxes: preview.totalBoxes,
            signature: "",
            signatures: {},
            photos: []
        };
    }
};
const retroactiveMilkManager = {
    async issue(input) {
        const record = retroactiveMilkService.buildRecord(
            { role: "teacher", roomId: "retro-media-room" },
            { roomId: "retro-media-room", studentCount: 2, totalBoxes: 10 },
            input
        );
        return {
            id: "retro-record-1",
            record,
            quantity: 10,
            stockQueued: true,
            queueEntry: {
                type: "roomStockAdjust",
                roomId: "retro-media-room",
                referenceId: "retro-record-1",
                operationType: "RETRO",
                difference: 10
            }
        };
    }
};
const adapterWindow = {
    RetroactiveEvidenceManager: evidenceManager,
    RetroactiveMilkService: retroactiveMilkService,
    RetroactiveMilkManager: retroactiveMilkManager
};
vm.runInNewContext(adapterCode, { window: adapterWindow, Object, Array, String, Error, Promise, console });
const adapterStatus = plain(adapterWindow.RetroactiveEvidenceAdapter.install());
assert.deepEqual(adapterStatus, { installed: true, retroactiveMilkService: true, retroactiveMilkManager: true });

const issueResult = await retroactiveMilkManager.issue({
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-12",
    retroStart: "2026-08-03",
    retroEnd: "2026-08-07",
    note: "หลักฐานนมย้อนหลังแบบแยก"
});
assert.deepEqual(Array.from(capturedInput.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(capturedInput.signature, "");
assert.equal(capturedInput.signatures.s1.receiverName, "ผู้ปกครองหนึ่ง");
assert.deepEqual(Array.from(issueResult.record.photos), [photoDataUrl, photo2DataUrl]);
assert.equal(issueResult.record.signatures.s2.sig, signatureDataUrls[1]);
assert.equal(issueResult.record.signature, "");
assert.equal(evidenceManager.getState().dirty, false, "Saved Retroactive evidence must no longer be treated as an unsaved draft");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("data:image"), false, "Retroactive Room Stock Queue entry must exclude evidence payloads");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("ผู้ปกครอง"), false, "Retroactive Room Stock Queue entry must exclude receiver identity");

await evidenceManager.setRecordContext({
    roomId: "retro-media-room",
    academicYear: "2569",
    semester: "1",
    retroStart: "2026-08-10",
    retroEnd: "2026-08-14",
    record: null,
    owners: [students[0]]
});
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([{ name: "draft.jpg", type: "image/jpeg", size: 2000 }]);
const draftId = evidenceManager.photoReferences[0].mediaId;
await evidenceManager.clear();
assert.ok(removed.includes(draftId), "Logout or context cleanup must remove unsaved Retroactive evidence payloads");

console.log("Retroactive Milk Media and Signature integration checks passed.");