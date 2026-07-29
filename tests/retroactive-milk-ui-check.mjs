import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const viewCode = read("modules/retroactive/retroactiveMilkView.js");
const appCode = read("modules/core/app.js");
const parityCode = read("docs/TEACHER_LEGACY_PARITY_CONTRACT.md");

assert.doesNotThrow(() => new vm.Script(viewCode), "retroactiveMilkView.js must contain valid JavaScript");
assert.ok(
    viewCode.includes('panel.id = "retroactive-milk-panel"') || viewCode.includes('id="retroactive-milk-panel"'),
    "RetroactiveMilkView must create the operational panel"
);
assert.ok(viewCode.includes("retroactiveMilkManager.preview"), "Preview must delegate to RetroactiveMilkManager");
assert.ok(viewCode.includes("retroactiveMilkManager.loadHistory"), "History reads must delegate to RetroactiveMilkManager");
assert.ok(viewCode.includes("retroactiveMilkManager.issue"), "Issue commands must delegate to RetroactiveMilkManager");
assert.ok(viewCode.includes("retroactiveMilkManager.remove"), "Delete/rollback commands must delegate to RetroactiveMilkManager");
assert.ok(appCode.includes('import("../retroactive/retroactiveMilkView.js")'), "App must dynamically load RetroactiveMilkView");
assert.ok(appCode.includes("retroactiveMilkView.initialize"), "App must initialize RetroactiveMilkView");
assert.ok(parityCode.includes("visible student roster or printable student detail"), "Parity contract must preserve future roster detail");
assert.ok(parityCode.includes("photo evidence"), "Parity contract must preserve future photo evidence");
assert.ok(parityCode.includes("signature evidence"), "Parity contract must preserve future signature evidence");

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
    assert.ok(!viewCode.includes(forbidden), `RetroactiveMilkView must not contain ${forbidden}`);
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

    closest(selector) {
        return selector === "button[data-retro-delete]" && this.dataset.retroDelete
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
    "pending-milk-panel",
    "retroactive-milk-view-style",
    "retroactive-milk-panel",
    "retroactive-milk-academic-year",
    "retroactive-milk-semester",
    "retroactive-milk-issue-date",
    "retroactive-milk-room",
    "retroactive-milk-start-date",
    "retroactive-milk-end-date",
    "retroactive-milk-student-count",
    "retroactive-milk-day-count",
    "retroactive-milk-box-count",
    "retroactive-milk-debt-count",
    "retroactive-milk-note",
    "retroactive-milk-status",
    "retroactive-milk-error",
    "retroactive-milk-history-button",
    "retroactive-milk-issue-button",
    "retroactive-milk-history"
];
const document = new FakeDocument(ids);
document.getElementById("retroactive-milk-panel").hidden = true;
document.getElementById("retroactive-milk-error").hidden = true;
const eventTarget = new FakeEventTarget();

const teacherSession = {
    role: "teacher",
    roomId: "isolated-retro-room",
    roomName: "ห้องย้อนหลังทดสอบ",
    teacher: "ครูทดสอบ"
};
const preview = {
    roomId: teacherSession.roomId,
    roomName: teacherSession.roomName,
    teacher: teacherSession.teacher,
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-10",
    retroStart: "2026-08-07",
    retroEnd: "2026-08-10",
    students: [
        { id: "s1", name: "นักเรียนหนึ่ง" },
        { id: "s2", name: "นักเรียนสอง" },
        { id: "s3", name: "นักเรียนสาม" }
    ],
    studentCount: 3,
    days: 2,
    totalBoxes: 6,
    debtBoxes: 6,
    mainStockDelta: 0
};
const history = {
    roomId: teacherSession.roomId,
    roomName: teacherSession.roomName,
    records: [
        {
            id: "retro-1",
            roomId: teacherSession.roomId,
            academicYear: "2569",
            semester: "1",
            date: "2026-08-10",
            retroStart: "2026-08-07",
            retroEnd: "2026-08-10",
            days: 2,
            totalBoxes: 6,
            debtBoxes: 6,
            status: "debt"
        }
    ],
    totalBoxes: 6,
    debtBoxes: 6
};

let previewInput = null;
let issueInput = null;
let removeInput = null;
let clearCount = 0;
let historyCount = 0;
const retroactiveMilkManager = {
    preview(input) {
        previewInput = input;
        return { ...preview };
    },
    async loadHistory() {
        historyCount += 1;
        return { ...history, records: history.records.map(record => ({ ...record })) };
    },
    async issue(input) {
        issueInput = input;
        return {
            id: "retro-2",
            quantity: 6,
            roomStockBefore: 100,
            roomStockAfter: 94,
            mainStockDelta: 0
        };
    },
    async remove(input) {
        removeInput = input;
        return {
            id: input.recordId,
            quantity: 6,
            roomStockBefore: 94,
            roomStockAfter: 100,
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
        RetroactiveMilkManager: retroactiveMilkManager,
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
const RetroactiveMilkView = context.window.RetroactiveMilkView.constructor;
const view = new RetroactiveMilkView(
    retroactiveMilkManager,
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
assert.equal(document.getElementById("retroactive-milk-panel").hidden, false, "Teacher session must reveal Retroactive Milk panel");
assert.match(document.getElementById("retroactive-milk-issue-date").value, /^\d{4}-\d{2}-\d{2}$/, "Panel must default to a local issue date");
assert.equal(document.getElementById("retroactive-milk-room").value, teacherSession.roomName, "Room field must show authenticated room");
assert.equal(document.getElementById("retroactive-milk-issue-button").disabled, true, "Issue action must start disabled");

document.getElementById("retroactive-milk-academic-year").value = "2569";
document.getElementById("retroactive-milk-semester").value = "1";
document.getElementById("retroactive-milk-issue-date").value = "2026-08-10";
document.getElementById("retroactive-milk-start-date").value = "2026-08-07";
document.getElementById("retroactive-milk-end-date").value = "2026-08-10";
view.handlePreviewChange();
assert.equal(previewInput.retroStart, "2026-08-07");
assert.equal(previewInput.retroEnd, "2026-08-10");
assert.equal(document.getElementById("retroactive-milk-student-count").textContent, "3", "Student total must render");
assert.equal(document.getElementById("retroactive-milk-day-count").textContent, "2", "Weekday total must render");
assert.equal(document.getElementById("retroactive-milk-box-count").textContent, "6", "Box total must render");
assert.equal(document.getElementById("retroactive-milk-debt-count").textContent, "6", "Debt total must render");
assert.equal(document.getElementById("retroactive-milk-issue-button").disabled, false, "Valid preview must enable issue action");

await view.handleLoadHistory();
assert.equal(historyCount, 1, "History action must call Manager once");
assert.match(document.getElementById("retroactive-milk-history").innerHTML, /2026-08-07/, "History range must render");
assert.match(document.getElementById("retroactive-milk-history").innerHTML, /หนี้นม 6 กล่อง/, "Debt badge must render");
assert.match(document.getElementById("retroactive-milk-history").innerHTML, /ลบและคืนสต็อก/, "History must render rollback action");

document.getElementById("retroactive-milk-note").value = "จ่ายย้อนหลังแบบแยก";
await view.handleIssue();
assert.equal(confirmCount, 1, "Issue must require explicit confirmation");
assert.equal(issueInput.academicYear, "2569");
assert.equal(issueInput.semester, "1");
assert.equal(issueInput.retroStart, "2026-08-07");
assert.equal(issueInput.retroEnd, "2026-08-10");
assert.equal(issueInput.note, "จ่ายย้อนหลังแบบแยก", "Issue must delegate note without stock logic");
assert.equal(refreshCount, 1, "Successful issue must refresh Teacher stock state");
assert.ok(document.getElementById("retroactive-milk-status").textContent.includes("100 → 94"), "Issue result must show Room Stock before and after");
assert.equal(document.getElementById("retroactive-milk-note").value, "", "Successful issue must clear note");
assert.equal(historyCount, 2, "Successful issue must reload room history");

const deleteButton = new FakeElement("", "button");
deleteButton.dataset.retroDelete = "retro-1";
deleteButton.dataset.retroBoxes = "6";
await view.handleDeleteClick({ target: deleteButton });
assert.equal(confirmCount, 2, "Delete must require explicit confirmation");
assert.equal(removeInput.recordId, "retro-1", "Delete must delegate exact record id");
assert.equal(refreshCount, 2, "Successful rollback must refresh Teacher stock state");
assert.ok(document.getElementById("retroactive-milk-status").textContent.includes("94 → 100"), "Delete result must show restored Room Stock");
assert.equal(historyCount, 3, "Successful delete must reload room history");

const queuedDocument = new FakeDocument(ids);
queuedDocument.getElementById("retroactive-milk-panel").hidden = true;
queuedDocument.getElementById("retroactive-milk-error").hidden = true;
const queuedManager = {
    ...retroactiveMilkManager,
    async issue() {
        return { quantity: 6, stockQueued: true, mainStockDelta: 0 };
    }
};
const queuedView = new RetroactiveMilkView(
    queuedManager,
    authService,
    teacherManager,
    { document: queuedDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await queuedView.initialize();
queuedDocument.getElementById("retroactive-milk-academic-year").value = "2569";
queuedDocument.getElementById("retroactive-milk-semester").value = "1";
queuedDocument.getElementById("retroactive-milk-issue-date").value = "2026-08-10";
queuedDocument.getElementById("retroactive-milk-start-date").value = "2026-08-07";
queuedDocument.getElementById("retroactive-milk-end-date").value = "2026-08-10";
queuedView.currentPreview = { ...preview };
await queuedView.handleIssue();
assert.equal(queuedDocument.getElementById("retroactive-milk-status").dataset.state, "warning", "Partial save must render queued warning");
assert.match(queuedDocument.getElementById("retroactive-milk-status").textContent, /เข้าคิว/, "Partial save warning must identify queued work");

eventTarget.dispatch("milkapp:logout");
assert.equal(document.getElementById("retroactive-milk-panel").hidden, true, "Logout must hide Retroactive Milk panel");
assert.ok(clearCount >= 1, "Logout must clear Retroactive Milk Manager state");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("retroactive-milk-panel").hidden = true;
adminDocument.getElementById("retroactive-milk-error").hidden = true;
const adminView = new RetroactiveMilkView(
    retroactiveMilkManager,
    { getSession: () => ({ role: "admin", roomId: "__admin__" }) },
    teacherManager,
    { document: adminDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await adminView.initialize();
assert.equal(adminDocument.getElementById("retroactive-milk-panel").hidden, true, "Admin session must not activate Retroactive Milk panel");

console.log("Retroactive Milk UI checks passed.");
