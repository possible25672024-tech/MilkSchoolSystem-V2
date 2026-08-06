import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const baseSource = read("modules/repositories/baseRepository.js");
const reportRepositorySource = read("modules/repositories/reportRepository.js");
const teacherServiceSource = read("modules/services/teacherService.js");

for (const source of [reportRepositorySource, teacherServiceSource]) {
    assert.doesNotThrow(() => new vm.Script(source));
}

const calls = [];
const indexes = {
    "milkApp/mcAttendance": { "r1_2026-07-30": true },
    "milkApp/absentMilk": { p1: true },
    "milkApp/retroMilk": { rt1: true },
    "milkApp/vacationMilk": { v1: true }
};
const values = {
    "milkApp/settings": { school: "โรงเรียนทดสอบ" },
    "milkApp/rooms": [{ id: "r1", name: "อ.1-1", count: 2 }],
    "milkApp/distributes": [{ id: "d1", roomId: "r1", total: 20 }],
    "milkApp/mcAttendance/r1_2026-07-30/data": { s1: "present", s2: "absent" },
    "milkApp/absentMilk/p1/roomId": "r1",
    "milkApp/absentMilk/p1/totalBoxes": 1,
    "milkApp/retroMilk/rt1/roomId": "r1",
    "milkApp/retroMilk/rt1/totalBoxes": 2,
    "milkApp/vacationMilk/v1/roomId": "r1",
    "milkApp/vacationMilk/v1/totalBoxes": 3
};
const firebaseService = {
    async get(pathName, query = {}) {
        calls.push({ path: pathName, query: { ...query } });
        if (Object.hasOwn(indexes, pathName)) {
            assert.equal(query.shallow, true, `${pathName} must use a shallow index`);
            return indexes[pathName];
        }
        return Object.hasOwn(values, pathName) ? values[pathName] : null;
    }
};
const repositoryContext = vm.createContext({
    console,
    window: {
        FirebaseService: firebaseService,
        StockRepository: null
    }
});
new vm.Script(baseSource).runInContext(repositoryContext);
new vm.Script(reportRepositorySource).runInContext(repositoryContext);

const snapshot = await repositoryContext.window.ReportRepository.loadReportSnapshot();
assert.equal(snapshot.attendance["r1_2026-07-30"].data.s1, "present");
assert.equal(snapshot.absentMilk.p1.totalBoxes, 1);
assert.equal(snapshot.retroMilk.rt1.totalBoxes, 2);
assert.equal(snapshot.vacationMilk.v1.totalBoxes, 3);
assert.ok(
    calls.every(call => ![
        "photos", "signature", "signatures"
    ].some(field => call.path.endsWith(`/${field}`))),
    "Admin report aggregation must never hydrate media or signatures"
);
assert.ok(
    !calls.some(call => (
        call.path === "milkApp/mcAttendance" &&
        call.query.shallow !== true
    )),
    "Admin reports must not perform a full mcAttendance read"
);

const teacherContext = vm.createContext({
    console,
    Date,
    Set,
    Object,
    Array,
    Number,
    String,
    Error,
    window: {
        TeacherRepository: { loadTeacherSnapshot: async () => ({}) },
        RoomRepository: {}
    }
});
new vm.Script(teacherServiceSource).runInContext(teacherContext);
const teacherService = teacherContext.window.TeacherService;
assert.equal(
    teacherService.sumRecords({
        one: { totalBoxes: 2 },
        two: { totalBoxes: 3 }
    }, ["totalBoxes"]),
    5,
    "Teacher dashboard totals must accept Firebase object collections"
);

console.log("Report scalable query checks passed.");
