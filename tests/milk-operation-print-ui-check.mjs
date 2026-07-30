import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const printCode = read("modules/reports/milkOperationPrintView.js");
const attendanceCode = read("modules/reports/attendancePrintView.js");
const teacherCode = read("modules/teacher/teacherParityView.js");
const appCode = read("modules/core/app.js");
const pendingCode = read("modules/pending/pendingMilkView.js");
const retroactiveCode = read("modules/retroactive/retroactiveMilkView.js");
const vacationCode = read("modules/vacation/vacationMilkView.js");

assert.doesNotThrow(() => new vm.Script(printCode), "Milk operation print view must contain valid JavaScript");
assert.ok(
    appCode.includes('import("../reports/milkOperationPrintView.js")'),
    "App must dynamically load the shared milk operation print view"
);
for (const [code, marker] of [
    [pendingCode, "data-pending-print"],
    [retroactiveCode, "data-retro-print"],
    [vacationCode, "data-vacation-print"]
]) {
    assert.ok(code.includes(marker), `${marker} must be available from operational history`);
    assert.ok(code.includes("พิมพ์รายงาน A4"), "Operational history must expose the A4 print label");
}

assert.ok(
    attendanceCode.includes("repeat(5,minmax(0,1fr))"),
    "Room Attendance evidence photos must use one five-photo row"
);
assert.ok(
    teacherCode.includes("repeat(5,minmax(0,1fr))"),
    "Student Attendance evidence photos must use one five-photo row"
);
assert.ok(
    !attendanceCode.includes("evidence-page"),
    "Room Attendance must not force one evidence page per day"
);
assert.ok(
    !teacherCode.includes("evidence-page"),
    "Student Attendance must not force one evidence page per day"
);

const emitted = [];
class FakeCustomEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
}
const windowObject = {
    open() {},
    setTimeout(callback) {
        callback();
    },
    dispatchEvent(event) {
        emitted.push(event);
    }
};
const context = vm.createContext({
    window: windowObject,
    CustomEvent: FakeCustomEvent,
    Date,
    Intl,
    Number,
    String,
    Object,
    Array,
    Error
});
vm.runInContext(printCode, context, { filename: "milkOperationPrintView.js" });
const PrintView = windowObject.MilkOperationPrintViewClass;

const photos = Array.from(
    { length: 6 },
    (_, index) => `data:image/jpeg;base64,PHOTO_${index + 1}`
);
const signatures = {
    student_1: {
        sig: "data:image/png;base64,SIGNATURE_1",
        receiverName: "ผู้ปกครองหนึ่ง"
    }
};
const students = [
    { id: "student_1", num: "1", name: "นักเรียนหนึ่ง" },
    { id: "student_2", num: "2", name: "นักเรียนสอง" }
];
const common = {
    roomId: "room-a",
    roomName: "อ.3-6",
    teacher: "ครูทดสอบ",
    date: "2026-07-30",
    totalBoxes: 4,
    photos,
    signatures
};
const view = new PrintView({
    now: () => "2026-07-30T04:00:00.000Z",
    eventTarget: windowObject
});

const pendingHtml = view.buildDocument({
    kind: "pending",
    session: { role: "teacher", roomId: "room-a", schoolName: "โรงเรียนทดสอบ" },
    students,
    record: {
        ...common,
        id: "pending-1",
        weekStart: "2026-07-27",
        weekEnd: "2026-07-31",
        students: {
            student_1: { name: "นักเรียนหนึ่ง", days: ["2026-07-27", "2026-07-28"] },
            student_2: { name: "นักเรียนสอง", days: ["2026-07-29", "2026-07-30"] }
        }
    }
});
assert.ok(pendingHtml.includes("รายงานจ่ายนมค้างรายสัปดาห์"));
assert.ok(pendingHtml.includes("นักเรียนหนึ่ง"));
assert.ok(pendingHtml.includes("รูปถ่ายแนบต่อรายงาน (5 รูป)"));
assert.ok(pendingHtml.includes(photos[4]));
assert.ok(!pendingHtml.includes(photos[5]), "Print must retain the five-photo limit");
assert.ok(pendingHtml.includes("ผู้ปกครองหนึ่ง"));
assert.ok(pendingHtml.includes("repeat(5,minmax(0,1fr))"));
assert.ok(!pendingHtml.includes("page-break-before"));

const retroactiveHtml = view.buildDocument({
    kind: "retroactive",
    session: { role: "teacher", roomId: "room-a", schoolName: "โรงเรียนทดสอบ" },
    students,
    record: {
        ...common,
        id: "retro-1",
        academicYear: "2569",
        semester: "1",
        retroStart: "2026-07-20",
        retroEnd: "2026-07-24",
        days: 5,
        totalBoxes: 10
    }
});
assert.ok(retroactiveHtml.includes("รายงานจ่ายนมย้อนหลัง"));
assert.ok(retroactiveHtml.includes("10 กล่อง"));
assert.ok(retroactiveHtml.includes("นักเรียนสอง"));

const vacationHtml = view.buildDocument({
    kind: "vacation",
    session: { role: "teacher", roomId: "room-a", schoolName: "โรงเรียนทดสอบ" },
    students,
    record: {
        ...common,
        id: "vacation-1",
        academicYear: "2569",
        semester: "1",
        days: 30,
        totalBoxes: 60
    }
});
assert.ok(vacationHtml.includes("รายงานจ่ายนมช่วงปิดเทอม"));
assert.ok(vacationHtml.includes("60 กล่อง"));
assert.ok(vacationHtml.includes("30 วัน"));

const printWindow = {
    html: "",
    printed: false,
    document: {
        write(value) {
            printWindow.html += value;
        },
        close() {}
    },
    focus() {},
    print() {
        printWindow.printed = true;
    }
};
const printingView = new PrintView({
    openWindow: () => printWindow,
    schedule: callback => callback(),
    now: () => "2026-07-30T04:00:00.000Z",
    eventTarget: windowObject
});
printingView.print({
    kind: "vacation",
    session: { role: "teacher", roomId: "room-a", schoolName: "โรงเรียนทดสอบ" },
    students,
    record: {
        ...common,
        id: "vacation-1",
        academicYear: "2569",
        semester: "1",
        days: 30,
        totalBoxes: 60
    }
});
assert.equal(printWindow.printed, true);
assert.ok(printWindow.html.includes("รายงานจ่ายนมช่วงปิดเทอม"));
const printEvent = emitted.find(event => event.type === "milkapp:milk-operation-print-opened");
assert.deepEqual(
    JSON.parse(JSON.stringify(printEvent.detail)),
    {
        kind: "vacation",
        roomId: "room-a",
        recordId: "vacation-1",
        photoCount: 5,
        signatureCount: 1
    }
);
assert.ok(!JSON.stringify(printEvent.detail).includes("data:image"), "Print event must remain metadata-only");

console.log("Milk operation print UI checks passed.");
