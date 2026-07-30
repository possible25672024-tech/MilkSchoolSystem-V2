import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const source = read("modules/report/adminReportView.js");
const appSource = read("modules/core/app.js");
const indexSource = read("index-v2.html");

assert.doesNotThrow(() => new vm.Script(source), "Admin Report View must contain valid JavaScript");
for (const forbidden of [
    "FirebaseService",
    "fetch(",
    "XMLHttpRequest",
    "localStorage",
    "sessionStorage",
    "roomStock",
    "mainStock",
    "stockLog",
    "ledger",
    "Queue"
]) {
    assert.ok(!source.includes(forbidden), `Admin Report View must not own ${forbidden}`);
}

for (const expected of [
    'id="admin-report-panel"',
    'data-admin-report-view="room"',
    'data-admin-report-view="grade"',
    'data-admin-report-view="school"',
    'id="admin-report-print"',
    'id="admin-report-export"',
    "นมค้าง",
    "ย้อนหลัง",
    "ปิดเทอม",
    "คงเหลือ"
]) {
    assert.ok(indexSource.includes(expected), `Admin report HTML must contain ${expected}`);
}
assert.ok(appSource.includes("ensureAdminReportView"), "Application must initialize Admin Report View");
assert.ok(appSource.includes("adminReportView.initialize()"), "Application must start Admin Report View");
assert.ok(
    indexSource.indexOf("modules/report/reportManager.js")
        < indexSource.indexOf("modules/report/adminReportView.js"),
    "ReportManager must load before Admin Report View"
);

const createElement = id => ({
    id,
    hidden: false,
    textContent: "",
    disabled: false,
    dataset: {},
    children: [],
    attributes: {},
    addEventListener() {},
    setAttribute(name, value) {
        this.attributes[name] = value;
        if (name === "hidden") this.hidden = true;
    },
    removeAttribute(name) {
        delete this.attributes[name];
        if (name === "hidden") this.hidden = false;
    },
    appendChild(child) {
        this.children.push(child);
    },
    replaceChildren(...children) {
        this.children = children;
    },
    click() {
        this.clicked = true;
    }
});
const ids = [
    "admin-report-panel", "admin-report-refresh", "admin-report-print",
    "admin-report-export", "admin-report-body", "admin-report-school",
    "admin-report-year", "admin-report-total-rooms",
    "admin-report-total-distributed", "admin-report-total-used",
    "admin-report-total-remaining", "admin-report-source-status",
    "admin-report-status", "admin-report-error"
];
const elements = new Map(ids.map(id => [id, createElement(id)]));
const buttons = ["room", "grade", "school"].map(view => {
    const button = createElement(`view-${view}`);
    button.dataset.adminReportView = view;
    return button;
});
const document = {
    getElementById: id => elements.get(id) || null,
    querySelectorAll: selector => selector === "[data-admin-report-view]" ? buttons : [],
    createElement: tag => createElement(tag)
};
const listeners = new Map();
const eventTarget = {
    addEventListener(name, handler) {
        listeners.set(name, handler);
    }
};
const report = {
    view: "room",
    rows: [{
        roomName: "อ.1-1",
        students: 2,
        distTotal: 20,
        usedChk: 2,
        usedPending: 1,
        usedRetro: 0,
        usedVacation: 0,
        remaining: 17,
        usedPercent: 15
    }],
    schoolName: "โรงเรียนทดสอบ",
    academicYear: "2569",
    schoolTotal: {
        roomCount: 1,
        students: 2,
        distTotal: 20,
        usedChk: 2,
        usedPending: 1,
        usedRetro: 0,
        usedVacation: 0,
        remaining: 17,
        usedPercent: 15
    },
    sourceDiagnostics: {
        missing: [],
        invalid: [],
        counts: { pending: 1, retro: 0, vacation: 0 }
    }
};
let refreshes = 0;
const manager = {
    current: null,
    setView(view) {
        this.view = view;
        return view;
    },
    async refresh() {
        refreshes += 1;
        this.current = report;
        return report;
    },
    getCurrentReport() {
        return this.current;
    },
    buildPrintModel() {
        return { title: "รายงาน", schoolName: "โรงเรียน", academicYear: "2569", rows: [] };
    },
    buildExportModel() {
        return { filename: "report.xlsx", rows: [] };
    }
};
const windowObject = {
    ReportManager: manager,
    AuthService: null,
    addEventListener() {},
    open: () => null,
    URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} }
};
const context = {
    window: windowObject,
    document,
    Blob: class Blob {},
    JSON,
    Object,
    Array,
    Number,
    String,
    Error,
    console
};
vm.runInNewContext(source, context);
const View = context.window.AdminReportView.constructor;
const teacherView = new View(manager, { getSession: () => ({ role: "teacher" }) }, eventTarget, {
    window: windowObject,
    document
});
teacherView.initialize();
assert.equal(elements.get("admin-report-panel").hidden, true, "Teacher session must not expose Admin report");

const adminView = new View(manager, { getSession: () => ({ role: "admin" }) }, eventTarget, {
    window: windowObject,
    document
});
adminView.initialize();
await new Promise(resolve => setTimeout(resolve, 0));
assert.equal(elements.get("admin-report-panel").hidden, false, "Admin session must expose Admin report");
assert.equal(refreshes, 1, "Admin initialization must load one report snapshot");
assert.equal(elements.get("admin-report-body").children.length, 1, "Admin report must render report rows");
assert.equal(elements.get("admin-report-school").textContent, "โรงเรียนทดสอบ");
assert.equal(elements.get("admin-report-total-remaining").textContent, "17 กล่อง");
assert.match(elements.get("admin-report-source-status").textContent, /นมค้าง 1/);

adminView.reset();
assert.equal(elements.get("admin-report-panel").hidden, true, "Logout reset must hide Admin report");

console.log("Admin Report UI checks passed.");
