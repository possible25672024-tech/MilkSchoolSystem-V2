import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import vm from "node:vm";

const vendorPath = "assets/vendor/pdf-lib.min.js";
const licensePath = "assets/vendor/pdf-lib.LICENSE.md";
const optimizerSource = fs.readFileSync("modules/media/documentPdfOptimizer.js", "utf8");
const vendorSource = fs.readFileSync(vendorPath, "utf8");
const viewSource = fs.readFileSync("modules/admin/adminSystemView.js", "utf8");
const serviceSource = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");
const plan = fs.readFileSync("docs/SPRINT_6_2_PDF_UPLOAD_OPTIMIZATION.md", "utf8");
const status = fs.readFileSync("SPRINT_STATUS.md", "utf8");
const memory = fs.readFileSync("docs/PROJECT_MEMORY.md", "utf8");

assert.ok(vendorSource.length > 500_000, "The local PDF library bundle must be present");
assert.equal(
    crypto.createHash("sha256").update(vendorSource).digest("hex"),
    "0f9a5cad07941f0826586c94e089d89b918c46e5c17cf2d5a3c6f666e3bc694f"
);
assert.match(fs.readFileSync(licensePath, "utf8"), /MIT License/);

const context = vm.createContext({
    console,
    setTimeout,
    clearTimeout,
    Uint8Array,
    ArrayBuffer,
    TextDecoder,
    TextEncoder
});
context.window = context;
new vm.Script(vendorSource).runInContext(context);
new vm.Script(optimizerSource).runInContext(context);
assert.equal(typeof context.PDFLib?.PDFDocument, "function");
assert.equal(typeof context.DocumentPdfOptimizerClass, "function");

await new vm.Script(`(async () => {
    const documentModel = await PDFLib.PDFDocument.create();
    for (let index = 0; index < 24; index += 1) {
        const page = documentModel.addPage([595, 842]);
        page.drawText("Milk School PDF page " + (index + 1), { x: 48, y: 790 });
    }
    window.testSourcePdf = await documentModel.save({ useObjectStreams: false });
})()`).runInContext(context);

const sourcePdf = context.testSourcePdf;
const optimizer = new context.DocumentPdfOptimizerClass({
    PDFDocumentClass: context.PDFLib.PDFDocument,
    TextDecoderClass: TextDecoder,
    toDataUrl: bytes => `data:application/pdf;base64,${Buffer.from(bytes).toString("base64")}`
});
const sourceFile = {
    name: "เอกสารทดสอบ.pdf",
    type: "application/pdf",
    size: sourcePdf.byteLength,
    lastModified: 123,
    async arrayBuffer() {
        return sourcePdf.buffer.slice(sourcePdf.byteOffset, sourcePdf.byteOffset + sourcePdf.byteLength);
    }
};
const result = await optimizer.process(sourceFile);
assert.equal(result.optimized, true);
assert.equal(result.optimizationType, "pdf-lossless");
assert.equal(result.pageCount, 24);
assert.ok(result.fileSize < result.originalFileSize);
assert.match(result.fileData, /^data:application\/pdf;base64,/);

const signedBytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj <</Type /Sig /ByteRange [0 1 2 3]>>\n%%EOF");
const signed = await optimizer.process({
    name: "signed.pdf",
    type: "application/pdf",
    size: signedBytes.byteLength,
    async arrayBuffer() { return signedBytes.buffer; }
});
assert.equal(signed.optimized, false);
assert.equal(signed.optimizationReason, "digital-signature");
assert.equal(signed.fileData, null);

const invalidBytes = new TextEncoder().encode("not a pdf");
await assert.rejects(
    optimizer.process({
        name: "broken.pdf",
        type: "application/pdf",
        size: invalidBytes.byteLength,
        async arrayBuffer() { return invalidBytes.buffer; }
    }),
    error => error.code === "DOCUMENT_PDF_INVALID"
);

for (const marker of [
    "documentPdfOptimizer.process(file)",
    "pdf-lossless",
    "compression-failed",
    "บีบอัด PDF แบบไม่ลดคุณภาพ"
]) assert.ok(viewSource.includes(marker), `Admin document View is missing ${marker}`);

assert.match(serviceSource, /pdf-lossless/);
assert.match(serviceSource, /pageCount/);
assert.ok(appSource.includes('import("../media/documentPdfOptimizer.js")'));
assert.ok(html.includes('src="assets/vendor/pdf-lib.min.js"'));
assert.ok(html.includes("PDF จะบีบอัดแบบไม่ลดคุณภาพก่อนอัปโหลด"));
for (const marker of [
    "feature/sprint-6.2-pdf-upload-optimization",
    "lossless",
    "digital signature",
    "encrypted",
    "two remaining release Sprints",
    "Production"
]) assert.ok(plan.includes(marker), `Sprint 6.2 plan is missing ${marker}`);
assert.ok(status.includes("Sprint 6.2 — Safe PDF Upload Optimization"));
assert.ok(status.includes("92/92"));
assert.ok(memory.includes("Sprint 6.2 Safe PDF Upload Optimization"));
assert.ok(memory.includes("Sprint 6.3"));
assert.ok(memory.includes("Sprint 6.4"));

console.log("Admin lossless PDF upload optimization checks passed.");
