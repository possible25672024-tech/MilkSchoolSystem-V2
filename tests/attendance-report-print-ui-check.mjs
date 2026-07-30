import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const viewCode = read("modules/reports/attendancePrintView.js");
const appCode = read("modules/core/app.js");

assert.doesNotThrow(
    () => new vm.Script(viewCode),
    "attendancePrintView.js must contain valid JavaScript"
);
assert.ok(
    viewCode.includes('panel.id = "attendance-report-panel"') ||
    viewCode.includes('id="attendance-report-panel"'),
    "AttendancePrintView must create the operational report panel"
);
assert.ok(
    appCode.includes('import("../reports/attendancePrintView.js")'),
    "App must dynamically load AttendancePrintView"
);
assert.ok(
    appCode.includes("attendancePrintView.initialize"),
    "App must initialize AttendancePrintView"
);
for (const milkLabel of ["ดื่มนม", "ไม่ดื่มนม", "อัตราดื่มนม"]) {
    assert.ok(viewCode.includes(milkLabel), `Attendance report UI must include ${milkLabel}`);
}
for (const legacyLabel of ["มาเรียน", "ขาดเรียน", "อัตรามาเรียน"]) {
    assert.ok(!viewCode.includes(legacyLabel), `Attendance report UI must not display ${legacyLabel}`);
}

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "XMLHttpRequest",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "roomStock",
    "mainStock",
    "stockTransactions/",
    "stockLog/",
    "tc_pending_saves_v1"
]) {
    assert.ok(!viewCode.includes(forbidden), `AttendancePrintView must not own ${forbidden}`);
}

class FakeElement {
    constructor(id = "", tagName = "div") {
        this.id = id;
        this.tagName = tagName;
        this.textContent = "";
        this.value = "";
        this.disabled = false;
        this.hidden = false;
        this.innerHTML = "";
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.children = [];
        this.parentElement = null;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === "hidden") {
            this.hidden = true;
        }
    }

    removeAttribute(name) {
        this.attributes.delete(name);
        if (name === "hidden") {
            this.hidden = false;
        }
    }

    addEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }

    appendChild(child) {
        if (child) {
            child.parentElement = this;
            this.children.push(child);
        }
        return child;
    }

    insertBefore(child) {
        return this.appendChild(child);
    }
}

class FakeDocument {
    constructor(ids) {
        this.elements = new Map(ids.map(id => [id, new FakeElement(id)]));
        this.head = new FakeElement("head", "head");
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    createElement(tagName) {
        return new FakeElement("", tagName);
    }
}

class FakeEventTarget {
    constructor() {
        this.listeners = new Map();
        this.dispatched = [];
    }

    addEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }

    dispatchEvent(event) {
        this.dispatched.push(event);
        for (const listener of this.listeners.get(event.type) || []) {
            listener(event);
        }
        return true;
    }

    dispatch(name, detail = null) {
        this.dispatchEvent({ type: name, detail });
    }
}

class FakeCustomEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
}

const ids = [
    "teacher-shell",
    "teacher-logout-button",
    "attendance-report-view-style",
    "attendance-report-panel",
    "attendance-report-start-date",
    "attendance-report-end-date",
    "attendance-report-load-button",
    "attendance-report-identity",
    "attendance-report-school-days",
    "attendance-report-students",
    "attendance-report-present",
    "attendance-report-absent",
    "attendance-report-unchecked",
    "attendance-report-status",
    "attendance-report-error",
    "attendance-report-daily",
    "attendance-report-student-list",
    "attendance-report-print-button"
];
const document = new FakeDocument(ids);
document.getElementById("attendance-report-panel").hidden = true;
document.getElementById("attendance-report-error").hidden = true;
document.getElementById("attendance-report-print-button").disabled = true;
const eventTarget = new FakeEventTarget();

const session = {
    role: "teacher",
    roomId: "room-isolated",
    roomName: "อ.2-1 ห้องทดสอบ",
    teacher: "ครูทดสอบ",
    schoolName: "โรงเรียนทดสอบ"
};
const history = {
    roomId: session.roomId,
    roomName: session.roomName,
    teacher: session.teacher,
    startDate: "2026-07-01",
    endDate: "2026-07-02",
    requestedDays: 2,
    recordCount: 1,
    records: [{
        key: "room-isolated_2026-07-01",
        clsId: session.roomId,
        roomName: session.roomName,
        date: "2026-07-01",
        year: 2569,
        term: 1,
        teacher: session.teacher,
        data: { s1: "present", s2: "absent" },
        notes: {},
        evidence: { loaded: false, photoCount: null, hasSignature: null }
    }]
};
const reportPhoto = "data:image/jpeg;base64,cmVwb3J0LXBob3Rv";
const reportSignature = "data:image/png;base64,cmVwb3J0LXNpZ25hdHVyZQ==";
const hydratedHistory = {
    ...history,
    records: history.records.map(record => ({
        ...record,
        photos: [reportPhoto],
        signature: reportSignature,
        evidence: { loaded: true, photoCount: 1, hasSignature: true }
    }))
};
const report = {
    metadata: {
        schoolName: session.schoolName,
        roomId: session.roomId,
        roomName: session.roomName,
        teacher: session.teacher,
        startDate: history.startDate,
        endDate: history.endDate,
        year: 2569,
        term: 1
    },
    totals: {
        schoolDays: 1,
        students: 2,
        present: 1,
        absent: 1,
        unchecked: 0
    },
    daily: [{
        date: "2026-07-01",
        present: 1,
        absent: 1,
        unchecked: 0,
        totalStudents: 2
    }],
    students: [
        { id: "s1", num: "1", name: "นักเรียนหนึ่ง", present: 1, absent: 0, unchecked: 0, attendanceRate: 100 },
        { id: "s2", num: "2", name: "นักเรียนสอง", present: 0, absent: 1, unchecked: 0, attendanceRate: 0 }
    ],
    source: {
        recordCount: 1,
        evidenceHydrated: false
    }
};
const printData = {
    title: "รายงานการเช็กดื่มนมรายวัน",
    totals: report.totals,
    pages: [{
        pageBreakAfter: false,
        title: "รายงานการเช็กดื่มนมรายวัน",
        header: {
            schoolName: session.schoolName,
            roomName: session.roomName,
            teacher: session.teacher,
            academicLabel: "ปีการศึกษา 2569 ภาคเรียนที่ 1",
            rangeLabel: "01/07/2026 ถึง 02/07/2026"
        },
        columns: [
            { key: "rowNumber", label: "ลำดับ" },
            { key: "name", label: "ชื่อ-นามสกุล" },
            { key: "present", label: "ดื่มนม" }
        ],
        rows: [{ rowNumber: 1, name: "นักเรียนหนึ่ง", present: 1 }],
        footer: {
            printedAtLabel: "2026-07-30 08:00",
            pageLabel: "หน้า 1 / 1"
        }
    }]
};

let loadInput = null;
let clearCount = 0;
let buildInput = null;
let buildContext = null;
let printInput = null;
let printOptions = null;
let removeInput = null;
const historyManager = {
    async load(input) {
        loadInput = input;
        return history;
    },
    async hydrateCurrentEvidence() {
        return hydratedHistory;
    },
    clear() {
        clearCount += 1;
    }
};
const reportBuilder = {
    build(input, context) {
        buildInput = input;
        buildContext = context;
        return report;
    }
};
const printModel = {
    build(input, options) {
        printInput = input;
        printOptions = options;
        return printData;
    }
};
const authService = {
    getSession() {
        return session;
    }
};
const teacherManager = {
    getSnapshot() {
        return {
            session,
            settings: { schoolName: session.schoolName },
            room: {
                id: session.roomId,
                name: session.roomName,
                teacher: session.teacher,
                students: [
                    { id: "s1", num: "1", name: "นักเรียนหนึ่ง" },
                    { id: "s2", num: "2", name: "นักเรียนสอง" }
                ]
            },
            students: [
                { id: "s1", num: "1", name: "นักเรียนหนึ่ง" },
                { id: "s2", num: "2", name: "นักเรียนสอง" }
            ]
        };
    }
};
const attendanceManager = {
    async remove(input) {
        removeInput = input;
        return { key: `${input.roomId}_${input.date}` };
    }
};
const printWindow = {
    html: "",
    focused: false,
    printed: false,
    document: {
        write(value) {
            printWindow.html += value;
        },
        close() {}
    },
    focus() {
        this.focused = true;
    },
    print() {
        this.printed = true;
    }
};
const windowObject = {
    document,
    AttendanceHistoryManager: historyManager,
    AttendanceReportBuilder: reportBuilder,
    AttendancePrintModel: printModel,
    AttendanceManager: attendanceManager,
    AuthService: authService,
    TeacherManager: teacherManager,
    open() {
        return printWindow;
    },
    setTimeout(callback) {
        callback();
    }
};
windowObject.window = windowObject;
const context = vm.createContext({
    window: windowObject,
    document,
    console,
    Date,
    Intl,
    Number,
    String,
    Object,
    Array,
    Map,
    Set,
    Error,
    CustomEvent: FakeCustomEvent
});
vm.runInContext(viewCode, context, { filename: "attendancePrintView.js" });

const AttendancePrintView = windowObject.AttendancePrintViewClass;
const view = new AttendancePrintView(
    historyManager,
    reportBuilder,
    printModel,
    authService,
    teacherManager,
    {
        document,
        eventTarget,
        openWindow: () => printWindow,
        schedule: callback => callback(),
        now: () => "2026-07-30T01:00:00.000Z",
        attendanceManager,
        confirm: () => true
    }
);

await view.initialize();
assert.equal(view.getState().active, true, "Teacher session must activate the report UI");
assert.equal(document.getElementById("attendance-report-panel").hidden, false);
assert.equal(
    document.getElementById("attendance-report-identity").textContent,
    "โรงเรียนทดสอบ · ห้อง อ.2-1 ห้องทดสอบ · ครูทดสอบ"
);

document.getElementById("attendance-report-start-date").value = "2026-07-01";
document.getElementById("attendance-report-end-date").value = "2026-07-02";
await view.handleLoad();

assert.deepEqual(plain(loadInput), {
    startDate: "2026-07-01",
    endDate: "2026-07-02"
});
assert.equal(buildInput, history);
assert.equal(buildContext.roomId, session.roomId);
assert.equal(buildContext.students.length, 2);
assert.equal(view.getState().loaded, true);
assert.equal(document.getElementById("attendance-report-school-days").textContent, "1");
assert.equal(document.getElementById("attendance-report-present").textContent, "1");
assert.equal(document.getElementById("attendance-report-absent").textContent, "1");
assert.ok(
    document.getElementById("attendance-report-daily").innerHTML.includes("01/07/2569"),
    "Daily table must render the selected Attendance date"
);
assert.ok(
    document.getElementById("attendance-report-daily").innerHTML.includes("✏️ แก้ไข") &&
    document.getElementById("attendance-report-daily").innerHTML.includes("🗑️ ลบ"),
    "Daily history must expose Edit and Delete actions"
);
assert.ok(
    document.getElementById("attendance-report-student-list").innerHTML.includes("นักเรียนหนึ่ง"),
    "Student summary must render visible student detail"
);
assert.equal(document.getElementById("attendance-report-print-button").disabled, false);

await view.handleDailyAction({
    target: {
        closest() {
            return {
                dataset: {
                    attendanceHistoryAction: "edit",
                    date: "2026-07-01"
                }
            };
        }
    }
});
const editEvent = eventTarget.dispatched.find(event => event.type === "milkapp:attendance-history-edit-requested");
assert.deepEqual(plain(editEvent.detail), {
    roomId: session.roomId,
    date: "2026-07-01"
});

await view.handleDailyAction({
    target: {
        closest() {
            return {
                dataset: {
                    attendanceHistoryAction: "delete",
                    date: "2026-07-01"
                }
            };
        }
    }
});
assert.deepEqual(plain(removeInput), {
    roomId: session.roomId,
    date: "2026-07-01"
});

await view.handlePrint();
assert.equal(printInput, report, "Printing must reuse the already-built report");
assert.deepEqual(plain(printOptions), { printedAt: "2026-07-30T01:00:00.000Z" });
assert.equal(printWindow.focused, true);
assert.equal(printWindow.printed, true);
assert.ok(printWindow.html.includes("รายงานการเช็กดื่มนมรายวัน"));
assert.ok(printWindow.html.includes("นักเรียนหนึ่ง"));
assert.ok(printWindow.html.includes(reportPhoto), "Print output must include explicitly hydrated daily photos");
assert.ok(printWindow.html.includes(reportSignature), "Print output must include the Teacher signature");
assert.ok(printWindow.html.includes("ครูประจำชั้น"), "Print output must label the Teacher signature");

const builtEvent = eventTarget.dispatched.find(event => event.type === "milkapp:attendance-report-built");
const printEvent = eventTarget.dispatched.find(event => event.type === "milkapp:attendance-print-opened");
assert.ok(builtEvent, "Report build event must be emitted");
assert.deepEqual(plain(builtEvent.detail), {
    roomId: session.roomId,
    startDate: "2026-07-01",
    endDate: "2026-07-02",
    recordCount: 1,
    studentCount: 2
});
assert.ok(printEvent, "Print-opened event must be emitted");
assert.equal(printEvent.detail.pageCount, 1);
assert.equal(printEvent.detail.evidenceRecordCount, 1);
assert.ok(!JSON.stringify(eventTarget.dispatched).includes("นักเรียนหนึ่ง"), "Events must remain metadata-only");

eventTarget.dispatch("milkapp:logout");
assert.equal(view.getState().active, false);
assert.equal(view.getState().loaded, false);
assert.equal(document.getElementById("attendance-report-panel").hidden, true);
assert.ok(clearCount >= 1, "Logout must clear Attendance history state");

console.log("Attendance report and A4 print UI checks passed.");
