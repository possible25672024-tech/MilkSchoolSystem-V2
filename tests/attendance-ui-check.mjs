import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const indexCode = read("index-v2.html");
const viewCode = read("modules/attendance/attendanceView.js");
const appCode = read("modules/core/app.js");

assert.doesNotThrow(() => new vm.Script(viewCode), "attendanceView.js must contain valid JavaScript");
for (const id of [
    "attendance-panel",
    "attendance-date",
    "attendance-load-button",
    "attendance-student-list",
    "attendance-total-students",
    "attendance-total-checked",
    "attendance-total-present",
    "attendance-total-absent",
    "attendance-total-unchecked",
    "attendance-save-button",
    "attendance-delete-button",
    "attendance-status",
    "attendance-error"
]) {
    assert.ok(indexCode.includes(`id="${id}"`), `V2 shell must contain ${id}`);
}
assert.ok(indexCode.includes("Sprint 4.2 Teacher Daily Attendance CRUD UI"), "V2 shell must identify Sprint 4.2");
assert.ok(
    indexCode.indexOf("modules/attendance/attendanceManager.js") < indexCode.indexOf("modules/attendance/attendanceView.js"),
    "AttendanceManager must load before AttendanceView"
);
assert.ok(
    indexCode.indexOf("modules/teacher/teacherView.js") < indexCode.indexOf("modules/attendance/attendanceView.js"),
    "TeacherView must load before AttendanceView"
);
assert.ok(
    indexCode.indexOf("modules/attendance/attendanceView.js") < indexCode.indexOf("modules/core/app.js"),
    "AttendanceView must load before App"
);
assert.ok(appCode.includes("attendanceView.initialize"), "App must initialize AttendanceView after TeacherView");

assert.ok(!viewCode.includes("FirebaseService"), "AttendanceView must not access Firebase directly");
assert.ok(!viewCode.includes("Repository"), "AttendanceView must not access repositories directly");
assert.ok(!viewCode.includes("fetch("), "AttendanceView must not fetch directly");
assert.ok(!viewCode.includes("localStorage"), "AttendanceView must not own persistent queue storage");
assert.ok(!viewCode.includes("sessionStorage"), "AttendanceView must not own session persistence");
assert.ok(!viewCode.includes("roomStockDelta"), "AttendanceView must not calculate Room Stock differences");
assert.ok(!viewCode.includes("mainStockDelta"), "AttendanceView must not mutate Main Stock");
assert.ok(!viewCode.includes("stockTransactions"), "AttendanceView must not construct ledger records");
assert.ok(!viewCode.includes("stockLog"), "AttendanceView must not construct stock-log records");

class FakeElement {
    constructor(tagName = "div", id = "") {
        this.tagName = tagName;
        this.id = id;
        this.textContent = "";
        this.value = "";
        this.checked = false;
        this.disabled = false;
        this.hidden = false;
        this.type = "";
        this.name = "";
        this.className = "";
        this.placeholder = "";
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.children = [];
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

    dispatch(name, detail = null) {
        const event = {
            type: name,
            detail,
            target: this,
            preventDefault() {}
        };
        for (const listener of this.listeners.get(name) || []) {
            listener(event);
        }
    }

    append(...children) {
        this.children.push(...children.filter(Boolean));
    }

    replaceChildren(...children) {
        this.children = [...children];
        this.textContent = "";
    }
}

class FakeTextNode extends FakeElement {
    constructor(text) {
        super("#text");
        this.textContent = String(text);
    }
}

class FakeDocument {
    constructor(ids) {
        this.elements = new Map(ids.map(id => [id, new FakeElement("div", id)]));
    }

    getElementById(id) {
        return this.elements.get(id) || null;
    }

    createElement(tagName) {
        return new FakeElement(tagName);
    }

    createTextNode(text) {
        return new FakeTextNode(text);
    }
}

class FakeEventTarget {
    constructor() {
        this.listeners = new Map();
    }

    addEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }

    dispatch(name, detail = null) {
        for (const listener of this.listeners.get(name) || []) {
            listener({ type: name, detail });
        }
    }
}

const ids = [
    "attendance-panel",
    "attendance-date",
    "attendance-load-button",
    "attendance-form",
    "attendance-student-list",
    "attendance-total-students",
    "attendance-total-checked",
    "attendance-total-present",
    "attendance-total-absent",
    "attendance-total-unchecked",
    "attendance-save-button",
    "attendance-delete-button",
    "attendance-status",
    "attendance-error"
];
const document = new FakeDocument(ids);
document.getElementById("attendance-panel").hidden = true;
const eventTarget = new FakeEventTarget();
const teacherSession = {
    role: "teacher",
    roomId: "r1",
    classId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ",
    schoolName: "โรงเรียนทดสอบ"
};
const snapshot = {
    settings: { year: "2569", term: "1" },
    session: { ...teacherSession },
    room: {
        id: "r1",
        name: "อ.3-1",
        teacher: "ครูทดสอบ",
        students: [
            { id: "s1", num: "1", name: "เด็กชายหนึ่ง", gender: "ชาย" },
            { id: "s2", num: "2", name: "เด็กหญิงสอง", gender: "หญิง" }
        ]
    },
    students: [
        { id: "s1", num: "1", name: "เด็กชายหนึ่ง", gender: "ชาย" },
        { id: "s2", num: "2", name: "เด็กหญิงสอง", gender: "หญิง" }
    ],
    roomStock: -2
};

let loadedRecord = {
    clsId: "r1",
    roomName: "อ.3-1",
    date: "2026-07-28",
    year: "2569",
    term: "1",
    teacher: "ครูทดสอบ",
    data: { s1: "present", s2: "absent" },
    notes: { s2: "ลาป่วย" },
    photos: ["existing-photo"],
    signature: "existing-signature",
    savedAt: "2026-07-28T01:00:00.000Z"
};
let loadDate = "";
let savedInput = null;
let removedInput = null;
const attendanceManager = {
    async loadDay(date) {
        loadDate = date;
        return loadedRecord;
    },
    async save(input) {
        savedInput = input;
        return {
            key: `r1_${input.date}`,
            record: { ...input },
            present: Object.values(input.data).filter(status => status === "present").length,
            absent: Object.values(input.data).filter(status => status === "absent").length,
            roomStockBefore: 10,
            roomStockAfter: 8,
            stockConflictCount: 1,
            mainStockDelta: 0
        };
    },
    async remove(input) {
        removedInput = input;
        return {
            key: `r1_${input.date}`,
            restoredQuantity: 2,
            roomStockBefore: 8,
            roomStockAfter: 10,
            stockConflictCount: 0,
            mainStockDelta: 0
        };
    }
};
let teacherRefreshCount = 0;
const teacherManager = {
    getSnapshot() {
        return snapshot;
    },
    async refresh() {
        teacherRefreshCount += 1;
        return { snapshot, dashboard: { actualRoomStock: snapshot.roomStock } };
    }
};
const authService = {
    getSession() {
        return teacherSession;
    }
};
const syncManager = {
    getStatus() {
        return { queueCount: 0 };
    }
};
let confirmCount = 0;

const context = {
    window: {
        AttendanceManager: attendanceManager,
        TeacherManager: teacherManager,
        AuthService: authService,
        SyncManager: syncManager,
        document
    },
    Intl,
    Date,
    Number,
    String,
    Object,
    Array,
    Map,
    Math,
    Error,
    console
};
vm.runInNewContext(viewCode, context);
const AttendanceView = context.window.AttendanceView.constructor;
const view = new AttendanceView(
    attendanceManager,
    teacherManager,
    authService,
    syncManager,
    {
        document,
        eventTarget,
        today: () => "2026-07-28",
        confirm: () => {
            confirmCount += 1;
            return true;
        }
    }
);

await view.initialize();
assert.equal(document.getElementById("attendance-panel").hidden, false, "Teacher session must reveal Attendance panel");
assert.equal(document.getElementById("attendance-date").value, "2026-07-28", "Attendance form must default to local current date");
assert.equal(view.rows.size, 2, "Attendance form must render authenticated-room students only");
assert.equal(document.getElementById("attendance-total-students").textContent, "2", "Total students must display");
assert.equal(document.getElementById("attendance-total-unchecked").textContent, "2", "New form must show all students unchecked");

await view.loadSelectedDay();
assert.equal(loadDate, "2026-07-28", "Attendance load must remain date-scoped");
assert.equal(view.rows.get("s1").present.checked, true, "Existing present status must load");
assert.equal(view.rows.get("s2").absent.checked, true, "Existing absent status must load");
assert.equal(view.rows.get("s2").note.value, "ลาป่วย", "Existing per-student notes must load");
assert.equal(document.getElementById("attendance-total-present").textContent, "1", "Present total must update from loaded record");
assert.equal(document.getElementById("attendance-total-absent").textContent, "1", "Absent total must update from loaded record");

view.rows.get("s2").absent.checked = false;
view.rows.get("s2").present.checked = true;
view.rows.get("s2").note.value = "กลับมาเรียน";
view.renderTotals();
assert.equal(document.getElementById("attendance-total-present").textContent, "2", "Edited present total must update without stock calculation");
assert.equal(document.getElementById("attendance-total-unchecked").textContent, "0", "Checked total must track form state");

await view.saveCurrentDay();
assert.equal(savedInput.roomId, "r1", "Save must remain in the authenticated room");
assert.equal(savedInput.data.s1, "present", "Save must delegate first student status");
assert.equal(savedInput.data.s2, "present", "Save must delegate edited second student status");
assert.equal(savedInput.notes.s2, "กลับมาเรียน", "Save must delegate edited notes");
assert.deepEqual(savedInput.photos, ["existing-photo"], "Edit must preserve existing photos");
assert.equal(savedInput.signature, "existing-signature", "Edit must preserve existing signature");
assert.equal(savedInput.savedAt, "2026-07-28T01:00:00.000Z", "Edit must preserve compatible savedAt value");
assert.equal(teacherRefreshCount, 1, "Successful save must refresh the read-only Teacher state");
assert.ok(document.getElementById("attendance-status").textContent.includes("10 → 8"), "Save result must display Room Stock before and after");
assert.ok(document.getElementById("attendance-status").textContent.includes("แก้ความขัดแย้ง 1 ครั้ง"), "Save result must display reported retry conflicts");

await view.deleteCurrentDay();
assert.equal(confirmCount, 1, "Delete must require explicit confirmation");
assert.equal(removedInput.roomId, "r1", "Delete must remain in the authenticated room");
assert.equal(removedInput.date, "2026-07-28", "Delete must remain date-scoped");
assert.equal(teacherRefreshCount, 2, "Successful delete must refresh the read-only Teacher state");
assert.ok(document.getElementById("attendance-status").textContent.includes("คืน 2 กล่อง"), "Delete result must display restored quantity");

loadedRecord = { ...loadedRecord, data: { s1: "present" } };
eventTarget.dispatch("milkapp:attendance-stock-queued", {
    record: loadedRecord,
    stockQueued: true,
    attendanceSaved: true
});
assert.ok(document.getElementById("attendance-status").textContent.includes("รอซิงก์"), "Partial save must show persistent queue feedback");

const stateBeforeLogout = view.getState();
assert.equal(stateBeforeLogout.active, true, "Teacher Attendance View must report active state");
assert.equal(stateBeforeLogout.studentCount, 2, "Teacher Attendance View state must report room students");
eventTarget.dispatch("milkapp:logout");
assert.equal(document.getElementById("attendance-panel").hidden, true, "Logout must hide the Attendance panel");
assert.equal(view.rows.size, 0, "Logout must clear Attendance form rows");
assert.equal(document.getElementById("attendance-total-students").textContent, "0", "Logout must clear totals");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("attendance-panel").hidden = true;
const adminView = new AttendanceView(
    attendanceManager,
    teacherManager,
    { getSession: () => ({ role: "admin", roomId: "__admin__" }) },
    syncManager,
    { document: adminDocument, eventTarget: new FakeEventTarget(), today: () => "2026-07-28", confirm: () => true }
);
await adminView.initialize();
assert.equal(adminDocument.getElementById("attendance-panel").hidden, true, "Admin session must not render the Attendance form");
assert.equal(adminView.getState().active, false, "Admin session must not activate AttendanceView");

console.log("Attendance UI checks passed.");
