import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";

const approvalPath = String(process.argv[2] || "").trim();
if (!approvalPath) {
    console.error("Usage: node scripts/verify-production-approval.mjs <signed-approval.json>");
    process.exit(64);
}

const approval = JSON.parse(fs.readFileSync(approvalPath, "utf8"));
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const branch = execFileSync("git", ["branch", "--show-current"], { encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim();

assert.equal(approval.schema, "MilkSchoolSystemV2ProductionApproval/v1");
assert.equal(approval.releaseCommit, head, "Approval must name the exact current commit");
assert.match(branch, /^release\/|^feature\/sprint-6\.5-/, "Approval gate must run on the Sprint 6.5 or release branch");
assert.equal(dirty, "", "Working tree must be clean before approval verification");
assert.equal(approval.firebaseRulesEmulator?.passed, true, "Official Rules Emulator evidence is required");
assert.equal(approval.firebaseTestProject?.passed, true, "Real isolated Firebase project evidence is required");
assert.equal(approval.firebaseTestProject?.productionProject, false, "UAT project must not be Production");
assert.equal(approval.incident?.id, "INC-2026-07-28-MQN0Z13EYX5B");
assert.equal(approval.incident?.closed, true, "The quarantined room incident must be formally closed");
assert.equal(approval.liveBrowser?.passed, true, "Live Browser/device evidence is required");

for (const key of ["mergeMain", "createReleaseTag", "deployRules", "deployApplication", "trafficCutover", "postReleaseVerification"]) {
    assert.equal(approval.authorization?.[key], true, `Explicit authorization is missing: ${key}`);
}
assert.ok(String(approval.approvedBy || "").trim(), "approvedBy is required");
assert.match(String(approval.approvedAt || ""), /^\d{4}-\d{2}-\d{2}T/, "approvedAt must be an ISO timestamp");
assert.ok(String(approval.rollbackOwner || "").trim(), "rollbackOwner is required");

console.log(`Production approval verified for ${head}. No deployment action was performed.`);
