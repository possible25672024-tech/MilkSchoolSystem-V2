import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const decisions = read("docs/CUTOVER_DECISIONS.md");
const rollback = read("docs/PRODUCTION_ROLLBACK_PLAN.md");
const teacherPlan = read("docs/TEACHER_UI_INTEGRATION_PLAN.md");
const readiness = read("docs/CUTOVER_READINESS_REPORT.md");
const parity = read("docs/CUTOVER_PARITY_MATRIX.md");
const sprint = read("SPRINT_STATUS.md");

for (const [name, source] of [
    ["CUTOVER_DECISIONS.md", decisions],
    ["PRODUCTION_ROLLBACK_PLAN.md", rollback],
    ["TEACHER_UI_INTEGRATION_PLAN.md", teacherPlan],
    ["CUTOVER_READINESS_REPORT.md", readiness],
    ["CUTOVER_PARITY_MATRIX.md", parity],
    ["SPRINT_STATUS.md", sprint]
]) {
    assert.ok(source.trim().length > 0, `${name} must not be empty`);
}

assert.ok(decisions.includes("D-01 — Physical iPad Validation"), "Decision register must cover physical iPad deferral");
assert.ok(decisions.includes("D-02 — Report Browser-Local Data Adapter"), "Decision register must cover the report local-data adapter");
assert.ok(decisions.includes("D-03 — XLSX Binary Parser"), "Decision register must cover XLSX parsing");
assert.ok(decisions.includes("D-06 — Real Firebase Multi-Writer Validation"), "Decision register must cover real Firebase concurrency validation");
assert.ok(decisions.includes("D-08 — Responsive and Device Scope"), "Decision register must cover responsive browser validation");
assert.ok(decisions.includes("EMULATED 820 × 1180 PASSED"), "Decision register must preserve the completed responsive result");
assert.ok(decisions.includes("D-09 — Backup and Restore"), "Decision register must cover backup and restore");
assert.ok(decisions.includes("BLOCKS PRODUCTION"), "Deferred decisions must state their production consequence");

assert.ok(rollback.includes("index.html"), "Rollback plan must preserve the legacy Admin page");
assert.ok(rollback.includes("teacher.html"), "Rollback plan must preserve the legacy Teacher page");
assert.ok(rollback.includes("tc_pending_saves_v1"), "Rollback plan must preserve the browser queue key");
assert.ok(rollback.includes("Firebase Export"), "Rollback plan must include Firebase export verification");
assert.ok(rollback.includes("Isolated Restore Rehearsal"), "Rollback plan must require an isolated restore rehearsal");
assert.ok(rollback.includes("Rollback Triggers"), "Rollback plan must define rollback triggers");
assert.ok(rollback.includes("Application rollback should normally occur before database restore"), "Rollback plan must avoid unnecessary destructive restores");
assert.ok(rollback.includes("No merge to `main`"), "Rollback plan must not authorize production deployment");

assert.ok(teacherPlan.includes("Main Stock must never be changed by Teacher workflows"), "Teacher UI plan must protect Main Stock");
assert.ok(teacherPlan.includes("Attendance edits apply only the present-count difference"), "Teacher UI plan must protect Attendance difference rules");
assert.ok(teacherPlan.includes("Queue storage key remains `tc_pending_saves_v1`"), "Teacher UI plan must preserve queue compatibility");
assert.ok(teacherPlan.includes("teacher.html` remains available"), "Teacher UI plan must retain the rollback path");
assert.ok(teacherPlan.includes("Offline and Sync Feedback"), "Teacher UI plan must cover queue and offline UI");
assert.ok(teacherPlan.includes("Photos and Signatures"), "Teacher UI plan must cover media workflows");

assert.ok(readiness.includes("Overall status: NOT READY FOR PRODUCTION CUTOVER"), "Readiness report must not claim production readiness");
assert.ok(readiness.includes("Status: PASS FOR THE CURRENT V2 SHELL WORKFLOW"), "Readiness report must record the responsive shell pass");
assert.ok(readiness.includes("DEFERRED BY PRODUCT OWNER"), "Readiness report must represent physical iPad testing as deferred");
assert.ok(parity.includes("Responsive 820 x 1180 shell"), "Parity matrix must include responsive shell parity");
assert.ok(parity.includes("| PASS | layout, Teacher login, Logout, Console |"), "Parity matrix must preserve the responsive PASS result");
assert.ok(parity.includes("DEFERRED"), "Parity matrix must support deferred validation status");
assert.ok(sprint.includes("Physical iPad validation explicitly deferred"), "Sprint status must record the physical iPad decision");
assert.ok(sprint.includes("Teacher login completed successfully inside the 820 x 1180 emulated viewport"), "Sprint status must record responsive Teacher login");
assert.ok(sprint.includes("Logout completed successfully inside the 820 x 1180 emulated viewport"), "Sprint status must record responsive Logout");

console.log("Cutover documentation checks passed.");
