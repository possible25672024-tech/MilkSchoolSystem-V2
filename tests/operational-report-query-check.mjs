import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const baseSource = read("modules/repositories/baseRepository.js");
const repositorySource = read("modules/repositories/operationalReportRepository.js");
assert.doesNotThrow(() => new vm.Script(repositorySource));
for (const forbidden of ["this.set(", "this.update(", "this.remove(", "this.push(", "applyMultiLocationUpdate"]) {
    assert.ok(!repositorySource.includes(forbidden), `Operational reports must not own write operation ${forbidden}`);
}

const calls = [];
const indexes = {
    "milkApp/receives": { in: true, out: true },
    "milkApp/distributes": { din: true, dout: true },
    "milkApp/mcAttendance": { "r1_2026-07-03": true, "r1_2026-08-03": true },
    "milkApp/absentMilk": {},
    "milkApp/retroMilk": {},
    "milkApp/vacationMilk": {}
};
const values = {
    "milkApp/settings": { school: "โรงเรียนทดสอบ" },
    "milkApp/rooms": { r1: { id: "r1", name: "ป.1-1" } },
    "milkApp/stock": 500,
    "milkApp/roomStock": { r1: 10 },
    "milkApp/receives/in/date": "2026-07-01",
    "milkApp/receives/out/date": "2026-08-01",
    "milkApp/receives/in/total": 100,
    "milkApp/distributes/din/date": "2026-07-02",
    "milkApp/distributes/dout/date": "2026-08-02",
    "milkApp/distributes/din/roomId": "r1",
    "milkApp/distributes/din/total": 20,
    "milkApp/mcAttendance/r1_2026-07-03/data": { s1: "present" }
};
const firebaseService = {
    async get(pathName, query = {}) {
        calls.push({ path: pathName, query: { ...query } });
        if (Object.hasOwn(indexes, pathName)) {
            assert.equal(query.shallow, true, `${pathName} must use shallow key discovery`);
            return indexes[pathName];
        }
        return Object.hasOwn(values, pathName) ? values[pathName] : null;
    }
};
const context = vm.createContext({
    console,
    Promise,
    Object,
    Array,
    Number,
    String,
    Error,
    window: { FirebaseService: firebaseService }
});
new vm.Script(baseSource).runInContext(context);
new vm.Script(repositorySource).runInContext(context);

const snapshot = await context.window.OperationalReportRepository.loadPeriodSnapshot({
    startDate: "2026-07-01",
    endDate: "2026-07-31"
});
assert.equal(snapshot.receives.in.total, 100);
assert.equal(snapshot.receives.out, undefined);
assert.equal(snapshot.distributes.din.total, 20);
assert.equal(snapshot.distributes.dout, undefined);
assert.equal(snapshot.attendance["r1_2026-07-03"].data.s1, "present");
assert.equal(snapshot.attendance["r1_2026-08-03"], undefined);
assert.ok(!calls.some(call => call.path === "milkApp/receives/out/total"), "Out-of-range receipt detail must not hydrate");
assert.ok(!calls.some(call => call.path === "milkApp/distributes/dout/total"), "Out-of-range distribution detail must not hydrate");
assert.ok(!calls.some(call => call.path === "milkApp/mcAttendance/r1_2026-08-03/data"), "Out-of-range Attendance data must not hydrate");
assert.ok(!calls.some(call => /\/(photos|photo|signature|signatures|media)$/.test(call.path)), "Reports must never hydrate media");

console.log("Operational report scalable period query checks passed.");
