import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const read = path => fs.readFileSync(path, "utf8");
const plan = read("docs/SPRINT_6_4_FIREBASE_AUTH_RULES_UAT.md");
const guide = read("docs/FIREBASE_AUTH_RULES_UAT_GUIDE.md");
const status = read("SPRINT_STATUS.md");
const auth = read("modules/services/firebaseAuthService.js");
const login = read("modules/services/loginService.js");
const firebase = read("modules/services/firebaseService.js");
const realProject = read("tests/firebase-real-test-project-uat.mjs");
const attributes = read(".gitattributes");
const indexHash = crypto.createHash("sha256").update(fs.readFileSync("index.html")).digest("hex");
const teacherHash = crypto.createHash("sha256").update(fs.readFileSync("teacher.html")).digest("hex");

for (const marker of [
    "feature/sprint-6.4-firebase-auth-rules-uat",
    "100/100",
    "EXTERNAL RULES AND LIVE UAT BLOCKED",
    "NOT READY FOR DEPLOYMENT",
    "mqn0z13eyx5b",
    "2026-07-28"
]) assert.ok(plan.includes(marker), `Sprint 6.4 report is missing ${marker}`);

assert.match(status, /Current Branch: `feature\/sprint-6\.4-firebase-auth-rules-uat`/);
assert.match(auth, /accounts:signInWithPassword/);
assert.match(auth, /refresh_token/);
assert.match(login, /firebase-uid-profile/);
assert.doesNotMatch(login, /adminPassword|teacherPassword|defaultPassword/);
assert.match(firebase, /setAuthTokenProvider/);
assert.match(firebase, /refreshAuthToken/);
assert.ok(fs.existsSync("firebase/database.rules.json"));
assert.ok(fs.existsSync("firebase/database.rules.rollback.json"));
assert.match(guide, /Java 21/);
assert.match(guide, /ISOLATED_TEST_PROJECT/);
assert.match(realProject, /assert\.notEqual\(databaseURL, productionURL/);
assert.match(realProject, /realtime-database-9fc52/);
assert.match(realProject, /status, 412/);
assert.match(attributes, /assets\/vendor\/pdf-lib\.min\.js -text/);
assert.match(attributes, /assets\/vendor\/xlsx\.full\.min\.js -text/);
assert.equal(indexHash, "bba9948bc8b7bb0334b1da552490d3ae085b960c983346f6690739a7dfb3c365");
assert.equal(teacherHash, "7c64cdc8777b7303281263cfb414b427b7fc1395c5aa65673c40a51b6591a154");

console.log("Sprint 6.4 Firebase Authentication, Rules, external-UAT blockers, and protected-file readiness checks passed.");
