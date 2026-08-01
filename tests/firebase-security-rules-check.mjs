import assert from "node:assert/strict";
import fs from "node:fs";

const rules = JSON.parse(fs.readFileSync("firebase/database.rules.json", "utf8"));
const rollback = JSON.parse(fs.readFileSync("firebase/database.rules.rollback.json", "utf8"));
const source = JSON.stringify(rules);
const milkApp = rules.rules.milkApp;

assert.equal(rules.rules[".read"], false);
assert.equal(rules.rules[".write"], false);
assert.equal(milkApp.public.loginDirectory[".read"], true);
assert.equal(milkApp.public.appSettings[".read"], true);
assert.match(milkApp[".read"], /role.*admin/);
assert.match(milkApp[".write"], /role.*admin/);
assert.match(milkApp.accessControl.users.$uid[".read"], /auth\.uid == \$uid/);
assert.equal(milkApp.accessControl.users.$uid[".write"], false);
assert.equal(milkApp.settings.adminPassword[".validate"], false);
assert.equal(milkApp.settings.teacherPassword[".validate"], false);
assert.equal(milkApp.settings.firebaseKey[".validate"], false);
assert.match(milkApp.settings[".read"], /role.*admin/);
assert.equal(milkApp.public.appSettings.adminPassword[".validate"], false);

for (const collection of ["absentMilk", "retroMilk", "vacationMilk", "distributes", "stockTransactions"]) {
    assert.match(milkApp[collection][".read"], /query\.orderByChild == 'roomId'/, `${collection} must require a roomId query`);
    assert.match(milkApp[collection][".read"], /query\.equalTo/, `${collection} must require the authenticated room value`);
    assert.deepEqual(milkApp[collection][".indexOn"], ["roomId"]);
}
assert.match(milkApp.mcAttendance[".read"], /query\.orderByKey == true/);
assert.match(milkApp.mcAttendance[".read"], /query\.startAt/);
assert.match(milkApp.mcAttendance[".read"], /query\.endAt/);
assert.match(milkApp.roomStock.$roomId[".write"], /roomId.*\$roomId/);
assert.match(source, /enabled/);

assert.equal(rollback.rules[".read"], false);
assert.equal(rollback.rules[".write"], false);
assert.equal(rollback.rules.milkApp[".write"], false, "Rollback Rules must freeze all operational writes");
assert.equal(rollback.rules.milkApp.public.loginDirectory[".read"], true);
assert.equal(rollback.rules.milkApp.public.appSettings[".read"], true);

console.log("Firebase Security Rules deny-by-default, Admin, Teacher room-scope, password rejection, and safe rollback checks passed.");
