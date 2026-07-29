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

for (const [name, code] of [["mediaPolicy.js", policyCode], ["mediaStore.js", storeCode], ["mediaEnvelope.js", envelopeCode]]) {
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
assert.equal(typeof MediaStoreClass, "function");
assert.equal(typeof MediaEnvelopeClass, "function");

class MemoryAdapter {
    constructor() {
        this.records = new Map();
        this.getCalls = 0;
    }

    async put(record) {
        this.records.set(record.id, { ...record });
        return record.id;
    }

    async get(id) {
        this.getCalls += 1;
        const record = this.records.get(id);
        return record ? { ...record } : undefined;
    }

    async delete(id) {
        this.records.delete(id);
    }

    async clear() {
        this.records.clear();
    }

    async list() {
        return [...this.records.values()].map(record => ({ ...record }));
    }
}

function dataUrl(bytes, mime = "image/png") {
    const payload = Buffer.alloc(bytes, 7).toString("base64");
    return `data:${mime};base64,${payload}`;
}

const policy = new MediaPolicyClass({
    maxProcessedBytes: 64 * 1024,
    maxSignatureBytes: 32 * 1024,
    maxAggregateBytes: 256 * 1024
});
const adapter = new MemoryAdapter();
let now = 1000;
const store = new MediaStoreClass(adapter, policy, { clock: () => ++now });
const envelope = new MediaEnvelopeClass(store, policy);

const photo = {
    id: "photo-12345678",
    dataUrl: dataUrl(1024, "image/jpeg"),
    mime: "image/jpeg",
    size: 1024,
    width: 800,
    height: 600
};
const teacherSignature = {
    id: "signature-teacher1",
    dataUrl: dataUrl(700, "image/png"),
    mime: "image/png",
    size: 700,
    width: 640,
    height: 240
};
const parentSignature = {
    id: "signature-parent01",
    dataUrl: dataUrl(650, "image/png"),
    mime: "image/png",
    size: 650,
    width: 640,
    height: 240
};

const manifest = await envelope.persistEvidence({
    photos: [photo],
    signature: teacherSignature,
    signatures: {
        student01: { sig: parentSignature.dataUrl, id: parentSignature.id, size: parentSignature.size, mime: parentSignature.mime, width: 640, height: 240 }
    }
}, {
    recordKey: "isolated-room_2026-08-10",
    signatureOwnerKey: "teacher"
});

assert.equal(manifest.version, 1);
assert.equal(manifest.recordKey, "isolated-room_2026-08-10");
assert.equal(manifest.photos.length, 1);
assert.equal(manifest.summary.photoCount, 1);
assert.equal(manifest.summary.signatureCount, 2);
assert.equal(adapter.records.size, 3, "Each payload must be stored separately");
assert.equal(adapter.getCalls, 0, "Persisting a manifest must not eagerly reload payloads");

for (const record of adapter.records.values()) {
    assert.ok(String(record.payload).startsWith("data:image/"), "Adapter keeps payload in the isolated store");
    assert.equal(record.dataUrl, undefined, "Adapter record must not duplicate dataUrl and payload");
}

const metadata = await store.listMetadata({ recordKey: "isolated-room_2026-08-10" });
assert.equal(metadata.length, 3);
for (const item of metadata) {
    assert.equal("dataUrl" in item, false, "Metadata list must not expose data URLs");
    assert.equal("payload" in item, false, "Metadata list must not expose payloads");
    assert.ok(item.mediaId);
}

const photoMetadata = await store.getMetadata("photo-12345678");
assert.equal(photoMetadata.mediaId, "photo-12345678");
assert.equal("dataUrl" in photoMetadata, false);
const callsAfterMetadata = adapter.getCalls;

const hydratedPhotoOnly = await envelope.hydrateEvidence(manifest, {
    photos: true,
    signature: false,
    signatures: false
});
assert.equal(hydratedPhotoOnly.photos.length, 1);
assert.equal(hydratedPhotoOnly.signature, null);
assert.deepEqual(Object.keys(hydratedPhotoOnly.signatures), []);
assert.equal(adapter.getCalls, callsAfterMetadata + 1, "Photo-only hydration must read only the requested payload");
assert.equal(hydratedPhotoOnly.photos[0].dataUrl, photo.dataUrl);

const hydratedAll = await envelope.hydrateEvidence(manifest);
assert.equal(hydratedAll.photos.length, 1);
assert.equal(hydratedAll.signature.dataUrl, teacherSignature.dataUrl);
assert.equal(hydratedAll.signatures.student01.dataUrl, parentSignature.dataUrl);

const removed = await store.remove("photo-12345678");
assert.equal(removed.mediaId, "photo-12345678");
assert.equal(await store.getMetadata("photo-12345678"), null);
assert.equal((await store.listMetadata()).length, 2);

assert.throws(
    () => store.normalizeId("bad/id"),
    error => error?.code === "MEDIA_ID_INVALID"
);
assert.throws(
    () => store.normalizeKind("document"),
    error => error?.code === "MEDIA_KIND_INVALID"
);

await store.clear();
assert.equal((await store.listMetadata()).length, 0);

console.log("Media store checks passed.");
