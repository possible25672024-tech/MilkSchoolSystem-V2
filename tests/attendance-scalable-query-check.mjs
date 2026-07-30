import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const baseSource = read("modules/repositories/baseRepository.js");
const repositorySource = read("modules/repositories/attendanceRepository.js");
const teacherRepositorySource = read("modules/repositories/teacherRepository.js");
const adminServiceSource = read("modules/admin/adminRoomService.js");

assert.doesNotThrow(() => new vm.Script(repositorySource));
assert.ok(
    repositorySource.includes('{ shallow: true }'),
    "Scalable Attendance history must read a shallow key index before record children"
);
assert.ok(
    repositorySource.includes("mcAttendance/${key}/data"),
    "Scalable Attendance history must hydrate only each selected data child"
);
assert.ok(
    adminServiceSource.includes('attendanceMode: "none"'),
    "Admin core loading must defer the media-bearing Attendance collection"
);
assert.ok(
    adminServiceSource.includes("loadRoomAttendanceSummaries"),
    "Admin history must use the scalable summary boundary"
);
assert.ok(
    teacherRepositorySource.includes('attendanceMode === "none"'),
    "TeacherRepository must support an explicit deferred Attendance scope"
);

const calls = [];
const firebaseService = {
    async get(pathName, query = {}) {
        calls.push({ path: pathName, query: { ...query } });
        if (pathName === "milkApp/mcAttendance") {
            assert.equal(
                query.shallow,
                true,
                "The Attendance collection must use a shallow key index"
            );
            assert.deepEqual(Object.keys(query), ["shallow"]);
            return {
                "room-1_2026-07-01": true,
                "room-1_2026-07-02": true,
                "room-2_2026-07-01": true,
                "room-1_invalid": true
            };
        }
        if (pathName === "milkApp/mcAttendance/room-1_2026-07-01/data") {
            return { s1: "present", s2: "absent" };
        }
        if (pathName === "milkApp/mcAttendance/room-1_2026-07-02/data") {
            return { s1: "present", s2: "present" };
        }
        throw new Error(`Unexpected Firebase read: ${pathName}`);
    }
};
const context = vm.createContext({
    console,
    window: { FirebaseService: firebaseService }
});
new vm.Script(baseSource).runInContext(context);
new vm.Script(repositorySource).runInContext(context);

const repository = context.window.AttendanceRepository;
const records = await repository.loadRoomAttendanceSummaries("room-1", { concurrency: 2 });

assert.equal(
    JSON.stringify(Object.keys(records)),
    JSON.stringify(["room-1_2026-07-01", "room-1_2026-07-02"])
);
assert.equal(records["room-1_2026-07-01"].data.s2, "absent");
assert.equal(records["room-1_2026-07-02"].date, "2026-07-02");
assert.equal(calls.length, 3, "One shallow index and two small data-child reads are expected");
assert.ok(
    calls.every(call => (
        call.path !== "milkApp/mcAttendance" ||
        call.query.shallow === true
    )),
    "No full mcAttendance collection read is allowed in the scalable path"
);

console.log("Attendance scalable query checks passed.");
