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
const managerCode = read("modules/media/vacationEvidenceManager.js");
const adapterCode = read("modules/media/vacationEvidenceAdapter.js");
const viewCode = read("modules/media/vacationEvidenceView.js");
const vacationManagerCode = read("modules/vacation/vacationMilkManager.js");
const appCode = read("modules/core/app.js");

for (const [name, code] of [
    ["vacationEvidenceManager.js", managerCode],
    ["vacationEvidenceAdapter.js", adapterCode],
    ["vacationEvidenceView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage", "roomStock", "mainStock", "stockTransactions", "stockLog"]) {
    assert.ok(!managerCode.includes(forbidden), `VacationEvidenceManager must not contain ${forbidden}`);
    assert.ok(!viewCode.includes(forbidden), `VacationEvidenceView must not contain ${forbidden}`);
}
assert.ok(viewCode.includes("รูปถ่ายและลายเซ็นผู้ปกครอง/ผู้รับนมช่วงปิดเทอม"));
assert.ok(viewCode.includes("vacation-evidence-photo-input"));
assert.ok(viewCode.includes("vacation-evidence-signature-canvas"));
assert.ok(viewCode.includes("ชื่อผู้ปกครอง/ผู้รับนม"));
assert.ok(viewCode.includes('.vacation-milk-summary'), "Vacation evidence must mount beside the existing summary class");
assert.ok(vacationManagerCode.includes("milkapp:vacation-preview-changed"), "Vacation manager must publish evidence preview context");
assert.ok(appCode.includes('import("../media/vacationEvidenceManager.js")'));
assert.ok(appCode.includes('import("../media/vacationEvidenceAdapter.js")'));
assert.ok(appCode.includes('import("../media/vacationEvidenceView.js")'));
assert.ok(appCode.includes("vacationMilkView?.handlePreviewChange?.()"), "App must republish the active preview after evidence view initialization");

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

const photoDataUrls = [
    "data:image/jpeg;base64," + Buffer.alloc(1200, 11).toString("base64"),
    "data:image/jpeg;base64," + Buffer.alloc(1300, 12).toString("base64")
];
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
            id: `vacation-photo-${index + 1}`,
            dataUrl: photoDataUrls[index] || photoDataUrls[0],
            mime: "image/jpeg",
            size: index === 0 ? 1200 : 1300,
            width: 1000,
            height: 500,
            thumbnail: { dataUrl: photoDataUrls[index] || photoDataUrls[0] }
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
            id: `vacation-signature-${String(index + 1).padStart(8, "0")}`,
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
const VacationEvidenceManager = context.window.VacationEvidenceManagerClass;
const evidenceManager = new VacationEvidenceManager(processor, mediaStore, policy, FakeSignaturePad);
const students = [
    { id: "s1", name: "นักเรียนหนึ่ง" },
    { id: "s2", name: "นักเรียนสอง" }
];
const contextInput = {
    roomId: "vacation-media-room",
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-10-01",
    days: 30,
    record: null,
    owners: students
};
await evidenceManager.setRecordContext(contextInput);
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([
    { name: "vacation-a.jpg", type: "image/jpeg", size: 2000 },
    { name: "vacation-b.jpg", type: "image/jpeg", size: 2100 }
]);
evidenceManager.selectOwner("s1");
await evidenceManager.commitActiveSignature("ผู้ปกครองหนึ่ง");
evidenceManager.selectOwner("s2");
await evidenceManager.commitActiveSignature("ผู้ปกครองสอง");

const safeState = plain(evidenceManager.getState());
assert.equal(safeState.photoCount, 2);
assert.equal(safeState.ownerCount, 2);
assert.equal(safeState.signatureCount, 2);
assert.equal(JSON.stringify(safeState).includes("data:image"), false, "Safe Vacation evidence state must exclude Data URLs");
assert.equal(JSON.stringify(safeState).includes("vacation-a.jpg"), false, "Safe Vacation evidence state must exclude original file names");
assert.equal(JSON.stringify(safeState).includes("ผู้ปกครองหนึ่ง"), false, "Safe Vacation evidence state must exclude receiver identity");

const preservedPhotoIds = evidenceManager.photoReferences.map(item => item.mediaId);
await evidenceManager.setRecordContext({ ...contextInput, owners: [...students].reverse() });
assert.deepEqual(evidenceManager.photoReferences.map(item => item.mediaId), preservedPhotoIds, "Unchanged Vacation record context must preserve evidence drafts");

const legacyEvidence = await evidenceManager.buildLegacyEvidence();
assert.deepEqual(Array.from(legacyEvidence.photos), photoDataUrls);
assert.equal(legacyEvidence.signature, "");
assert.equal(legacyEvidence.signatures.s1.sig, signatureDataUrls[0]);
assert.equal(legacyEvidence.signatures.s1.receiverName, "ผู้ปกครองหนึ่ง");
assert.equal(legacyEvidence.signatures.s2.sig, signatureDataUrls[1]);
assert.equal(legacyEvidence.signatures.s2.receiverName, "ผู้ปกครองสอง");

let capturedInput = null;
const vacationMilkService = {
    buildRecord(session, preview, input) {
        capturedInput = input;
        return {
            roomId: preview.roomId,
            studentCount: preview.studentCount,
            days: preview.days,
            totalBoxes: preview.totalBoxes,
            signature: "",
            signatures: {},
            photos: []
        };
    }
};
const vacationMilkManager = {
    async issue(input) {
        const record = vacationMilkService.buildRecord(
            { role: "teacher", roomId: "vacation-media-room" },
            { roomId: "vacation-media-room", studentCount: 2, days: 30, totalBoxes: 60 },
            input
        );
        return {
            id: "vacation-record-1",
            record,
            quantity: 60,
            stockQueued: true,
            queueEntry: {
                type: "roomStockAdjust",
                roomId: "vacation-media-room",
                referenceId: "vacation-record-1",
                operationType: "VACATION",
                difference: 60
            }
        };
    }
};
const adapterWindow = {
    VacationEvidenceManager: evidenceManager,
    VacationMilkService: vacationMilkService,
    VacationMilkManager: vacationMilkManager
};
vm.runInNewContext(adapterCode, { window: adapterWindow, Object, Array, String, Error, Promise, console });
const adapterStatus = plain(adapterWindow.VacationEvidenceAdapter.install());
assert.deepEqual(adapterStatus, { installed: true, vacationMilkService: true, vacationMilkManager: true });

const issueResult = await vacationMilkManager.issue({
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-10-01",
    days: 30,
    note: "หลักฐานนมปิดเทอมแบบแยก"
});
assert.deepEqual(Array.from(capturedInput.photos), photoDataUrls);
assert.equal(capturedInput.signature, "");
assert.equal(capturedInput.signatures.s1.receiverName, "ผู้ปกครองหนึ่ง");
assert.deepEqual(Array.from(issueResult.record.photos), photoDataUrls);
assert.equal(issueResult.record.signatures.s2.sig, signatureDataUrls[1]);
assert.equal(issueResult.record.signature, "");
assert.equal(evidenceManager.getState().dirty, false, "Saved Vacation evidence must no longer be treated as an unsaved draft");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("data:image"), false, "Vacation Room Stock Queue entry must exclude evidence payloads");
assert.equal(JSON.stringify(issueResult.queueEntry).includes("ผู้ปกครอง"), false, "Vacation Room Stock Queue entry must exclude receiver identity");

await evidenceManager.setRecordContext({
    ...contextInput,
    issueDate: "2026-10-02",
    days: 31,
    owners: [students[0]]
});
evidenceManager.attachSignaturePad({ getContext: () => ({}) });
await evidenceManager.addPhotos([{ name: "draft.jpg", type: "image/jpeg", size: 2000 }]);
const draftId = evidenceManager.photoReferences[0].mediaId;
await evidenceManager.clear();
assert.ok(removed.includes(draftId), "Logout or context cleanup must remove unsaved Vacation evidence payloads");

console.log("Vacation Milk Media and Signature integration checks passed.");