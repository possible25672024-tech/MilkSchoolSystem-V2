import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const policyCode = read("modules/media/mediaPolicy.js");
const storeCode = read("modules/media/mediaStore.js");
const envelopeCode = read("modules/media/mediaEnvelope.js");
const queueCode = read("modules/storage/queueStorage.js");
const managerCode = read("modules/sync/syncManager.js");
const viewCode = read("modules/sync/syncView.js");

for (const [name, code] of [
    ["mediaPolicy.js", policyCode],
    ["mediaStore.js", storeCode],
    ["mediaEnvelope.js", envelopeCode],
    ["queueStorage.js", queueCode],
    ["syncManager.js", managerCode],
    ["syncView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(code), `${name} must contain valid JavaScript`);
}

const context = {
    window: {},
    TextEncoder,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    Set,
    Map,
    Promise,
    Error,
    console
};
context.window.window = context.window;
vm.runInNewContext(policyCode, context);
vm.runInNewContext(storeCode, context);
vm.runInNewContext(envelopeCode, context);

const { MediaPolicyClass, MediaStoreClass, MediaEnvelopeClass } = context.window;
class MemoryAdapter {
    constructor() {
        this.records = new Map();
    }
    async put(record) { this.records.set(record.id, { ...record }); }
    async get(id) { return this.records.has(id) ? { ...this.records.get(id) } : undefined; }
    async delete(id) { this.records.delete(id); }
    async clear() { this.records.clear(); }
    async list() { return [...this.records.values()].map(record => ({ ...record })); }
}

function dataUrl(bytes, mime = "image/png") {
    return `data:${mime};base64,${Buffer.alloc(bytes, 9).toString("base64")}`;
}

const policy = new MediaPolicyClass({
    maxProcessedBytes: 64 * 1024,
    maxSignatureBytes: 32 * 1024,
    maxAggregateBytes: 256 * 1024
});
const store = new MediaStoreClass(new MemoryAdapter(), policy, { clock: () => 123456 });
const envelope = new MediaEnvelopeClass(store, policy);

const rawEvidence = {
    photos: [
        {
            id: "photo-sensitive1",
            fileName: "student-room-secret.jpg",
            originalName: "parent-private-photo.jpg",
            dataUrl: dataUrl(1200, "image/jpeg"),
            mime: "image/jpeg",
            size: 1200,
            width: 800,
            height: 600
        }
    ],
    signature: {
        id: "signature-teacher1",
        dataUrl: dataUrl(800),
        mime: "image/png",
        size: 800,
        width: 640,
        height: 240
    },
    signatures: {
        student01: {
            sig: dataUrl(700),
            fileName: "parent-signature-secret.png"
        }
    }
};

assert.equal(envelope.containsSensitivePayload(rawEvidence), true, "Raw evidence must be detected as sensitive");
const prePersistenceSummary = envelope.buildQueueSafeEvidence(rawEvidence);
assert.equal(prePersistenceSummary.version, 0);
assert.equal(prePersistenceSummary.summary.photoCount, 1);
assert.equal(prePersistenceSummary.summary.signatureCount, 2);
assert.equal(prePersistenceSummary.summary.requiresPersistence, true);
const prePersistenceJson = JSON.stringify(prePersistenceSummary);
assert.ok(!prePersistenceJson.includes("data:image"));
assert.ok(!prePersistenceJson.includes("student-room-secret"));
assert.ok(!prePersistenceJson.includes("parent-signature-secret"));

const manifest = await envelope.persistEvidence(rawEvidence, {
    recordKey: "isolated-room_2026-08-11",
    signatureOwnerKey: "teacher"
});
const queueSafe = envelope.buildQueueSafeEvidence(manifest);
assert.equal(queueSafe.version, 1);
assert.equal(queueSafe.summary.photoCount, 1);
assert.equal(queueSafe.summary.signatureCount, 2);
assert.ok(queueSafe.photos[0].mediaId);
assert.ok(queueSafe.signature.mediaId);
assert.ok(queueSafe.signatures.student01.mediaId);
assert.equal(envelope.containsSensitivePayload(queueSafe), false, "Queue-safe manifest must contain references only");

const queueEntry = {
    type: "attendance",
    key: "isolated-room_2026-08-11",
    roomId: "isolated-room",
    record: {
        roomId: "isolated-room",
        date: "2026-08-11",
        teacher: "ครูทดสอบ",
        mediaEvidence: queueSafe,
        photos: rawEvidence.photos,
        signature: rawEvidence.signature,
        signatures: rawEvidence.signatures,
        payload: "do-not-persist-this",
        nested: {
            sourceName: "camera-secret.jpg",
            ordinaryNote: "หมายเหตุที่ปลอดภัย"
        }
    }
};
const redactedEntry = envelope.redactQueueValue(queueEntry);
const redactedJson = JSON.stringify(redactedEntry);
assert.ok(!redactedJson.includes("data:image"), "Queue redaction must remove Data URLs");
assert.ok(!redactedJson.includes("do-not-persist-this"), "Queue redaction must remove raw payload fields");
assert.ok(!redactedJson.includes("camera-secret.jpg"), "Queue redaction must remove source names");
assert.ok(!redactedJson.includes("student-room-secret.jpg"), "Queue redaction must remove file names");
assert.ok(redactedJson.includes("หมายเหตุที่ปลอดภัย"), "Queue redaction must preserve ordinary operational notes");
assert.ok(redactedJson.includes(queueSafe.photos[0].mediaId), "Queue redaction must preserve safe media references");
assert.equal(envelope.containsSensitivePayload(redactedEntry), false);

const forbiddenRuntimeTokens = [
    "dataUrl",
    "payload",
    "fileName",
    "originalName"
];
for (const token of forbiddenRuntimeTokens) {
    assert.ok(!managerCode.includes(`.${token}`), `SyncManager must not expose ${token}`);
    assert.ok(!viewCode.includes(`.${token}`), `SyncView must not render ${token}`);
}
assert.ok(!managerCode.includes("record.photos"), "SyncManager safe summaries must not expose photos");
assert.ok(!managerCode.includes("record.signature"), "SyncManager safe summaries must not expose record signatures");
assert.ok(!viewCode.includes("mediaEvidence.photos"), "SyncView must not render media references as images");

assert.ok(
    queueCode.includes("record: { ...record }"),
    "Existing QueueStorage compatibility remains unchanged until MediaEnvelope integration"
);
assert.ok(
    !queueCode.includes("window.MediaStore") && !queueCode.includes("window.MediaEnvelope"),
    "QueueStorage must not own media payload storage"
);

console.log("Media Queue redaction checks passed.");
