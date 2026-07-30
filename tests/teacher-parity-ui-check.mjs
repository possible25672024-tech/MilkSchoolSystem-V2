import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const viewCode = read("modules/teacher/teacherParityView.js");
const appCode = read("modules/core/app.js");

assert.doesNotThrow(() => new vm.Script(viewCode));
for (const label of [
    "ภาพรวมการดื่มนม",
    "เช็กดื่มนมรายวัน",
    "ประวัติการเช็ก",
    "สรุปรายงาน",
    "พิมพ์รายงาน A4",
    "นมค้างรายสัปดาห์",
    "จ่ายนมย้อนหลัง",
    "จ่ายนมช่วงปิดเทอม",
    "รายงานนักเรียน",
    "สต็อกนมคงเหลือ",
    "ตั้งค่า",
    "ออกจากระบบ"
]) {
    assert.ok(viewCode.includes(label), `Teacher navigation must include ${label}`);
}
for (const layoutRule of [
    "เมนูหน้าครู",
    "@media(min-width:1101px)",
    "grid-template-columns:minmax(0,1fr) 230px",
    ".teacher-parity-nav{grid-column:2",
    ".teacher-parity-nav-list{display:grid"
]) {
    assert.ok(viewCode.includes(layoutRule), `Desktop right navigation must include ${layoutRule}`);
}
for (const milkLabel of ["ดื่มนมวันนี้", "ไม่ดื่มนมวันนี้", "ดื่มนม", "ไม่ดื่มนม", "อัตราดื่มนม"]) {
    assert.ok(viewCode.includes(milkLabel), `Teacher parity UI must include ${milkLabel}`);
}
for (const legacyLabel of ["มาเรียน", "ขาดเรียน", "อัตรามาเรียน"]) {
    assert.ok(!viewCode.includes(legacyLabel), `Teacher parity UI must not display ${legacyLabel}`);
}
for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "XMLHttpRequest",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "mainStock",
    "roomStockDelta",
    "stockLog"
]) {
    assert.ok(!viewCode.includes(forbidden), `TeacherParityView must not own ${forbidden}`);
}
assert.ok(appCode.includes('import("../services/teacherParityService.js")'));
assert.ok(appCode.includes('import("../storage/teacherPreferenceStore.js")'));
assert.ok(appCode.includes('import("../teacher/teacherParityManager.js")'));
assert.ok(appCode.includes('import("../teacher/teacherParityView.js")'));
assert.ok(appCode.includes("teacherParityView.initialize"));

class FakeElement {
    constructor(id = "") {
        this.id = id;
        this.hidden = false;
        this.textContent = "";
        this.value = "";
        this.checked = false;
        this.disabled = false;
        this.dataset = {};
        this.innerHTML = "";
        this.attributes = new Map();
        this.listeners = new Map();
        this.parentElement = null;
        this.classList = { toggle() {} };
    }
    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === "hidden") this.hidden = true;
    }
    removeAttribute(name) {
        this.attributes.delete(name);
        if (name === "hidden") this.hidden = false;
    }
    addEventListener(name, listener) {
        this.listeners.set(name, listener);
    }
    querySelectorAll() {
        return [];
    }
    scrollIntoView() {}
}
class FakeDocument {
    constructor(ids) {
        this.elements = new Map(ids.map(id => [id, new FakeElement(id)]));
        this.head = { appendChild() {} };
    }
    getElementById(id) {
        return this.elements.get(id) || null;
    }
    createElement() {
        return new FakeElement();
    }
}
const ids = [
    "teacher-parity-view-style",
    "teacher-shell",
    "teacher-parity-nav",
    "teacher-overview-panel",
    "attendance-panel",
    "attendance-report-panel",
    "sync-panel",
    "pending-milk-panel",
    "retroactive-milk-panel",
    "vacation-milk-panel",
    "student-report-panel",
    "room-stock-detail-panel",
    "teacher-settings-panel",
    "teacher-overview-students",
    "teacher-overview-present",
    "teacher-overview-absent",
    "teacher-overview-room-stock",
    "teacher-overview-status",
    "student-report-student",
    "student-report-start-date",
    "student-report-end-date",
    "student-report-load-button",
    "student-report-print-button",
    "student-report-identity",
    "student-report-days",
    "student-report-present",
    "student-report-absent",
    "student-report-rate",
    "student-report-status",
    "student-report-error",
    "student-report-timeline",
    "room-stock-detail-room",
    "room-stock-detail-balance",
    "room-stock-detail-updated",
    "room-stock-detail-status",
    "room-stock-detail-error",
    "room-stock-detail-refresh",
    "teacher-settings-report-days",
    "teacher-settings-compact",
    "teacher-settings-remember",
    "teacher-settings-status",
    "teacher-settings-error",
    "teacher-settings-save"
];
const document = new FakeDocument(ids);
const session = { role: "teacher", roomId: "room-a", roomName: "อ.3-6" };
const snapshot = {
    session,
    room: { id: "room-a", name: "อ.3-6" },
    students: [{ id: "s1", num: "1", name: "นักเรียนหนึ่ง" }],
    roomStock: 12,
    attendance: {}
};
const report = {
    metadata: {
        schoolName: "โรงเรียนทดสอบ",
        roomId: "room-a",
        roomName: "อ.3-6",
        teacher: "ครูทดสอบ",
        studentId: "s1",
        studentNumber: "1",
        studentName: "นักเรียนหนึ่ง",
        startDate: "2026-07-01",
        endDate: "2026-07-02"
    },
    totals: { schoolDays: 2, present: 1, absent: 1, unchecked: 0, attendanceRate: 50 },
    timeline: [
        { date: "2026-07-01", status: "present", note: "" },
        { date: "2026-07-02", status: "absent", note: "ลา" }
    ],
    source: { recordCount: 2, evidenceHydrated: false, readOnly: true }
};
const manager = {
    parityService: {
        defaultRange() {
            return { startDate: "2026-07-01", endDate: "2026-07-30", days: 30 };
        },
        buildRoomStock() {
            return { roomName: "อ.3-6", balance: 12, updatedAt: "", readOnly: true };
        }
    },
    getOverview() {
        return { students: 1, present: 0, absent: 0, roomStock: 12, date: "" };
    },
    getPreferences() {
        return { defaultReportDays: 30, compactMode: false, rememberLastSection: true, lastSection: "overview" };
    },
    rememberSection() {},
    async loadStudentReport() {
        return report;
    },
    async refreshRoomStock() {
        return { roomName: "อ.3-6", balance: 12, updatedAt: "", readOnly: true };
    },
    savePreferences(value) {
        return value;
    },
    logout() {},
    clear() {}
};
const teacherManager = { getSnapshot: () => snapshot };
const authService = { getSession: () => session };
const eventTarget = { addEventListener() {} };
const printWindow = {
    html: "",
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
const windowObject = {
    document,
    TeacherParityManager: manager,
    TeacherManager: teacherManager,
    AuthService: authService,
    open: () => printWindow,
    setTimeout: callback => callback()
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
    Error
});
vm.runInContext(viewCode, context, { filename: "teacherParityView.js" });
const View = windowObject.TeacherParityViewClass;
const view = new View(manager, teacherManager, authService, {
    document,
    eventTarget,
    openWindow: () => printWindow,
    schedule: callback => callback(),
    now: () => "2026-07-30T01:00:00.000Z"
});
await view.initialize();
assert.equal(view.getState().active, true);
view.showSection("student-report", false);
assert.equal(document.getElementById("student-report-panel").hidden, false);
assert.equal(document.getElementById("attendance-panel").hidden, true);
await view.handleStudentReportLoad();
assert.equal(view.getState().studentReportLoaded, true);
assert.ok(document.getElementById("student-report-timeline").innerHTML.includes("ไม่ดื่มนม"));
view.handleStudentReportPrint();
assert.ok(printWindow.html.includes("รายงานนักเรียน"));
assert.ok(printWindow.html.includes("นักเรียนหนึ่ง"));
assert.ok(printWindow.html.includes("ดื่มนม 1"));
assert.ok(printWindow.html.includes("ไม่ดื่มนม 1"));
assert.ok(!printWindow.html.includes("มาเรียน"));
assert.ok(!printWindow.html.includes("ขาดเรียน"));
assert.ok(!printWindow.html.includes("data:image"));
assert.equal(printWindow.printed, true);

console.log("Teacher parity UI checks passed.");
