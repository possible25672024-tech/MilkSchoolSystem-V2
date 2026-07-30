import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const plan = read("docs/SPRINT_4_8_PLAN.md");
const sprint = read("SPRINT_STATUS.md");

const assertContains = (source, expected, contract) => {
    assert.ok(source.includes(expected), `${contract}: missing ${JSON.stringify(expected)}`);
};

assertContains(plan, "Sprint 4.8 — Attendance History, Report and A4 Print UI", "Sprint 4.8 workflow identity");
assertContains(plan, "authenticated-room Attendance history", "Authenticated-room history scope");
assertContains(plan, "never performs a full-school Attendance read", "Full-school read prohibition");
assertContains(plan, "Attendance Summary Model", "Pure Attendance summary model");
assertContains(plan, "A4 Print Model and Print View", "A4 print boundary");
assertContains(plan, "must not download all historical photos or signatures automatically", "Lazy historical media loading");
assertContains(plan, "Sprint 4.8 report and print modules are read-only and affect no stock", "Read-only stock boundary");
assertContains(plan, "Queue key remains `tc_pending_saves_v1`", "Queue compatibility");
assertContains(plan, "Protected `index.html` and `teacher.html` remain unchanged", "Protected legacy files");
assertContains(plan, "No merge to `main` is authorized", "Main branch prohibition");

for (const forbiddenOwner of [
    "FirebaseService writes",
    "fetch PUT/PATCH/POST/DELETE",
    "Room Stock mutation",
    "Main Stock mutation",
    "Queue creation or replay",
    "ledger or stockLog repair"
]) {
    assertContains(plan, forbiddenOwner, `Forbidden report ownership: ${forbiddenOwner}`);
}

for (const gate of [
    "Gate A — History Query Contract",
    "Gate B — Pure Summary Builder",
    "Gate C — A4 Print Model",
    "Gate D — UI and Browser Read-only Validation",
    "Gate E — Full Regression"
]) {
    assertContains(plan, gate, `Sprint 4.8 isolated gate: ${gate}`);
}

assertContains(sprint, "Current Branch: `feature/sprint-4.8.1-report-print-ui-integration`", "Active Sprint 4.8 branch");
assertContains(sprint, "Sprint 4.8 — Attendance History, Report and A4 Print UI", "Active Sprint 4.8 identity");
assertContains(sprint, "Sprint 4.7 — Shared Media and Signature Workflow merged into `develop`", "Sprint 4.7 develop integration");
assertContains(sprint, "0ed9bc52e26bdf715240be72a84a220771068947", "Sprint 4.7 accepted integration head");
assertContains(sprint, "Sprint 4.8 report and print modules are read-only and change no stock", "Sprint 4.8 status stock boundary");
assertContains(sprint, "Physical iPad remains deferred", "Physical iPad deferral");
assertContains(sprint, "No merge to `main` is authorized", "Main branch remains blocked");
assertContains(sprint, "48/48", "Complete Sprint 4.8 regression count");
assertContains(sprint, "local URL was blocked before page load and is not recorded as PASS", "Honest local browser gate status");

console.log("Sprint 4.8 plan checks passed.");
