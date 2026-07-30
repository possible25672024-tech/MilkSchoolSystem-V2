import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const source = fs.readFileSync(
    path.join(root, "modules/reports/attendanceReportBuilder.js"),
    "utf8"
);

new vm.Script(source, { filename: "attendanceReportBuilder.js" });
for (const forbidden of [
    "FirebaseService",
    "firebaseService",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "roomStock",
    "mainStock",
    "stockLog",
    "ledger",
    "tc_pending_saves_v1"
]) {
    assert.ok(!source.includes(forbidden), `AttendanceReportBuilder must not own ${forbidden}`);
}

const windowObject = {};
windowObject.window = windowObject;
const context = vm.createContext({
    window: windowObject,
    console,
    Number,
    String,
    Math,
    Set,
    Object,
    Array
});
vm.runInContext(source, context, { filename: "attendanceReportBuilder.js" });

const AttendanceReportBuilder = windowObject.AttendanceReportBuilderClass;
assert.equal(typeof AttendanceReportBuilder, "function");
const builder = new AttendanceReportBuilder();
const plain = value => JSON.parse(JSON.stringify(value));

const history = {
    roomId: "room-36",
    roomName: "อ.3-6สลิคคี",
    teacher: "ครูทดสอบ",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    requestedDays: 3,
    records: [
        {
            key: "room-36_2026-07-03",
            clsId: "room-36",
            roomName: "อ.3-6สลิคคี",
            date: "2026-07-03",
            year: 2569,
            term: 1,
            teacher: "ครูทดสอบ",
            data: { s1: "absent", s4: "present", ignored: "late" },
            notes: { s1: "ลา", empty: "" },
            savedAt: "2026-07-03T08:00:00.000Z",
            photos: ["data:image/jpeg;base64,SECRET"],
            signature: "data:image/png;base64,SECRET",
            evidence: { loaded: false, photoCount: null, hasSignature: null }
        },
        {
            key: "room-36_2026-07-01",
            clsId: "room-36",
            roomName: "อ.3-6สลิคคี",
            date: "2026-07-01",
            year: 2569,
            term: 1,
            teacher: "ครูทดสอบ",
            data: { s2: "absent", s1: "present" },
            notes: { s2: "ลา" },
            savedAt: "2026-07-01T08:00:00.000Z",
            evidence: { loaded: false, photoCount: null, hasSignature: null }
        },
        {
            key: "room-36_2026-07-02",
            clsId: "room-36",
            roomName: "อ.3-6สลิคคี",
            date: "2026-07-02",
            year: 2569,
            term: 1,
            teacher: "ครูทดสอบ",
            data: { s1: "present", s2: "present", s3: "absent" },
            notes: {},
            savedAt: "2026-07-02T08:00:00.000Z",
            evidence: { loaded: false, photoCount: null, hasSignature: null }
        }
    ]
};
const contextInput = {
    schoolName: "โรงเรียนทดสอบ",
    students: [
        { id: "s2", num: "2", name: "นักเรียนสอง", gender: "หญิง" },
        { id: "s1", num: "1", name: "นักเรียนหนึ่ง", gender: "ชาย" },
        { id: "s3", num: "3", name: "นักเรียนสาม", gender: "ชาย" },
        { id: "s1", num: "99", name: "ข้อมูลซ้ำ" }
    ]
};
const originalHistory = structuredClone(history);
const originalContext = structuredClone(contextInput);

const report = plain(builder.build(history, contextInput));
assert.deepEqual(report.metadata, {
    schoolName: "โรงเรียนทดสอบ",
    roomId: "room-36",
    roomName: "อ.3-6สลิคคี",
    teacher: "ครูทดสอบ",
    startDate: "2026-07-01",
    endDate: "2026-07-03",
    year: "2569",
    term: "1",
    yearValues: ["2569"],
    termValues: ["1"]
});
assert.deepEqual(report.totals, {
    requestedDays: 3,
    schoolDays: 3,
    completeDays: 0,
    incompleteDays: 3,
    students: 5,
    studentRows: 15,
    present: 4,
    absent: 3,
    unchecked: 8,
    checked: 7,
    attendanceRate: 57.14
});
assert.deepEqual(report.daily.map(day => ({
    date: day.date,
    present: day.present,
    absent: day.absent,
    unchecked: day.unchecked,
    checked: day.checked,
    totalStudents: day.totalStudents,
    complete: day.complete
})), [
    { date: "2026-07-01", present: 1, absent: 1, unchecked: 3, checked: 2, totalStudents: 5, complete: false },
    { date: "2026-07-02", present: 2, absent: 1, unchecked: 2, checked: 3, totalStudents: 5, complete: false },
    { date: "2026-07-03", present: 1, absent: 1, unchecked: 3, checked: 2, totalStudents: 5, complete: false }
]);
assert.deepEqual(report.students.map(student => student.id), ["s1", "s2", "s3", "ignored", "s4"]);
assert.deepEqual(report.students.map(student => ({
    id: student.id,
    present: student.present,
    absent: student.absent,
    unchecked: student.unchecked,
    checked: student.checked,
    totalDays: student.totalDays,
    notesCount: student.notesCount,
    roster: student.roster
})), [
    { id: "s1", present: 2, absent: 1, unchecked: 0, checked: 3, totalDays: 3, notesCount: 1, roster: true },
    { id: "s2", present: 1, absent: 1, unchecked: 1, checked: 2, totalDays: 3, notesCount: 1, roster: true },
    { id: "s3", present: 0, absent: 1, unchecked: 2, checked: 1, totalDays: 3, notesCount: 0, roster: true },
    { id: "ignored", present: 0, absent: 0, unchecked: 3, checked: 0, totalDays: 3, notesCount: 0, roster: false },
    { id: "s4", present: 1, absent: 0, unchecked: 2, checked: 1, totalDays: 3, notesCount: 0, roster: false }
]);
assert.equal(report.students[0].attendanceRate, 66.67);
assert.equal(report.students[3].attendanceRate, null);
assert.deepEqual(report.source, {
    requestedDays: 3,
    recordCount: 3,
    evidenceHydrated: false
});
assert.ok(!JSON.stringify(report).includes("data:image"), "Summary result must not expose evidence payloads");
assert.ok(!Object.hasOwn(report.daily[0], "photos"));
assert.ok(!Object.hasOwn(report.daily[0], "signature"));
assert.deepEqual(history, originalHistory, "Summary builder must not mutate history input");
assert.deepEqual(contextInput, originalContext, "Summary builder must not mutate context input");

const mixed = plain(builder.build({
    roomId: "room-36",
    records: [
        { date: "2026-05-01", year: 2568, term: 2, data: { s1: "present" } },
        { date: "2026-07-01", year: 2569, term: 1, data: { s1: "absent" } }
    ]
}, {
    schoolName: "โรงเรียนทดสอบ",
    students: [{ id: "s1", num: 1, name: "นักเรียนหนึ่ง" }]
}));
assert.equal(mixed.metadata.year, "mixed");
assert.equal(mixed.metadata.term, "mixed");
assert.deepEqual(mixed.metadata.yearValues, ["2568", "2569"]);
assert.deepEqual(mixed.metadata.termValues, ["1", "2"]);

const explicitMetadata = plain(builder.build({
    roomId: "room-36",
    records: mixed.daily.map(day => ({ date: day.date, year: day.year, term: day.term, data: { s1: "present" } }))
}, {
    year: 2570,
    term: 1,
    students: [{ id: "s1", num: 1, name: "นักเรียนหนึ่ง" }]
}));
assert.equal(explicitMetadata.metadata.year, "2570");
assert.equal(explicitMetadata.metadata.term, "1");

const empty = plain(builder.build({
    roomId: "room-36",
    roomName: "อ.3-6สลิคคี",
    startDate: "2026-07-10",
    endDate: "2026-07-10",
    requestedDays: 1,
    records: []
}, {
    students: [{ id: "s1", num: 1, name: "นักเรียนหนึ่ง" }]
}));
assert.equal(empty.totals.schoolDays, 0);
assert.equal(empty.totals.studentRows, 0);
assert.equal(empty.totals.students, 1);
assert.equal(empty.totals.attendanceRate, null);
assert.deepEqual(empty.daily, []);
assert.deepEqual(empty.students.map(student => ({ id: student.id, totalDays: student.totalDays })), [
    { id: "s1", totalDays: 0 }
]);

console.log("Attendance report builder checks passed.");
