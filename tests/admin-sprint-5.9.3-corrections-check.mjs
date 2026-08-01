import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync("index-v2.html", "utf8");
const receiptSource = fs.readFileSync("modules/admin/adminReceiptView.js", "utf8");
const distributionSource = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");
const systemSource = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const repositorySource = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");

for (const marker of [
    'id="admin-receipt-detail-print"',
    'id="admin-distribution-summary-days"',
    'id="admin-distribution-stock-before"',
    'id="admin-backup-download-full"',
    'id="admin-restore-profile"'
]) assert.ok(html.includes(marker), `${marker} is required`);

assert.match(receiptSource, /@page\{size:A4 portrait/);
assert.match(receiptSource, /this\.manager\.detail\?\.receipt/);
assert.match(distributionSource, /preview\.students/);
assert.match(distributionSource, /preview\.days/);
assert.match(distributionSource, /preview\.mainStockBefore/);
assert.match(distributionSource, /preview\.mainStockAfter/);

const receiptPopup = { html: "", document: { write(value) { receiptPopup.html += value; }, close() {} } };
const receiptDocument = { getElementById() { return null; }, querySelector() { return null; } };
const receiptWindow = {
    open() { receiptPopup.html = ""; return receiptPopup; },
    confirm() { return true; }
};
const receiptContext = vm.createContext({
    console, Date, document: receiptDocument, window: receiptWindow
});
new vm.Script(receiptSource).runInContext(receiptContext);
const ReceiptView = receiptContext.window.AdminReceiptView.constructor;
const receiptView = new ReceiptView({
    detail: {
        receipt: {
            date: "2026-08-01", year: "2569", crates: 2, perCrate: 36,
            extra: 4, total: 76, note: "รับครบ",
            photos: ["data:image/jpeg;base64,PHOTO"],
            signatures: {
                receiver: { receiverName: "ครูผู้รับ", signature: "data:image/png;base64,SIG" }
            }
        }
    }
}, {}, receiptWindow, { document: receiptDocument, window: receiptWindow });
receiptView.printDetail();
assert.match(receiptPopup.html, /รายละเอียดรายการรับนมจาก อบต\./);
assert.match(receiptPopup.html, /76 กล่อง/);
assert.match(receiptPopup.html, /รูปหลักฐาน 1/);
assert.match(receiptPopup.html, /ครูผู้รับ/);
assert.match(receiptPopup.html, /@page\{size:A4 portrait/);

let fullReads = 0;
let coreReads = 0;
const root = {
    settings: { school: "โรงเรียนทดสอบ" }, stock: 100,
    rooms: {}, roomStock: {}, receives: {}, distributes: {},
    mcAttendance: { huge: { photos: ["data:image/jpeg;base64,VERY-LARGE"] } },
    documentFiles: { d1: "data:application/pdf;base64,VERY-LARGE" }
};
const repository = {
    async loadRootWithEtag() { fullReads += 1; return { value: structuredClone(root), etag: "full" }; },
    async loadCoreWithEtag() {
        coreReads += 1;
        const { mcAttendance, documentFiles, ...core } = root;
        return { value: structuredClone(core), etag: "core" };
    },
    async loadRootSummaryWithEtag() { return { value: structuredClone(root), etag: "current" }; },
    async restoreRootIfMatch() { return { status: "ok" }; },
    async loadSettingsWithEtag() {}, async saveSettingsIfMatch() {},
    async loadDocumentMetadata() {}, async loadDocumentContent() {},
    async saveDocument() {}, async deleteDocument() {}
};
const context = vm.createContext({ console, Date, Math, structuredClone, window: {} });
new vm.Script(systemSource).runInContext(context);
const Service = context.window.AdminSystemService.constructor;
const service = new Service(repository, { digest: async value => `sha256-${String(value).length}` });
const admin = { role: "admin", isAdmin: true };

const coreBackup = await service.createBackup(admin, "download", "core");
assert.equal(coreReads, 1);
assert.equal(fullReads, 0, "Fast backup must not hydrate the full evidence root");
assert.equal(coreBackup.envelope.profile, "core");
assert.equal(coreBackup.envelope.restoreScope, "reference-only");
assert.equal(coreBackup.envelope.data.mcAttendance, undefined);
assert.equal(coreBackup.envelope.data.documentFiles, undefined);

const fullBackup = await service.createBackup(admin, "download", "full");
assert.equal(fullReads, 1);
assert.equal(fullBackup.envelope.profile, "full");
assert.ok(fullBackup.envelope.data.mcAttendance);

const corePreview = await service.validateBackup(admin, coreBackup.envelope);
await assert.rejects(
    service.restoreBackup(admin, corePreview, { confirmation: "กู้คืนข้อมูล", safetyBackupReady: true }),
    error => error.code === "CORE_BACKUP_RESTORE_BLOCKED"
);

// Repository source must use an explicit allowlist instead of root hydration.
assert.match(repositorySource, /const coreKeys = \[/);
assert.doesNotMatch(repositorySource.slice(repositorySource.indexOf("async loadCoreWithEtag")), /loadRootWithEtag\(/);

console.log("Sprint 5.9.3 receipt A4, distribution summary and fast/full backup profile checks passed.");
