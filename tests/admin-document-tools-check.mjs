import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const view = fs.readFileSync("modules/admin/adminSystemView.js", "utf8");
const repositorySource = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");
const admin = { role: "admin" };
let saved = null;
const repository = {
    async loadSettingsWithEtag() { return { value: {}, etag: "s" }; },
    async saveSettingsIfMatch() { return { status: "ok" }; },
    async loadDocumentMetadata() {
        return {
            old: { id: "old", title: "เก่า", uploadedAt: "2026-01-01T00:00:00Z" },
            recent: { id: "recent", title: "ใหม่", uploadedAt: "2026-07-31T00:00:00Z", fileSize: 1024 }
        };
    },
    async loadDocumentContent(id) { return id === "recent" ? "data:application/pdf;base64,AA==" : null; },
    async saveDocument(id, metadata, fileData) { saved = { id, metadata, fileData }; },
    async deleteDocument() {},
    async loadRootWithEtag() { return { value: {}, etag: "r" }; },
    async restoreRootIfMatch() { return { status: "ok" }; }
};
const context = vm.createContext({ console, Date, Math, window: {} });
new vm.Script(source).runInContext(context);
const AdminSystemService = context.window.AdminSystemService.constructor;
const service = new AdminSystemService(repository, {
    clock: () => new Date("2026-07-31T12:00:00.000Z"), digest: async () => "hash"
});
const list = await service.loadDocuments(admin);
assert.deepEqual(Array.from(list.documents, item => item.id), ["recent", "old"]);
assert.ok(!("fileData" in list.documents[0]), "Document list must remain metadata-only");
assert.equal(await service.loadDocumentContent(admin, "recent"), "data:application/pdf;base64,AA==");
await service.saveDocument(admin, {
    id: "doc-1", title: "หนังสือ อบต.", description: "ทดสอบ", uploadedBy: "Admin",
    fileName: "letter.pdf", contentType: "application/pdf", fileSize: 100,
    fileData: "data:application/pdf;base64,AA=="
});
assert.equal(saved.id, "doc-1");
assert.ok(!("fileData" in saved.metadata), "Document metadata path must exclude file content");
assert.equal(saved.fileData, "data:application/pdf;base64,AA==");
await assert.rejects(
    service.saveDocument(admin, {
        title: "bad", fileName: "bad.exe", contentType: "application/octet-stream",
        fileSize: 10, fileData: "data:application/octet-stream;base64,AA=="
    }),
    error => error.code === "DOCUMENT_TYPE_INVALID"
);
for (const marker of [
    'data-admin-menu="documents"', 'data-admin-section="documents"',
    'id="admin-document-form"', 'id="admin-document-body"'
]) assert.ok(html.includes(marker), `Admin document UI is missing ${marker}`);
assert.match(repositorySource, /documents\//, "Repository must keep document metadata under documents");
assert.match(repositorySource, /documentFiles\//, "Repository must keep document content under documentFiles");
assert.match(view, /loadDocumentContent\(documentModel\.id\)/, "File content must load only after an explicit action");

console.log("Admin document metadata-on-demand and file safety checks passed.");
