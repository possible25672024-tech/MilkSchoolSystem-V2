import assert from "node:assert/strict";
import fs from "node:fs";

const plan = fs.readFileSync("docs/SPRINT_5_9_PLAN.md", "utf8");
const repository = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const studentView = fs.readFileSync("modules/admin/adminStudentView.js", "utf8");
const reportService = fs.readFileSync("modules/admin/adminOperationalReportService.js", "utf8");
const index = fs.readFileSync("index-v2.html", "utf8");

for (const marker of [
    "81/81",
    "413 Payload is too large",
    "shallow=true",
    "root ETag",
    "isolated Firebase",
    "ห้ามแก้, rebuild",
    "Sprint 6.0"
]) {
    assert.ok(plan.includes(marker), `Sprint 5.9 plan is missing ${marker}`);
}
assert.match(repository, /getWithEtag\(this\.appRoot, \{ print: "silent" \}\)/);
assert.match(repository, /loadRootKeys/);
assert.doesNotMatch(repository, /getWithEtag\([^\n]+shallow: true/);
assert.match(repository, /loadChunked/);
assert.match(repository, /BACKUP_SNAPSHOT_CHANGED/);
assert.match(studentView, /openStudentReport/);
assert.match(studentView, /data-admin-menu="student-report"/);
assert.match(reportService, /expectedStockAfter/);
assert.match(reportService, /stockValid/);
assert.equal((index.match(/class="admin-menu-group"/g) || []).length, 8);

console.log("Sprint 5.9 integration, security and UAT plan checks passed.");
