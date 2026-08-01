import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const admin = { role: "admin", username: "owner", firebaseUid: "uid-admin" };
const root = {
    public: {
        loginDirectory: { schoolName: "โรงเรียนทดสอบ", accounts: {} },
        appSettings: { school: "โรงเรียนทดสอบ", perCrate: 36 }
    },
    accessControl: { users: { "uid-admin": { role: "admin", enabled: true } } },
    settings: { school: "โรงเรียนทดสอบ", perCrate: 36 },
    stock: 500,
    rooms: { r1: { id: "r1", name: "ป.1-1" } },
    roomStock: { r1: 50 },
    receives: { a: { total: 550 } },
    distributes: { b: { total: 50 } },
    mcAttendance: { c: { presentCount: 10 } },
    documents: { d: { title: "หนังสือ" } },
    documentFiles: { d: "data:application/pdf;base64,AA==" }
};
let restored = null;
let restoreEtag = null;
let restoreStatus = "ok";
const repository = {
    async loadSettingsWithEtag() { return { value: root.settings, etag: "settings-1" }; },
    async saveSettingsIfMatch() { return { status: "ok" }; },
    async loadDocumentMetadata() { return {}; },
    async loadDocumentContent() { return null; },
    async saveDocument() {},
    async deleteDocument() {},
    async loadRootWithEtag() { return { value: structuredClone(root), etag: "root-etag-1" }; },
    async restoreRootIfMatch(value, etag) {
        restored = value;
        restoreEtag = etag;
        return { status: restoreStatus };
    }
};
const context = vm.createContext({ console, Date, Math, structuredClone, window: {} });
new vm.Script(source).runInContext(context);
const AdminSystemService = context.window.AdminSystemService.constructor;
const digest = async value => {
    let hash = 0;
    for (const character of String(value)) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    return `sha256-${hash.toString(16).padStart(8, "0")}`;
};
const service = new AdminSystemService(repository, {
    clock: () => new Date("2026-07-31T11:00:00.000Z"), digest
});

const backup = await service.createBackup(admin, "download");
assert.equal(backup.envelope.format, "MilkSchoolSystemV2Backup");
assert.equal(backup.envelope.integrity.algorithm, "SHA-256");
assert.equal(backup.summary.mainStock, 500);
assert.equal(backup.summary.documents, 1);
assert.deepEqual(backup.envelope.data, root, "Full backup must preserve all milkApp data");

const preview = await service.validateBackup(admin, backup.envelope);
assert.equal(preview.valid, true);
assert.equal(preview.currentEtag, "root-etag-1");
await assert.rejects(
    service.restoreBackup(admin, preview, { confirmation: "กู้คืนข้อมูล", safetyBackupReady: false }),
    error => error.code === "RESTORE_SAFETY_BACKUP_REQUIRED"
);
await assert.rejects(
    service.restoreBackup(admin, preview, { confirmation: "restore", safetyBackupReady: true }),
    error => error.code === "RESTORE_CONFIRMATION_INVALID"
);
const result = await service.restoreBackup(admin, preview, {
    confirmation: "กู้คืนข้อมูล", safetyBackupReady: true
});
assert.equal(result.restored, true);
assert.equal(restoreEtag, "root-etag-1", "Restore must use preview ETag");
assert.ok(restored.systemAudit.restores[result.restoreId], "Restore must record an audit entry");

const insecure = structuredClone(backup.envelope);
delete insecure.data.accessControl;
insecure.integrity.checksum = await service.checksumData(insecure.data);
const insecurePreview = await service.validateBackup(admin, insecure);
await assert.rejects(
    service.restoreBackup(admin, insecurePreview, { confirmation: "กู้คืนข้อมูล", safetyBackupReady: true }),
    error => error.code === "RESTORE_SECURITY_CONTEXT_REQUIRED"
);

const tampered = structuredClone(backup.envelope);
tampered.data.stock = 999;
await assert.rejects(
    service.validateBackup(admin, tampered),
    error => error.code === "BACKUP_CHECKSUM_MISMATCH"
);
const invalidSchema = structuredClone(backup.envelope);
delete invalidSchema.data.rooms;
invalidSchema.integrity.checksum = await digest(JSON.stringify(invalidSchema.data));
await assert.rejects(
    service.validateBackup(admin, invalidSchema),
    error => error.code === "BACKUP_SCHEMA_INVALID"
);
restoreStatus = "conflict";
await assert.rejects(
    service.restoreBackup(admin, preview, { confirmation: "กู้คืนข้อมูล", safetyBackupReady: true }),
    error => error.code === "RESTORE_CONFLICT"
);

console.log("Admin backup integrity, ETag restore, and safety checks passed.");
