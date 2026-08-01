import assert from "node:assert/strict";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const plan = read("docs/SPRINT_6_5_DEPLOYMENT_CLOSURE.md");
const incident = read("docs/INCIDENT_MQN0Z13EYX5B_CLOSURE_GATE.md");
const audit = read("scripts/audit-room-incident.mjs");
const runner = read("scripts/run-sprint-6.5-closure.ps1");
const verifier = read("scripts/verify-production-approval.mjs");
const approval = JSON.parse(read("release/production-approval.template.json"));
const gitignore = read(".gitignore");

for (const value of [
    "NOT READY FOR DEPLOYMENT",
    "official Firebase Realtime Database Rules Emulator UAT",
    "separate Google Firebase test project",
    "mqn0z13eyx5b",
    "Live Browser/device blocker 3 remains"
]) assert.ok(plan.includes(value), `Sprint 6.5 plan must preserve: ${value}`);

assert.ok(incident.includes("1,275"));
assert.ok(incident.includes("1,253"));
assert.ok(incident.includes("22 present and 3 absent"));
assert.ok(incident.includes("never set Room Stock directly"));
assert.ok(incident.includes("Main Stock delta is zero"));

assert.ok(audit.includes("productionWritePerformed: false"));
assert.ok(audit.includes("incidentClosed: false"));
assert.ok(audit.includes("DEPENDENT_MILK_RECORDS_EXIST"));
assert.ok(audit.includes("crypto.createHash(\"sha256\")"));
assert.equal(/fetch\s*\(/.test(audit), false, "Incident audit must remain file-only");

assert.ok(runner.includes("Java 21 or later"));
assert.ok(runner.includes("ISOLATED_TEST_PROJECT"));
assert.ok(runner.includes("npm run test:firebase-rules"));
assert.ok(runner.includes("npm run test:firebase-project"));
assert.ok(runner.includes("No Production deployment"));

assert.equal(approval.schema, "MilkSchoolSystemV2ProductionApproval/v1");
for (const value of Object.values(approval.authorization)) assert.equal(value, false);
assert.equal(approval.firebaseRulesEmulator.passed, false);
assert.equal(approval.firebaseTestProject.passed, false);
assert.equal(approval.incident.closed, false);
assert.equal(approval.liveBrowser.passed, false);

for (const key of ["mergeMain", "createReleaseTag", "deployRules", "deployApplication", "trafficCutover", "postReleaseVerification"]) {
    assert.ok(verifier.includes(key), `Approval verifier must require ${key}`);
}
assert.ok(verifier.includes("git\", [\"status\", \"--porcelain\"]"));
assert.ok(gitignore.includes("evidence/"));

console.log("Sprint 6.5 deployment closure gates passed.");
