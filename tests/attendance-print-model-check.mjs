import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const source = fs.readFileSync(path.join(root, "modules/reports/attendancePrintModel.js"), "utf8");

new vm.Script(source, { filename: "attendancePrintModel.js" });

for (const forbidden of [
    "firebaseService",
    "fetch(",
    "XMLHttpRequest",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "window.print",
    "dispatchEvent",
    "roomStock",
    "mainStock",
    "stockLog",
    "ledger",
    "data:image",
    "/photos",
    "/signature"
]) {
    assert.ok(!source.includes(forbidden), `Attendance print model must not own ${forbidden}`);
}

const windowObject = {};
windowObject.window = windowObject;
const context = vm.createContext({
    window: windowObject,
    console,
    Date,
    Intl,
    Map,
    Set,
    Object,
    Array,
    Number,
    String,
    Math,
    Error
});
vm.runInContext(source, context, { filename: "attendancePrintModel.js" });

const AttendancePrintModel = windowObject.AttendancePrintModelClass;
const model = new AttendancePrintModel({ rowsPerPage: 2 });
const plain = value => JSON.parse(JSON.stringify(value));

const report = {
    metadata: {
        schoolName: "โรงเรียนทดสอบ",
        roomId: "room-36",
        roomName: "อ.3-6สลิคคี",
        teacher: "ครูทดสอบ",
        startDate: "2026-07-01",
        endDate: "2026-07-03",
        year: 2569,
        term: 1
    },
    totals: {
        requestedDays: 3,
        schoolDays: 2,
        completeDays: 1,
        incompleteDays: 1,
        students: 5,
        studentRows: 10,
        present: 7,
        absent: 2,
        unchecked: 1,
        checked: 9,
        attendanceRate: 77.78
    },
    students: [
        { id: "s1", num: "1", name: "กานต์ ทดสอบ", gender: "ชาย", present: 2, absent: 0, unchecked: 0, checked: 2, totalDays: 2, notesCount: 0, attendanceRate: 100 },
        { id: "s2", num: "2", name: "ขวัญ ทดสอบ", gender: "หญิง", present: 1, absent: 1, unchecked: 0, checked: 2, totalDays: 2, notesCount: 1, attendanceRate: 50 },
        { id: "s3", num: "3", name: "จันทร์ ทดสอบ", gender: "หญิง", present: 1, absent: 0, unchecked: 1, checked: 1, totalDays: 2, notesCount: 0, attendanceRate: 100 },
        { id: "s4", num: "4", name: "เดช ทดสอบ", gender: "ชาย", present: 2, absent: 0, unchecked: 0, checked: 2, totalDays: 2, notesCount: 0, attendanceRate: 100 },
        { id: "s5", num: "5", name: "เอม ทดสอบ", gender: "หญิง", present: 1, absent: 1, unchecked: 0, checked: 2, totalDays: 2, notesCount: 1, attendanceRate: 50 }
    ],
    source: {
        requestedDays: 3,
        recordCount: 2,
        evidenceHydrated: false
    },
    unsafe: {
        photos: ["data:image/jpeg;base64,SECRET"],
        signature: "data:image/png;base64,SECRET"
    }
};
const originalReport = structuredClone(report);

const output = plain(model.build(report, {
    printedAt: "2026-07-29T23:45:00.000Z"
}));

assert.equal(output.format, "A4");
assert.equal(output.orientation, "portrait");
assert.equal(output.title, "รายงานการเช็กดื่มนมรายวัน");
assert.equal(output.metadata.schoolName, "โรงเรียนทดสอบ");
assert.equal(output.metadata.roomName, "อ.3-6สลิคคี");
assert.equal(output.metadata.teacher, "ครูทดสอบ");
assert.equal(output.metadata.rangeLabel, "01/07/2026 ถึง 03/07/2026");
assert.equal(output.metadata.academicLabel, "ปีการศึกษา 2569 ภาคเรียนที่ 1");
assert.equal(output.printedAt, "2026-07-29T23:45:00.000Z");
assert.equal(output.printedAtLabel, "2026-07-30 06:45");

assert.deepEqual(output.totals, {
    requestedDays: 3,
    schoolDays: 2,
    completeDays: 1,
    incompleteDays: 1,
    students: 5,
    studentRows: 10,
    present: 7,
    absent: 2,
    unchecked: 1,
    checked: 9,
    attendanceRate: 77.78
});

assert.equal(output.source.rowsPerPage, 2);
assert.equal(output.source.pageCount, 3);
assert.equal(output.source.studentCount, 5);
assert.equal(output.source.reportRecordCount, 2);
assert.equal(output.source.evidenceHydrated, false);
assert.equal(output.pages.length, 3);
assert.deepEqual(
    output.columns.map(column => column.label),
    ["ลำดับ", "เลขที่", "รหัสนักเรียน", "ชื่อ-นามสกุล", "เพศ", "ดื่มนม", "ไม่ดื่มนม", "ยังไม่ตรวจ", "อัตราดื่มนม (%)", "หมายเหตุ"],
    "A4 columns must use milk-consumption wording without changing present/absent keys"
);
assert.deepEqual(output.pages.map(page => page.rows.length), [2, 2, 1]);
assert.deepEqual(output.pages.map(page => page.pageNumber), [1, 2, 3]);
assert.deepEqual(output.pages.map(page => page.pageBreakAfter), [true, true, false]);
assert.deepEqual(output.pages.flatMap(page => page.rows.map(row => row.rowNumber)), [1, 2, 3, 4, 5]);
assert.deepEqual(output.pages.flatMap(page => page.rows.map(row => row.id)), ["s1", "s2", "s3", "s4", "s5"]);
assert.ok(output.pages.every(page => page.columns.length === output.columns.length), "Every printed page must repeat the table header contract");
assert.ok(output.pages.every(page => page.header.rangeLabel === output.metadata.rangeLabel), "Every printed page must repeat the selected range");
assert.deepEqual(output.pages.map(page => page.footer.pageLabel), ["หน้า 1 / 3", "หน้า 2 / 3", "หน้า 3 / 3"]);
assert.ok(!JSON.stringify(output).includes("data:image"), "Print model must not expose evidence payloads");
assert.ok(!Object.hasOwn(output, "unsafe"), "Print model must whitelist report fields");
assert.deepEqual(report, originalReport, "Print model must not mutate the report input");

const repeated = plain(model.build(report, {
    printedAt: "2026-07-29T23:45:00.000Z"
}));
assert.deepEqual(repeated, output, "Print output must be deterministic for the same report and timestamp");

const oneDay = plain(model.build({
    metadata: {
        startDate: "2026-07-03",
        endDate: "2026-07-03",
        year: "mixed",
        term: ""
    },
    totals: {},
    students: []
}, {
    printedAt: "2026-07-29T23:45:00.000Z",
    rowsPerPage: 100
}));
assert.equal(oneDay.metadata.rangeLabel, "03/07/2026");
assert.equal(oneDay.metadata.academicLabel, "ปีการศึกษา mixed");
assert.equal(oneDay.source.rowsPerPage, 40, "Rows per A4 page must remain bounded");
assert.equal(oneDay.pages.length, 1);
assert.equal(oneDay.pages[0].rows.length, 0);
assert.equal(oneDay.pages[0].pageBreakAfter, false);
assert.equal(oneDay.pages[0].footer.pageLabel, "หน้า 1 / 1");

assert.throws(
    () => model.build(report, { printedAt: "not-a-date" }),
    error => error.code === "ATTENDANCE_PRINT_TIMESTAMP_INVALID"
);

console.log("Attendance print model checks passed.");
