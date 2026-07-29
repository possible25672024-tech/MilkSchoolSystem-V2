import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const policyCode = fs.readFileSync(path.join(root, "modules/media/mediaPolicy.js"), "utf8");

assert.doesNotThrow(() => new vm.Script(policyCode), "mediaPolicy.js must contain valid JavaScript");
assert.ok(!policyCode.includes("FirebaseService"), "MediaPolicy must not access Firebase");
assert.ok(!policyCode.includes("fetch("), "MediaPolicy must not perform network requests");
assert.ok(!policyCode.includes("localStorage"), "MediaPolicy must not persist evidence");
assert.ok(!policyCode.includes("sessionStorage"), "MediaPolicy must not own authentication state");
assert.ok(!policyCode.includes("roomStockDelta"), "MediaPolicy must not calculate Room Stock mutations");
assert.ok(!policyCode.includes("mainStockDelta"), "MediaPolicy must not calculate Main Stock mutations");

const context = { window: {}, TextEncoder, String, Number, Object, Array, Math, Error, console };
vm.runInNewContext(policyCode, context);
const MediaPolicy = context.window.MediaPolicyClass;
assert.equal(typeof MediaPolicy, "function", "MediaPolicy class must be exposed for isolated tests");

const policy = new MediaPolicy();
const limits = policy.getLimits();
assert.equal(limits.maxPhotosPerRecord, 5, "Legacy parity must retain five photos per record");
assert.equal(limits.maxLongestEdge, 1000, "Legacy parity must retain a 1000px longest edge");
assert.equal(limits.jpegQuality, 0.7, "Legacy parity must retain JPEG quality 0.7");
assert.ok(limits.allowedSourceMimes.includes("image/jpeg"));
assert.ok(limits.allowedSourceMimes.includes("image/png"));
assert.ok(limits.allowedSourceMimes.includes("image/webp"));
assert.ok(!limits.allowedSourceMimes.includes("image/gif"));

assert.equal(policy.validateSourceFile({ type: "image/jpeg", size: 1024 * 1024 }).valid, true);
assert.equal(policy.validateSourceFile({ type: "image/gif", size: 1000 }).code, "MEDIA_SOURCE_MIME_UNSUPPORTED");
assert.equal(policy.validateSourceFile({ type: "image/jpeg", size: limits.maxSourceBytes + 1 }).code, "MEDIA_SOURCE_SIZE_EXCEEDED");
assert.equal(policy.validatePhotoCount(5).valid, true);
assert.equal(policy.validatePhotoCount(6).code, "MEDIA_PHOTO_COUNT_EXCEEDED");

const makeDataUrl = (mime, byteCount) => `data:${mime};base64,${Buffer.alloc(byteCount, 1).toString("base64")}`;
const photoDataUrl = makeDataUrl("image/jpeg", 32 * 1024);
const signatureDataUrl = makeDataUrl("image/png", 8 * 1024);
assert.equal(policy.dataUrlByteLength(photoDataUrl), 32 * 1024);
assert.equal(policy.mimeFromDataUrl(photoDataUrl), "image/jpeg");

const validPhoto = { dataUrl: photoDataUrl, width: 1000, height: 750 };
assert.equal(policy.validateProcessedPhoto(validPhoto).valid, true);
assert.equal(policy.validateProcessedPhoto({ ...validPhoto, width: 1001 }).code, "MEDIA_DIMENSIONS_EXCEEDED");
assert.equal(policy.validateProcessedPhoto({ dataUrl: makeDataUrl("image/jpeg", limits.maxProcessedBytes + 1), width: 1000, height: 750 }).code, "MEDIA_PROCESSED_SIZE_EXCEEDED");

assert.equal(policy.validateSignature("").valid, true);
assert.equal(policy.validateSignature(signatureDataUrl).valid, true);
assert.equal(policy.validateSignature(makeDataUrl("image/jpeg", 1024)).code, "SIGNATURE_MIME_UNSUPPORTED");

const evidence = {
    photos: [validPhoto, { dataUrl: photoDataUrl, width: 750, height: 1000 }],
    signature: signatureDataUrl,
    signatures: {
        student_1: { sig: signatureDataUrl, receiverName: "ผู้รับทดสอบ" },
        student_2: { sig: "", receiverName: "ยังไม่เซ็น" }
    }
};
const validEvidence = policy.validateRecordEvidence(evidence);
assert.equal(validEvidence.valid, true);
assert.equal(validEvidence.details.photoCount, 2);
assert.equal(validEvidence.details.signatureCount, 2);
assert.equal(validEvidence.details.aggregateBytes, (32 * 1024 * 2) + (8 * 1024 * 2));

const safeSummary = policy.buildSafeSummary(evidence);
assert.deepEqual(Object.keys(safeSummary).sort(), ["aggregateBytes", "code", "photoCount", "signatureCount", "valid"].sort());
assert.ok(!JSON.stringify(safeSummary).includes("data:image"));
assert.ok(!JSON.stringify(safeSummary).includes("ผู้รับทดสอบ"));

const smallAggregatePolicy = new MediaPolicy({ maxAggregateBytes: 40 * 1024 });
const aggregateResult = smallAggregatePolicy.validateRecordEvidence({ photos: [validPhoto], signature: signatureDataUrl });
assert.equal(aggregateResult.code, "MEDIA_AGGREGATE_SIZE_EXCEEDED");

console.log("Media policy checks passed.");
