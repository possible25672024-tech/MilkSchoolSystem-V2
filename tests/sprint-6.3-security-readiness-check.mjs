import assert from "node:assert/strict";
import fs from "node:fs";

const plan = fs.readFileSync("docs/SPRINT_6_3_UAT_SECURITY_READINESS.md", "utf8");
const firebaseConfig = fs.readFileSync("config/firebase-config.js", "utf8");
const loginService = fs.readFileSync("modules/services/loginService.js", "utf8");
const authService = fs.readFileSync("modules/login/authService.js", "utf8");
const adminService = fs.readFileSync("modules/admin/adminSystemService.js", "utf8");
const adminRepository = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const index = fs.readFileSync("index-v2.html", "utf8");

for (const marker of [
    "feature/sprint-6.3-uat-security-readiness",
    "LOCAL ISOLATED PASS",
    "LIVE BROWSER BLOCKED",
    "REAL TEST FIREBASE BLOCKED",
    "SERVER-SIDE AUTHORIZATION BLOCKED",
    "mqn0z13eyx5b",
    "2026-07-28",
    "Sprint 6.4"
]) assert.ok(plan.includes(marker), `Sprint 6.3 readiness record is missing ${marker}`);

assert.match(firebaseConfig, /authToken:\s*""/);
assert.match(firebaseConfig, /firebasedatabase\.app/);
assert.match(loginService, /settings\.adminPassword/);
assert.match(loginService, /settings\.teacherPassword/);
assert.match(authService, /sessionStorage/);
assert.match(plan, /client-side password/i);
assert.match(plan, /Firebase Authentication/i);
assert.match(plan, /Firebase Rules/i);

assert.match(adminService, /RESTORE_SAFETY_BACKUP_REQUIRED/);
assert.match(adminService, /RESTORE_CONFIRMATION_INVALID/);
assert.match(adminService, /CORE_BACKUP_RESTORE_BLOCKED/);
assert.match(adminRepository, /restoreRootIfMatch/);
assert.match(adminRepository, /setIfMatch\(this\.appRoot, data, etag\)/);

assert.doesNotMatch(index, /<script[^>]+src="https?:\/\//i, "Runtime scripts must remain local");
for (const view of [
    "modules/admin/adminSystemView.js",
    "modules/admin/adminDistributionView.js",
    "modules/admin/adminReceiptView.js"
]) {
    const source = fs.readFileSync(view, "utf8");
    assert.doesNotMatch(source, /firebaseio|firebasedatabase|\bfetch\s*\(/i, `${view} must not call Firebase directly`);
}

console.log("Sprint 6.3 security review gate passed with the server-side authorization blocker recorded.");
