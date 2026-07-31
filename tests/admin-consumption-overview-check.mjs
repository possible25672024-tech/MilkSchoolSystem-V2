import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const serviceSource = fs.readFileSync("modules/admin/adminConsumptionService.js", "utf8");
const managerSource = fs.readFileSync("modules/admin/adminConsumptionManager.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminConsumptionView.js", "utf8");
const repositorySource = fs.readFileSync("modules/repositories/attendanceRepository.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const [name, source] of [
    ["service", serviceSource],
    ["manager", managerSource],
    ["view", viewSource]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}
for (const forbidden of ["fetch(", "FirebaseService", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Consumption View must not own ${forbidden}`);
}
for (const marker of [
    'data-admin-menu="dashboard"',
    'data-admin-menu="attendance"',
    'id="admin-consumption-date"',
    'id="admin-consumption-rate"',
    'id="admin-consumption-latest"',
    'id="admin-consumption-room-status"',
    'id="admin-attendance-room-filter"',
    'id="admin-attendance-month"',
    'id="admin-attendance-body"'
]) {
    assert.ok(html.includes(marker), `Admin consumption UI is missing ${marker}`);
}
assert.match(repositorySource, /loadAttendanceSummaries/);
assert.match(repositorySource, /mcAttendance.*shallow: true/s);
assert.match(appSource, /ensureAdminConsumptionView/);
assert.match(viewSource, /AdminRoomView\?\.openRecordDetail\?\.\("attendance"/);

const calls = [];
const summaries = [
    {
        id: "r1_2026-07-31", roomId: "r1", roomName: "ป.1-1", date: "2026-07-31",
        teacher: "ครูหนึ่ง", savedAt: "2026-07-31T08:00:00.000Z",
        data: { s1: "present", s2: "absent" }
    },
    {
        id: "r2_2026-07-30", roomId: "r2", roomName: "ป.1-2", date: "2026-07-30",
        teacher: "ครูสอง", savedAt: "2026-07-30T08:00:00.000Z",
        data: { s3: "present", s4: "present" }
    }
];
const attendanceRepository = {
    async loadAttendanceSummaries(options) {
        calls.push(options);
        return summaries.filter(record => (
            (!options.roomId || record.roomId === options.roomId)
            && record.date >= options.startDate
            && record.date <= options.endDate
        ));
    }
};
const stockRepository = {
    async loadRooms() {
        return {
            r1: {
                id: "r1", name: "ป.1-1", teacher: "ครูหนึ่ง",
                students: [{ id: "s1" }, { id: "s2" }]
            },
            r2: { id: "r2", name: "ป.1-2", teacher: "ครูสอง", count: 2 }
        };
    }
};
const context = vm.createContext({ console, Date, Math, Object, Array, Number, String, Error, Map, window: {} });
new vm.Script(serviceSource).runInContext(context);
const Service = context.window.AdminConsumptionService.constructor;
const service = new Service(attendanceRepository, stockRepository, {
    clock: () => new Date("2026-07-31T09:00:00+07:00")
});
const admin = { role: "admin", isAdmin: true };
const overview = await service.loadOverview(admin, "2026-07-31");

assert.equal(overview.rooms, 2);
assert.equal(overview.students, 4);
assert.equal(overview.presentToday, 1);
assert.equal(overview.absentToday, 1);
assert.equal(overview.monthlyRate, 75);
assert.equal(overview.roomStatuses.find(room => room.roomId === "r1").status, "complete");
assert.equal(overview.roomStatuses.find(room => room.roomId === "r2").status, "missing");

const history = await service.loadHistory(admin, { roomId: "r1", month: "2026-07" });
assert.equal(history.records.length, 1);
assert.equal(history.records[0].unchecked, 0);
assert.equal(calls.at(-1).roomId, "r1");
await assert.rejects(
    service.loadOverview({ role: "teacher", isAdmin: false }, "2026-07-31"),
    error => error.code === "ADMIN_SESSION_REQUIRED"
);

console.log("Admin school-wide drinking overview and history checks passed.");
