import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "modules/admin/adminOperationalReportService.js"), "utf8");
assert.doesNotThrow(() => new vm.Script(source));

const context = vm.createContext({
    console,
    Date,
    Set,
    Map,
    Object,
    Array,
    Number,
    String,
    Error,
    window: { OperationalReportRepository: null }
});
new vm.Script(source).runInContext(context);
const Service = context.window.AdminOperationalReportService.constructor;
const service = new Service(null, { clock: () => new Date("2026-07-31T12:00:00Z") });

assert.deepEqual(
    JSON.parse(JSON.stringify(service.resolvePeriod({ type: "day", anchorDate: "2026-07-31" }))),
    { type: "day", label: "รายวัน", anchorDate: "2026-07-31", startDate: "2026-07-31", endDate: "2026-07-31" }
);
assert.deepEqual(
    JSON.parse(JSON.stringify(service.resolvePeriod({ type: "week", anchorDate: "2026-07-31" }))),
    { type: "week", label: "รายสัปดาห์", anchorDate: "2026-07-31", startDate: "2026-07-27", endDate: "2026-08-02" }
);
assert.equal(service.resolvePeriod({ type: "fortnight", anchorDate: "2026-07-09" }).endDate, "2026-07-15");
assert.equal(service.resolvePeriod({ type: "fortnight", anchorDate: "2026-07-31" }).startDate, "2026-07-16");
assert.deepEqual(
    JSON.parse(JSON.stringify(service.resolvePeriod({ type: "month", anchorDate: "2026-02-12" }))),
    { type: "month", label: "รายเดือน", anchorDate: "2026-02-12", startDate: "2026-02-01", endDate: "2026-02-28" }
);
assert.throws(
    () => service.resolvePeriod({ type: "semester", startDate: "2026-11-01", endDate: "2026-05-01" }),
    /วันเริ่ม/
);

const period = service.resolvePeriod({
    type: "semester",
    startDate: "2026-05-01",
    endDate: "2026-10-31",
    anchorDate: "2026-07-31"
});
const report = service.build({
    settings: { school: "โรงเรียนทดสอบ", year: "2569", semester: "1" },
    rooms: {
        r1: { id: "r1", name: "ป.1-1", students: { s1: {}, s2: {}, student_3: { generated: true } } },
        r2: { id: "r2", name: "ป.2-1", count: 3 }
    },
    mainStock: 500,
    roomStock: { r1: 12, r2: 7 },
    receives: { one: { date: "2026-07-01", total: 100 } },
    distributes: {
        one: { date: "2026-07-02", roomId: "r1", roomName: "ป.1-1", students: 2, days: 10, total: 20, crates: 0, boxes: 20, stockBefore: 520, stockAfter: 500 }
    },
    attendance: {
        "r1_2026-07-03": { data: { s1: "present", s2: "present" } }
    },
    absentMilk: {},
    retroMilk: { one: { date: "2026-07-04", roomId: "r1", totalBoxes: 2 } },
    vacationMilk: { one: { date: "2026-07-05", roomId: "r1", total: 3 } },
    localPending: [
        { dispenseDate: "2026-07-06", classId: "r1", boxes: 1 },
        { dispenseDate: "2026-11-06", classId: "r1", boxes: 99 }
    ],
    localRetro: [],
    localVacation: []
}, period, "room");

assert.equal(report.roomRows.length, 1, "Only rooms with period activity belong in the report");
assert.equal(report.roomRows[0].students, 2, "Generated fallback students must be excluded");
assert.equal(report.schoolTotal.received, 100);
assert.equal(report.schoolTotal.distributed, 20);
assert.equal(report.schoolTotal.attendance, 2);
assert.equal(report.schoolTotal.pending, 1, "Out-of-period local records must be excluded");
assert.equal(report.schoolTotal.retro, 2);
assert.equal(report.schoolTotal.vacation, 3);
assert.equal(report.schoolTotal.used, 8);
assert.equal(report.schoolTotal.netMovement, 12);
assert.equal(report.currentStock.main, 500);
assert.equal(report.currentStock.rooms, 19);
assert.equal(report.distributions.length, 1);
assert.equal(service.buildExportModel(report, "distribution").rows[0]["รวมกล่อง"], 20);
assert.equal(service.buildExportModel(report, "summary").rows[0]["รับเข้า (ทั้งโรงเรียน)"], 100);
assert.equal(service.buildExportModel(report, "summary").rows[0]["Main Stock ปัจจุบัน"], 500);
assert.deepEqual(
    JSON.parse(JSON.stringify(report.sourceDiagnostics.counts)),
    { pending: 1, retro: 0, vacation: 0 },
    "Local source diagnostics must describe the selected period only"
);

console.log("Operational report period and formula checks passed.");
