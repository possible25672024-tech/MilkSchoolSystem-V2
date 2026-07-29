import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const viewCode = read("modules/vacation/vacationMilkView.js");
const appCode = read("modules/core/app.js");
const parityCode = read("docs/TEACHER_LEGACY_PARITY_CONTRACT.md");

assert.doesNotThrow(() => new vm.Script(viewCode), "vacationMilkView.js must contain valid JavaScript");
assert.ok(
    viewCode.includes('panel.id = "vacation-milk-panel"') || viewCode.includes('id="vacation-milk-panel"'),
    "VacationMilkView must create the operational panel"
);
assert.ok(viewCode.includes("vacationMilkManager.preview"), "Preview must delegate to VacationMilkManager");
assert.ok(viewCode.includes("vacationMilkManager.loadHistory"), "History must delegate to VacationMilkManager");
assert.ok(viewCode.includes("vacationMilkManager.issue"), "Issue must delegate to VacationMilkManager");
assert.ok(viewCode.includes("vacationMilkManager.remove"), "Delete must delegate to VacationMilkManager");
assert.ok(viewCode.includes("รายชื่อนักเรียนและจำนวนกล่อง"), "Vacation UI must retain visible student detail");
assert.ok(viewCode.includes("Media & Signature Sprint"), "Vacation UI must retain the media/signature handoff");
assert.ok(appCode.includes('import("../vacation/vacationMilkView.js")'), "App must dynamically load VacationMilkView");
assert.ok(appCode.includes("vacationMilkView.initialize"), "App must initialize VacationMilkView");
assert.ok(parityCode.includes("Vacation Milk photo/signature evidence"), "Parity contract must preserve Vacation media evidence");

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "stockTransactions/",
    "stockLog/",
    "atomicRoomStockDifference",
    "QueueStorage"
]) {
    assert.ok(!viewCode.includes(forbidden), `VacationMilkView must not contain ${forbidden}`);
}

class FakeClassList {
    constructor() {
        this.values = new Set();
    }

    toggle(name, enabled) {
        if (enabled) this.values.add(name);
        else this.values.delete(name);
    }

    contains(name) {
        return this.values.has(name);
    }
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
        this.nextSibling = null;
        this.classList = new FakeClassList();
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

    closest(selector) {
        return selector === "[data-vacation-delete]" && this.dataset.vacationDelete
            ? this
            : null;
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
    "teacher-shell",
    "teacher-logout-button",
    "retroactive-milk-panel",
    "vacation-milk-view-style",
    "vacation-milk-panel",
    "vacation-milk-academic-year",
    "vacation-milk-semester",
    "vacation-milk-issue-date",
    "vacation-milk-room",
    "vacation-milk-days",
    "vacation-milk-student-count",
    "vacation-milk-day-count",
    "vacation-milk-box-count",
    "vacation-milk-stock-card",
    "vacation-milk-room-stock",
    "vacation-milk-students",
    "vacation-milk-note",
    "vacation-milk-status",
    "vacation-milk-error",
    "vacation-milk-history-button",
    "vacation-milk-issue-button",
    "vacation-milk-history"
];
const document = new FakeDocument(ids);
document.getElementById("vacation-milk-panel").hidden = true;
document.getElementById("vacation-milk-error").hidden = true;
const eventTarget = new FakeEventTarget();

const teacherSession = {
    role: "teacher",
    roomId: "isolated-vacation-room",
    roomName: "ห้องปิดเทอมทดสอบ",
    teacher: "ครูทดสอบ"
};
const preview = {
    roomId: teacherSession.roomId,
    roomName: teacherSession.roomName,
    teacher: teacherSession.teacher,
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-10",
    students: [
        { id: "s1", num: "1", name: "นักเรียนหนึ่ง" },
        { id: "s2", num: "2", name: "นักเรียนสอง" },
        { id: "s3", num: "3", name: "นักเรียนสาม" }
    ],
    studentCount: 3,
    days: 30,
    totalBoxes: 90,
    mainStockDelta: 0
};
const history = {
    roomId: teacherSession.roomId,
    roomName: teacherSession.roomName,
    records: [
        {
            id: "vacation-1",
            roomId: teacherSession.roomId,
            academicYear: "2569",
            semester: "1",
            date: "2026-08-10",
            days: 30,
            studentCount: 3,
            totalBoxes: 90,
            photos: []
        }
    ],
    totalBoxes: 90
};

let previewInput = null;
let issueInput = null;
let removeInput = null;
let clearCount = 0;
let historyCount = 0;
const vacationMilkManager = {
    preview(input) {
        previewInput = input;
        return { ...preview, students: preview.students.map(student => ({ ...student })) };
    },
    async loadHistory() {
        historyCount += 1;
        return { ...history, records: history.records.map(record => ({ ...record })) };
    },
    async issue(input) {
        issueInput = input;
        return {
            id: "vacation-2",
            quantity: 90,
            roomStockBefore: 200,
            roomStockAfter: 110,
            mainStockDelta: 0
        };
    },
    async remove(input) {
        removeInput = input;
        return {
            id: input.recordId,
            quantity: 90,
            roomStockBefore: 110,
            roomStockAfter: 200,
            mainStockDelta: 0
        };
    },
    clear() {
        clearCount += 1;
    }
};

let refreshCount = 0;
const teacherManager = {
    async refresh() {
        refreshCount += 1;
        return {};
    },
    getSnapshot() {
        return { roomStock: 200 };
    }
};
const authService = {
    getSession() {
        return teacherSession;
    }
};
let confirmCount = 0;
const context = {
    window: {
        VacationMilkManager: vacationMilkManager,
        AuthService: authService,
        TeacherManager: teacherManager,
        document,
        confirm: () => true
    },
    Date,
    Intl,
    Number,
    String,
    Object,
    Array,
    Set,
    Map,
    Math,
    Error,
    Promise,
    console
};
vm.runInNewContext(viewCode, context);
const VacationMilkView = context.window.VacationMilkView.constructor;
const view = new VacationMilkView(
    vacationMilkManager,
    authService,
    teacherManager,
    {
        document,
        eventTarget,
        confirm: () => {
            confirmCount += 1;
            return true;
        }
    }
);

await view.initialize();
assert.equal(document.getElementById("vacation-milk-panel").hidden, false, "Teacher session must reveal Vacation Milk panel");
assert.match(document.getElementById("vacation-milk-issue-date").value, /^\d{4}-\d{2}-\d{2}$/, "Panel must default to a local issue date");
assert.equal(document.getElementById("vacation-milk-room").value, teacherSession.roomName, "Room field must show authenticated room");
assert.equal(document.getElementById("vacation-milk-days").value, "30", "Vacation day count must default to 30");

assert.equal(document.getElementById("vacation-milk-student-count").textContent, "3", "Student total must render");
assert.equal(document.getElementById("vacation-milk-day-count").textContent, "30", "Day total must render");
assert.equal(document.getElementById("vacation-milk-box-count").textContent, "90", "Box total must render");
assert.equal(document.getElementById("vacation-milk-room-stock").textContent, "200", "Room Stock must render from Teacher snapshot");
assert.match(document.getElementById("vacation-milk-students").innerHTML, /นักเรียนหนึ่ง/, "Visible student roster must render");
assert.match(document.getElementById("vacation-milk-students").innerHTML, /30 กล่อง/, "Per-student quantity must render");
assert.match(document.getElementById("vacation-milk-students").innerHTML, /Media & Signature Sprint/, "Media/signature handoff must render");
assert.equal(document.getElementById("vacation-milk-issue-button").disabled, false, "Valid preview must enable issue action");

await view.handleLoadHistory();
assert.equal(historyCount, 1, "History action must call Manager once");
assert.match(document.getElementById("vacation-milk-history").innerHTML, /ปิดเทอมหลังภาค 1/, "History academic period must render");
assert.match(document.getElementById("vacation-milk-history").innerHTML, /90 กล่อง/, "History quantity must render");
assert.match(document.getElementById("vacation-milk-history").innerHTML, /ลบและคืนสต็อก/, "History must render rollback action");

view.handlePreviewChange();
assert.equal(previewInput.days, "30", "Preview must delegate day input without stock logic");
document.getElementById("vacation-milk-note").value = "จ่ายช่วงปิดเทอมแบบแยก";
await view.handleIssue();
assert.equal(confirmCount, 1, "Issue must require explicit confirmation");
assert.equal(issueInput.academicYear, String(new Date().getFullYear() + 543));
assert.equal(issueInput.semester, "1");
assert.equal(issueInput.days, "30");
assert.equal(issueInput.note, "จ่ายช่วงปิดเทอมแบบแยก", "Issue must delegate note without stock logic");
assert.deepEqual(issueInput.signatures, {}, "View must preserve compatible empty signatures until Media Sprint");
assert.deepEqual(issueInput.photos, [], "View must preserve compatible empty photos until Media Sprint");
assert.equal(refreshCount, 1, "Successful issue must refresh Teacher stock state");
assert.ok(document.getElementById("vacation-milk-status").textContent.includes("200 → 110"), "Issue result must show Room Stock before and after");
assert.equal(historyCount, 2, "Successful issue must reload room history");

const deleteButton = new FakeElement("", "button");
deleteButton.dataset.vacationDelete = "vacation-1";
deleteButton.dataset.quantity = "90";
await view.handleDeleteClick({ target: deleteButton });
assert.equal(confirmCount, 2, "Delete must require explicit confirmation");
assert.equal(removeInput.recordId, "vacation-1", "Delete must delegate exact record id");
assert.equal(refreshCount, 2, "Successful rollback must refresh Teacher stock state");
assert.ok(document.getElementById("vacation-milk-status").textContent.includes("110 → 200"), "Delete result must show restored Room Stock");
assert.equal(historyCount, 3, "Successful delete must reload room history");

const queuedDocument = new FakeDocument(ids);
queuedDocument.getElementById("vacation-milk-panel").hidden = true;
queuedDocument.getElementById("vacation-milk-error").hidden = true;
const queuedManager = {
    ...vacationMilkManager,
    async issue() {
        return { quantity: 90, stockQueued: true, mainStockDelta: 0 };
    }
};
const queuedView = new VacationMilkView(
    queuedManager,
    authService,
    teacherManager,
    { document: queuedDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await queuedView.initialize();
queuedView.currentPreview = { ...preview };
await queuedView.handleIssue();
assert.equal(queuedDocument.getElementById("vacation-milk-status").dataset.state, "warning", "Partial save must render queued warning");
assert.match(queuedDocument.getElementById("vacation-milk-status").textContent, /เข้าคิว/, "Partial save warning must identify queued work");

eventTarget.dispatch("milkapp:logout");
assert.equal(document.getElementById("vacation-milk-panel").hidden, true, "Logout must hide Vacation Milk panel");
assert.ok(clearCount >= 1, "Logout must clear Vacation Milk Manager state");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("vacation-milk-panel").hidden = true;
adminDocument.getElementById("vacation-milk-error").hidden = true;
const adminView = new VacationMilkView(
    vacationMilkManager,
    { getSession: () => ({ role: "admin", roomId: "__admin__" }) },
    teacherManager,
    { document: adminDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await adminView.initialize();
assert.equal(adminDocument.getElementById("vacation-milk-panel").hidden, true, "Admin session must not activate Vacation Milk panel");

console.log("Vacation Milk UI checks passed.");
