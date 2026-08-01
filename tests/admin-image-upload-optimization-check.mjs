import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const optimizerSource = fs.readFileSync("modules/media/documentImageOptimizer.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminSystemView.js", "utf8");
const serviceSource = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

let policyOverrides = null;
let processOptions = null;
class PolicyStub {
    constructor(overrides) { policyOverrides = overrides; }
}
class ProcessorStub {
    constructor(policy) { this.policy = policy; }
    async processFile(file, options) {
        processOptions = options;
        return {
            dataUrl: "data:image/jpeg;base64,QUJD",
            size: 3,
            width: 1000,
            height: 750,
            source: { size: file.size }
        };
    }
}

const optimizerContext = vm.createContext({
    console,
    window: { MediaPolicyClass: PolicyStub, MediaProcessorClass: ProcessorStub }
});
new vm.Script(optimizerSource).runInContext(optimizerContext);
const optimizer = optimizerContext.window.DocumentImageOptimizer;
const sourceFile = {
    name: "หลักฐานขนาดใหญ่.png",
    type: "image/png",
    size: 6 * 1024 * 1024,
    lastModified: 123
};
const result = await optimizer.process(sourceFile);
assert.equal(policyOverrides.maxSourceBytes, 12 * 1024 * 1024);
assert.equal(policyOverrides.maxLongestEdge, 1000);
assert.equal(policyOverrides.jpegQuality, 0.7);
assert.equal(policyOverrides.maxProcessedBytes, 400 * 1024);
assert.equal(processOptions.outputMime, "image/jpeg");
assert.equal(processOptions.quality, 0.7);
assert.equal(result.fileName, "หลักฐานขนาดใหญ่.jpg");
assert.equal(result.contentType, "image/jpeg");
assert.equal(result.fileSize, 3);
assert.equal(result.originalFileSize, sourceFile.size);
assert.equal(result.imageWidth, 1000);
assert.equal(result.imageHeight, 750);
assert.equal(result.optimized, true);
await assert.rejects(
    optimizer.process({ name: "หนังสือ.pdf", type: "application/pdf", size: 100 }),
    error => error.code === "DOCUMENT_IMAGE_TYPE_INVALID"
);

for (const marker of [
    "prepareSelectedDocument(event)",
    "documentImageOptimizer.process(file)",
    "renderPreparedDocument(prepared)",
    "originalFileSize: prepared.originalFileSize"
]) {
    assert.ok(viewSource.includes(marker), `Admin document View is missing ${marker}`);
}
assert.match(viewSource, /fileData: null,[\s\S]*optimized: false/, "PDF must remain an unmodified source file");
assert.match(serviceSource, /DOCUMENT_CONTENT_TYPE_MISMATCH/, "Service must reject mismatched Data URL MIME metadata");
assert.match(serviceSource, /optimized: document\.optimized === true/, "Document metadata reads must expose optimization state");
assert.ok(appSource.includes('import("../media/documentImageOptimizer.js")'));
assert.ok(html.includes('id="admin-document-file-summary"'));
assert.ok(html.includes("รูป JPG/PNG จะย่อด้านยาวไม่เกิน 1,000 px"));

console.log("Admin image upload optimization and PDF preservation checks passed.");
