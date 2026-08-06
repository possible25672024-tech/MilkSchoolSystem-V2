import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const code = fs.readFileSync(path.join(root, "modules/services/teacherParityService.js"), "utf8");
const windowObject = {};
const context = vm.createContext({ window: windowObject, Date, Number, String, Set, Object, Array, Error });
vm.runInContext(code, context, { filename: "teacherParityService.js" });

const service = new windowObject.TeacherParityServiceClass();

assert.deepEqual(
    JSON.parse(JSON.stringify(service.normalizePreferences({
        defaultReportDays: 15,
        compactMode: true,
        rememberLastSection: false,
        lastSection: "room-stock"
    }))),
    {
        defaultReportDays: 15,
        compactMode: true,
        rememberLastSection: false,
        lastSection: "room-stock"
    },
    "Teacher preferences must keep only allowed display values"
);
assert.equal(service.normalizePreferences({ defaultReportDays: 999 }).defaultReportDays, 30);
assert.deepEqual(
    JSON.parse(JSON.stringify(service.defaultRange(15, "2026-07-30"))),
    { startDate: "2026-07-16", endDate: "2026-07-30", days: 15 },
    "Default range must be inclusive and deterministic"
);

const snapshot = {
    session: {
        roomId: "room-a",
        roomName: "อ.3-6",
        teacher: "ครูทดสอบ",
        schoolName: "โรงเรียนทดสอบ"
    },
    room: { id: "room-a", count: 3 },
    students: [{ id: "s1" }, { id: "s2" }, { id: "s3" }],
    roomStock: -2,
    attendance: {
        "room-a_2026-07-30": {
            date: "2026-07-30",
            data: { s1: "present", s2: "absent" }
        }
    },
    updatedAt: {
        roomStock: {
            "room-a": "2026-07-30T01:00:00.000Z"
        }
    }
};
const overview = service.buildOverview(snapshot);
assert.equal(overview.present, 1);
assert.equal(overview.absent, 1);
assert.equal(overview.unchecked, 1);
assert.equal(overview.roomStock, -2, "Negative Room Stock must remain visible and unclamped");

const stock = service.buildRoomStock(snapshot);
assert.equal(stock.balance, -2);
assert.equal(stock.updatedAt, "2026-07-30T01:00:00.000Z");
assert.equal(stock.readOnly, true);
assert.equal(stock.source, "roomStock-scoped-read");

const monthlyRoster = service.buildMonthlyPaperRoster(snapshot, "2026-07");
assert.equal(monthlyRoster.metadata.monthLabel, "กรกฎาคม 2569");
assert.equal(monthlyRoster.metadata.roomId, "room-a");
assert.equal(monthlyRoster.schoolDays.length, 23);
assert.equal(monthlyRoster.schoolDays[0], "2026-07-01");
assert.equal(monthlyRoster.schoolDays.at(-1), "2026-07-31");
assert.ok(
    monthlyRoster.schoolDays.every(date => {
        const weekday = new Date(`${date}T00:00:00.000Z`).getUTCDay();
        return weekday >= 1 && weekday <= 5;
    }),
    "Monthly paper roster must include Monday-Friday only"
);
assert.equal(monthlyRoster.students.length, 3);
assert.equal(monthlyRoster.source.readOnly, true);
assert.throws(
    () => service.buildMonthlyPaperRoster(snapshot, "2026-13"),
    error => error.code === "MONTHLY_PAPER_ROSTER_MONTH_INVALID"
);

const history = {
    records: [
        {
            date: "2026-07-01",
            data: { s1: "present" },
            notes: { s1: "ปกติ" },
            savedAt: "2026-07-01T01:00:00.000Z",
            teacher: "ครูทดสอบ",
            photos: ["data:image/jpeg;base64,PHOTO"],
            signature: "data:image/png;base64,SIGNATURE",
            evidence: { loaded: true, photoCount: 1, hasSignature: true }
        },
        {
            date: "2026-07-02",
            data: { s1: "absent" },
            notes: {}
        },
        {
            date: "2026-07-03",
            data: {},
            notes: {}
        }
    ]
};
const roomReport = {
    metadata: {
        schoolName: "โรงเรียนทดสอบ",
        roomId: "room-a",
        roomName: "อ.3-6",
        teacher: "ครูทดสอบ",
        startDate: "2026-07-01",
        endDate: "2026-07-03"
    },
    totals: { schoolDays: 3 },
    students: [{
        id: "s1",
        num: "1",
        name: "นักเรียนหนึ่ง",
        gender: "หญิง",
        present: 1,
        absent: 1,
        unchecked: 1,
        attendanceRate: 50
    }]
};
const studentReport = service.buildStudentReport(history, roomReport, "s1");
assert.equal(studentReport.metadata.studentName, "นักเรียนหนึ่ง");
assert.equal(studentReport.totals.present, 1);
assert.equal(studentReport.totals.absent, 1);
assert.equal(studentReport.totals.unchecked, 1);
assert.equal(studentReport.totals.attendanceRate, 50);
assert.deepEqual(
    JSON.parse(JSON.stringify(studentReport.timeline.map(row => row.status))),
    ["present", "absent", "unchecked"]
);
assert.equal(studentReport.source.evidenceHydrated, true);
assert.equal(studentReport.evidence.length, 1);
assert.deepEqual(
    JSON.parse(JSON.stringify(studentReport.evidence[0])),
    {
        date: "2026-07-01",
        teacher: "ครูทดสอบ",
        photos: ["data:image/jpeg;base64,PHOTO"],
        signature: "data:image/png;base64,SIGNATURE"
    }
);
assert.equal(studentReport.source.readOnly, true);
assert.throws(
    () => service.buildStudentReport(history, roomReport, "missing"),
    error => error.code === "STUDENT_REPORT_STUDENT_NOT_FOUND"
);

console.log("Teacher parity service checks passed.");
