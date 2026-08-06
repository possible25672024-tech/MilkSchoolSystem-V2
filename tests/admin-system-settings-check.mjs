import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const serviceSource = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const managerSource = fs.readFileSync("modules/admin/adminSystemManager.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminSystemView.js", "utf8");
const repositorySource = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const [name, source] of [
    ["adminSystemService.js", serviceSource],
    ["adminSystemManager.js", managerSource],
    ["adminSystemView.js", viewSource],
    ["adminSystemRepository.js", repositorySource]
]) assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);

for (const forbidden of ["fetch(", "FirebaseService", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Admin System View must not own ${forbidden}`);
}
for (const marker of [
    'data-admin-menu="system-settings"', 'data-admin-menu="backup-restore"',
    'data-admin-menu="drive-sync"', 'data-admin-section="system-settings"',
    'id="admin-settings-form"', 'id="admin-backup-download"', 'id="admin-restore-run"'
]) assert.ok(html.includes(marker), `Admin V2 is missing ${marker}`);
assert.match(appSource, /ensureAdminSystemView/, "App must initialize Sprint 5.8 Admin System UI");

const admin = { role: "admin", username: "admin" };
let current = {
    school: "โรงเรียนเดิม", year: "2569", semester: "1", perCrate: 36,
    warnLevel: 100, firebaseUrl: "https://example.test", firebaseKey: "protected"
};
let etag = "etag-1";
const repository = {
    async loadSettingsWithEtag() { return { value: { ...current }, etag }; },
    async saveSettingsIfMatch(value, expected) {
        assert.equal(expected, etag);
        current = value;
        etag = "etag-2";
        return { status: "ok", value, etag };
    },
    async loadDocumentMetadata() { return {}; },
    async loadDocumentContent() { return null; },
    async saveDocument() {},
    async deleteDocument() {},
    async loadRootWithEtag() { return { value: {}, etag: "root-1" }; },
    async restoreRootIfMatch() { return { status: "ok" }; }
};
const context = vm.createContext({ console, Date, Math, window: {} });
new vm.Script(serviceSource).runInContext(context);
const AdminSystemService = context.window.AdminSystemService.constructor;
const service = new AdminSystemService(repository, {
    clock: () => new Date("2026-07-31T10:00:00.000Z"),
    digest: async value => `hash-${value.length}`
});
const loaded = await service.loadSettings(admin);
assert.equal(loaded.settings.school, "โรงเรียนเดิม");
const saved = await service.saveSettings(admin, {
    school: "โรงเรียนใหม่", year: "2570", semester: "2", perCrate: 48, warnLevel: 200
}, "etag-1");
assert.equal(saved.saved, true);
assert.equal(current.firebaseUrl, "https://example.test", "Settings save must preserve Firebase URL");
assert.equal(current.firebaseKey, "protected", "Settings save must preserve Firebase credential");
await assert.rejects(
    service.loadSettings({ role: "teacher" }),
    error => error.code === "ADMIN_SESSION_REQUIRED"
);
await assert.rejects(
    service.saveSettings(admin, { school: "x", year: "1", perCrate: 0, warnLevel: 0 }, "etag-2"),
    error => error.code === "SETTINGS_PER_CRATE_INVALID"
);

console.log("Admin system settings and isolation checks passed.");
