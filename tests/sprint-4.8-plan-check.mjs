import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const plan = read("docs/SPRINT_4_8_PLAN.md");
const sprint = read("SPRINT_STATUS.md");

assert.ok(plan.includes("Sprint 4.8 — Attendance History, Report and A4 Print UI"), "Sprint 4.8 plan must identify the report and print workflow");
assert.ok(plan.includes("authenticated-room Attendance history"), "Plan must scope history to the authenticated Teacher room");
assert.ok(plan.includes("never performs a full-school Attendance read"), "Plan must block full-school Attendance history reads");
assert.ok(plan.includes("Attendance Summary Model"), "Plan must define a pure summary model");
assert.ok(plan.includes("A4 Print Model and Print View"), "Plan must define the A4 print boundary");
assert.ok(plan.includes("do not download all historical photos or signatures automatically"), "Plan must preserve lazy historical media loading");
assert.ok(plan.includes("Sprint 4.8 report and print modules are read-only and affect no stock"), "Plan must protect stock from report workflows");
assert.ok(plan.includes("Queue key remains `tc_pending_saves_v1`"), "Plan must preserve Queue compatibility");
assert.ok(plan.includes("Protected `index.html` and `teacher.html` remain unchanged"), "Plan must preserve protected legacy files");
assert.ok(plan.includes("No merge to `main` is authorized"), "Plan must not authorize production integration");

for (const forbiddenOwner of [
    "FirebaseService writes",
    "fetch PUT/PATCH/POST/DELETE",
    "Room Stock mutation",
    "Main Stock mutation",
    "Queue creation or replay",
    "ledger or stockLog repair"
]) {
    assert.ok(plan.includes(forbiddenOwner), `Plan must explicitly forbid report ownership of ${forbiddenOwner}`);
}

for (const gate of [
    "Gate A — History Query Contract",
    "Gate B — Pure Summary Builder",
    "Gate C — A4 Print Model",
    "Gate D — UI and Browser Read-only Validation",
    "Gate E — Full Regression"
]) {
    assert.ok(plan.includes(gate), `Plan must define ${gate}`);
}

assert.ok(sprint.includes("Current Branch: `feature/sprint-4.8-report-print-ui`"), "Sprint status must activate the Sprint 4.8 branch");
assert.ok(sprint.includes("Sprint 4.8 — Attendance History, Report and A4 Print UI"), "Sprint status must identify Sprint 4.8");
assert.ok(sprint.includes("Sprint 4.7 — Shared Media and Signature Workflow merged into `develop`"), "Sprint status must record Sprint 4.7 develop integration");
assert.ok(sprint.includes("0ed9bc52e26bdf715240be72a84a220771068947"), "Sprint status must record the accepted Sprint 4.7 integration head");
assert.ok(sprint.includes("Sprint 4.8 report and print modules are read-only and change no stock"), "Sprint status must protect stock from Sprint 4.8 reports");
assert.ok(sprint.includes("Physical iPad remains deferred"), "Sprint status must preserve the physical iPad decision");
assert.ok(sprint.includes("No merge to `main` is authorized"), "Sprint status must keep main blocked");

console.log("Sprint 4.8 plan checks passed.");
