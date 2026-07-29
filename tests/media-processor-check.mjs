import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const policyCode = read("modules/media/mediaPolicy.js");
const processorCode = read("modules/media/mediaProcessor.js");

assert.doesNotThrow(() => new vm.Script(processorCode), "mediaProcessor.js must contain valid JavaScript");
for (const forbidden of [
    "FirebaseService",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "roomStock",
    "mainStock",
    "ledger",
    "stockLog",
    "QueueStorage"
]) {
    assert.ok(!processorCode.includes(forbidden), `MediaProcessor must not contain ${forbidden}`);
}

const context = {
    window: {},
    TextEncoder,
    Date,
    String,
    Number,
    Object,
    Array,
    Math,
    Error,
    Promise,
    URL,
    console
};
vm.runInNewContext(policyCode, context);
vm.runInNewContext(processorCode, context);

const MediaPolicy = context.window.MediaPolicyClass;
const MediaProcessor = context.window.MediaProcessorClass;
assert.equal(typeof MediaPolicy, "function", "MediaPolicy must be available for processor tests");
assert.equal(typeof MediaProcessor, "function", "MediaProcessor class must be exposed for isolated tests");

const makeDataUrl = (mime, byteCount, fill = 1) => `data:${mime};base64,${Buffer.alloc(byteCount, fill).toString("base64")}`;
const encodeCalls = [];
let decodeCount = 0;
let releaseCount = 0;
const adapter = {
    async decode(file) {
        decodeCount += 1;
        return {
            source: { fileName: file.name },
            width: Number(file.testWidth || 2000),
            height: Number(file.testHeight || 1000),
            orientationAdjusted: file.orientationAdjusted !== false,
            release() {
                releaseCount += 1;
            }
        };
    },
    async encode(decoded, options) {
        encodeCalls.push({ decoded, ...options });
        const isThumbnail = Math.max(options.width, options.height) <= 320;
        return {
            dataUrl: makeDataUrl(options.mime, isThumbnail ? 20 * 1024 : 100 * 1024, isThumbnail ? 2 : 3),
            width: options.width,
            height: options.height,
            mime: options.mime
        };
    }
};

const policy = new MediaPolicy();
const processor = new MediaProcessor(policy, adapter, {
    thumbnailLongestEdge: 320,
    thumbnailQuality: 0.6
});
const sourceFile = {
    name: "classroom-evidence.jpg",
    type: "image/jpeg",
    size: 2 * 1024 * 1024,
    lastModified: 1785300000000,
    testWidth: 2000,
    testHeight: 1000,
    orientationAdjusted: true
};

assert.deepEqual(
    JSON.parse(JSON.stringify(processor.calculateTargetDimensions(2000, 1000, 1000))),
    { width: 1000, height: 500, scale: 0.5 },
    "Landscape photos must scale to the 1000px longest edge"
);
assert.deepEqual(
    JSON.parse(JSON.stringify(processor.calculateTargetDimensions(600, 900, 1000))),
    { width: 600, height: 900, scale: 1 },
    "Photos smaller than the limit must not be enlarged"
);
assert.deepEqual(
    JSON.parse(JSON.stringify(processor.calculateTargetDimensions(1200, 1800, 1000))),
    { width: 667, height: 1000, scale: 1000 / 1800 },
    "Portrait photos must preserve aspect ratio"
);

const result = await processor.processFile(sourceFile);
assert.equal(result.width, 1000, "Processed photo width must respect the longest-edge limit");
assert.equal(result.height, 500, "Processed photo height must preserve aspect ratio");
assert.equal(result.mime, "image/jpeg", "Processed output must use approved JPEG output");
assert.equal(result.size, 100 * 1024, "Processed byte size must come from the encoded Data URL");
assert.equal(result.thumbnail.width, 320, "Thumbnail longest edge must be 320px");
assert.equal(result.thumbnail.height, 160, "Thumbnail must preserve aspect ratio");
assert.equal(result.thumbnail.size, 20 * 1024, "Thumbnail byte size must be measured");
assert.equal(result.orientationAdjusted, true, "Decoder orientation status must be preserved");
assert.match(result.id, /^media-[0-9a-f]{16}$/, "Generated media ID must be deterministic and path-safe");
assert.equal(result.source.name, sourceFile.name, "Safe source metadata must preserve the file name");
assert.equal(result.source.size, sourceFile.size, "Safe source metadata must preserve source bytes");
assert.equal(decodeCount, 1, "One source file must be decoded once");
assert.equal(releaseCount, 1, "Decoded browser resources must be released after processing");
assert.equal(encodeCalls.length, 2, "Processor must generate one main image and one thumbnail");
assert.equal(encodeCalls[0].quality, 0.7, "Main image must use MediaPolicy JPEG quality");
assert.equal(encodeCalls[1].quality, 0.6, "Thumbnail must use the bounded thumbnail quality");

const repeated = await processor.processFile(sourceFile);
assert.equal(repeated.id, result.id, "Same source and encoded content must produce the same safe ID");
assert.equal(releaseCount, 2, "Each processing pass must release decoded resources");

const changed = await processor.processFile({ ...sourceFile, name: "different-evidence.jpg" });
assert.notEqual(changed.id, result.id, "Different source metadata must produce a different safe ID");

const safeSummary = processor.buildSafeSummary(result);
assert.deepEqual(
    Object.keys(safeSummary).sort(),
    ["height", "id", "mime", "orientationAdjusted", "size", "thumbnailSize", "width"].sort(),
    "Safe summary must expose metadata only"
);
assert.ok(!JSON.stringify(safeSummary).includes("data:image"), "Safe summary must exclude full image payloads");
assert.ok(!JSON.stringify(safeSummary).includes(sourceFile.name), "Safe summary must exclude source file names");

const decodeBeforeInvalid = decodeCount;
await assert.rejects(
    processor.processFile({ ...sourceFile, type: "image/gif" }),
    error => error.code === "MEDIA_SOURCE_MIME_UNSUPPORTED",
    "Unsupported source MIME must be rejected before decode"
);
assert.equal(decodeCount, decodeBeforeInvalid, "Invalid MIME must not reach the decoder");

await assert.rejects(
    processor.processFiles(Array.from({ length: 6 }, (_, index) => ({ ...sourceFile, name: `photo-${index}.jpg` }))),
    error => error.code === "MEDIA_PHOTO_COUNT_EXCEEDED",
    "More than five files must be rejected before processing"
);
assert.equal(decodeCount, decodeBeforeInvalid, "Invalid photo count must not decode any file");

const oversizeAdapter = {
    async decode() {
        return { source: {}, width: 1000, height: 750, orientationAdjusted: true, release() {} };
    },
    async encode(decoded, options) {
        return {
            dataUrl: makeDataUrl(options.mime, policy.getLimits().maxProcessedBytes + 1),
            width: options.width,
            height: options.height,
            mime: options.mime
        };
    }
};
const oversizeProcessor = new MediaProcessor(policy, oversizeAdapter);
await assert.rejects(
    oversizeProcessor.processFile(sourceFile),
    error => error.code === "MEDIA_PROCESSED_SIZE_EXCEEDED",
    "Oversized processed payload must be rejected"
);

console.log("Media processor checks passed.");
