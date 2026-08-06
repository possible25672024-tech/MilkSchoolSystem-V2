import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const viewCode = read("modules/pending/pendingMilkView.js");
const appCode = read("modules/core/app.js");

assert.doesNotThrow(() => new vm.Script(viewCode), "pendingMilkView.js must contain valid JavaScript");
assert.ok(
    viewCode.includes('panel.id = "pending-milk-panel"') || viewCode.includes('id="pending-milk-panel"'),
    "PendingMilkView must create the operational panel"
);
assert.ok(viewCode.includes("pendingMilkManager.loadWeek"), "Week loading must delegate to PendingMilkManager");
assert.ok(viewCode.includes("pendingMilkManager.issue"), "Issue commands must delegate to PendingMilkManager");
assert.ok(viewCode.includes("pendingMilkManager.remove"), "Delete/rollback commands must delegate to PendingMilkManager");
assert.ok(appCode.includes('import("../pending/pendingMilkView.js")'), "App must dynamically load PendingMilkView");
assert.ok(appCode.includes("pendingMilkView.initialize"), "App must initialize PendingMilkView");
assert.ok(viewCode.includes("นักเรียนที่ไม่ดื่มนม"), "Pending list must use milk-consumption wording");
assert.ok(viewCode.includes("ไม่ดื่มนม · 1 กล่อง"), "Pending rows must identify unconsumed milk");
assert.ok(!viewCode.includes("ขาดเรียน"), "Pending UI must not display attendance-absence wording");

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "stockTransactions/",
    "stockLog/",
    "atomicRoomStockDifference"
]) {
    assert.ok(!viewCode.includes(forbidden), `PendingMilkView must not contain ${forbidden}`);
}

class FakeElement {
    constructor(id = "", tagName = "div") {
        this.id = id;
        this.tagName = tagName;
        this.textContent = "";
        this.value = "";
        this.checked = false;
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

    matches(selector) {
        return selector === "input[data-pending-key]" && Boolean(this.dataset.pendingKey);
    }

    closest(selector) {
        return selector === "button[data-pending-delete]" && this.dataset.pendingDelete
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
    "pending-milk-view-style",
    "pending-milk-panel",
    "pending-milk-week-date",
    "pending-milk-load-button",
    "pending-milk-week-label",
    "pending-milk-eligible-count",
    "pending-milk-issued-count",
    "pending-milk-selected-count",
    "pending-milk-box-count",
    "pending-milk-list",
    "pending-milk-note",
    "pending-milk-status",
    "pending-milk-error",
    "pending-milk-issue-button",
    "pending-milk-history"
];
const document = new FakeDocument(ids);
document.getElementById("pending-milk-panel").hidden = true;
document.getElementById("pending-milk-error").hidden = true;
const eventTarget = new FakeEventTarget();

const teacherSession = {
    role: "teacher",
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    teacher: "ครูทดสอบ"
};

const weekState = {
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    weekStart: "2026-08-03",
    weekEnd: "2026-08-07",
    eligible: [
        {
            key: "s1_2026-08-04",
            studentId: "s1",
            studentNumber: "1",
            name: "นักเรียนหนึ่ง",
            date: "2026-08-04",
            quantity: 1
        },
        {
            key: "s2_2026-08-04",
            studentId: "s2",
            studentNumber: "2",
            name: "นักเรียนสอง",
            date: "2026-08-04",
            quantity: 1
        }
    ],
    alreadyIssued: [
        {
            key: "s1_2026-08-03",
            studentId: "s1",
            date: "2026-08-03",
            quantity: 1
        }
    ],
    eligibleBoxes: 2,
    alreadyIssuedBoxes: 1,
    records: [
        {
            id: "pending-1",
            roomId: "isolated-room",
            weekStart: "2026-08-03",
            weekEnd: "2026-08-07",
            totalBoxes: 1,
            note: "ทดสอบ",
            savedAt: "2026-08-05T03:00:00.000Z"
        }
    ]
};

let loadDate = "";
let issueInput = null;
let removeInput = null;
let clearCount = 0;
let loadCount = 0;
const pendingMilkManager = {
    async loadWeek(date) {
        loadDate = date;
        loadCount += 1;
        return { ...weekState };
    },
    async issue(input) {
        issueInput = input;
        return {
            id: "pending-2",
            quantity: input.selectedPairs.length,
            roomStockBefore: 50,
            roomStockAfter: 48,
            mainStockDelta: 0
        };
    },
    async remove(input) {
        removeInput = input;
        return {
            id: input.recordId,
            restoredQuantity: 1,
            roomStockBefore: 48,
            roomStockAfter: 49,
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
        PendingMilkManager: pendingMilkManager,
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
const PendingMilkView = context.window.PendingMilkView.constructor;
const view = new PendingMilkView(
    pendingMilkManager,
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
assert.equal(document.getElementById("pending-milk-panel").hidden, false, "Teacher session must reveal Pending Milk panel");
assert.match(document.getElementById("pending-milk-week-date").value, /^\d{4}-\d{2}-\d{2}$/, "Panel must default to a local date");
assert.equal(document.getElementById("pending-milk-issue-button").disabled, true, "Issue button must start disabled");

document.getElementById("pending-milk-week-date").value = "2026-08-05";
await view.handleLoad();
assert.equal(loadDate, "2026-08-05", "Week loading must remain anchored to the selected date");
assert.equal(document.getElementById("pending-milk-eligible-count").textContent, "2", "Eligible count must render");
assert.equal(document.getElementById("pending-milk-issued-count").textContent, "1", "Already-issued count must render");
assert.match(document.getElementById("pending-milk-list").innerHTML, /นักเรียนหนึ่ง/, "Eligible students must render");
assert.match(document.getElementById("pending-milk-history").innerHTML, /ลบและคืนสต็อก/, "Recent history must render rollback action");

const checkbox = new FakeElement("", "input");
checkbox.dataset.pendingKey = "s1_2026-08-04";
checkbox.checked = true;
view.handleSelectionChange({ target: checkbox });
assert.equal(document.getElementById("pending-milk-selected-count").textContent, "1", "Selected count must update");
assert.equal(document.getElementById("pending-milk-box-count").textContent, "1", "Box count must equal selected eligible pairs");
assert.equal(document.getElementById("pending-milk-issue-button").disabled, false, "Selection must enable issue action");

document.getElementById("pending-milk-note").value = "จ่ายทดสอบแบบแยก";
await view.handleIssue();
assert.equal(confirmCount, 1, "Issue must require explicit confirmation");
assert.equal(issueInput.weekDate, "2026-08-05", "Issue must preserve selected week date");
assert.deepEqual(
    Array.from(issueInput.selectedPairs, pair => ({ ...pair })),
    [{ studentId: "s1", date: "2026-08-04" }],
    "Issue must delegate only selected student/date pairs"
);
assert.equal(issueInput.note, "จ่ายทดสอบแบบแยก", "Issue must delegate the note without stock logic");
assert.equal(refreshCount, 1, "Successful issue must refresh Teacher read-only stock state");
assert.ok(document.getElementById("pending-milk-status").textContent.includes("50 → 48"), "Issue result must show Room Stock before and after");
assert.equal(document.getElementById("pending-milk-note").value, "", "Successful issue must clear the note");

view.currentWeek = { ...weekState };
const deleteButton = new FakeElement("", "button");
deleteButton.dataset.pendingDelete = "pending-1";
await view.handleDeleteClick({ target: deleteButton });
assert.equal(confirmCount, 2, "Delete must require explicit confirmation");
assert.equal(removeInput.recordId, "pending-1", "Delete must delegate the exact room record id");
assert.equal(refreshCount, 2, "Successful rollback must refresh Teacher read-only stock state");
assert.ok(document.getElementById("pending-milk-status").textContent.includes("คืนสต็อก 1 กล่อง"), "Delete result must show restored quantity");
assert.ok(loadCount >= 3, "Issue and delete must reload week eligibility after completion");

const queuedManager = {
    ...pendingMilkManager,
    async issue() {
        return { quantity: 1, stockQueued: true, mainStockDelta: 0 };
    }
};
const queuedDocument = new FakeDocument(ids);
queuedDocument.getElementById("pending-milk-panel").hidden = true;
queuedDocument.getElementById("pending-milk-error").hidden = true;
const queuedView = new PendingMilkView(
    queuedManager,
    authService,
    teacherManager,
    { document: queuedDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await queuedView.initialize();
queuedDocument.getElementById("pending-milk-week-date").value = "2026-08-05";
queuedView.currentWeek = { ...weekState };
queuedView.selectedKeys.add("s1_2026-08-04");
await queuedView.handleIssue();
assert.equal(queuedDocument.getElementById("pending-milk-status").dataset.state, "warning", "Partial save must render queued Room Stock warning");
assert.match(queuedDocument.getElementById("pending-milk-status").textContent, /เข้าคิว/, "Partial save warning must identify queued work");

eventTarget.dispatch("milkapp:logout");
assert.equal(document.getElementById("pending-milk-panel").hidden, true, "Logout must hide Pending Milk panel");
assert.ok(clearCount >= 1, "Logout must clear PendingMilkManager state");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("pending-milk-panel").hidden = true;
const adminView = new PendingMilkView(
    pendingMilkManager,
    { getSession: () => ({ role: "admin" }) },
    teacherManager,
    { document: adminDocument, eventTarget: new FakeEventTarget(), confirm: () => true }
);
await adminView.initialize();
assert.equal(adminDocument.getElementById("pending-milk-panel").hidden, true, "Admin session must not render Pending Milk panel");

console.log("Pending Milk UI checks passed.");
