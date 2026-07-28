import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const indexCode = read("index-v2.html");
const viewCode = read("modules/teacher/teacherView.js");
const appCode = read("modules/core/app.js");
const loginManagerCode = read("modules/login/loginManager.js");

assert.doesNotThrow(() => new vm.Script(viewCode), "teacherView.js must contain valid JavaScript");
assert.ok(indexCode.includes('id="teacher-shell"'), "V2 shell must contain the Teacher shell root");
assert.ok(indexCode.includes('id="teacher-room-stock"'), "V2 shell must contain the Room Stock display");
assert.ok(indexCode.includes('id="teacher-queue-count"'), "V2 shell must contain the queue count display");
assert.ok(indexCode.includes('id="teacher-connection-state"'), "V2 shell must contain the connection state display");
assert.ok(indexCode.includes("Sprint 4.1 Teacher UI Shell and Read-Only State"), "V2 shell must identify Sprint 4.1");
assert.ok(
    indexCode.indexOf("modules/sync/syncManager.js") < indexCode.indexOf("modules/teacher/teacherView.js"),
    "SyncManager must load before TeacherView"
);
assert.ok(
    indexCode.indexOf("modules/teacher/teacherView.js") < indexCode.indexOf("modules/core/app.js"),
    "TeacherView must load before App"
);
assert.ok(appCode.includes("teacherView.initialize"), "App must initialize the Teacher view after LoginManager");
assert.ok(loginManagerCode.includes('document.getElementById("admin-shell")'), "LoginManager must route Admin and Teacher shells explicitly");
assert.ok(loginManagerCode.includes('document.getElementById("teacher-shell")'), "LoginManager must protect the Teacher shell during role changes");

assert.ok(!viewCode.includes("FirebaseService"), "TeacherView must not access Firebase directly");
assert.ok(!viewCode.includes("fetch("), "TeacherView must not fetch directly");
assert.ok(!viewCode.includes("Repository"), "TeacherView must not access repositories directly");
assert.ok(!viewCode.includes("prepareRoomStockCommand"), "TeacherView must not prepare Room Stock mutations");
assert.ok(!viewCode.includes("roomStockDelta"), "TeacherView must not calculate Room Stock deltas");
assert.ok(!viewCode.includes("mainStockDelta"), "TeacherView must not calculate Main Stock deltas");
assert.ok(!viewCode.includes("localStorage"), "TeacherView must not own queue persistence");
assert.ok(!viewCode.includes("sessionStorage"), "TeacherView must not own session persistence");

class FakeElement {
    constructor(id) {
        this.id = id;
        this.textContent = "";
        this.hidden = false;
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
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
        for (const listener of this.listeners.get(name) || []) {
            listener({ type: name, detail, target: this });
        }
    }
}

class FakeDocument {
    constructor(ids) {
        this.elements = new Map(ids.map(id => [id, new FakeElement(id)]));
    }

    getElementById(id) {
        return this.elements.get(id) || null;
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
    "login-panel",
    "app-panel",
    "admin-shell",
    "teacher-shell",
    "teacher-school-name",
    "teacher-room-name",
    "teacher-name",
    "teacher-room-stock",
    "teacher-queue-count",
    "teacher-connection-state",
    "teacher-shell-status",
    "teacher-shell-error",
    "teacher-logout-button"
];
const document = new FakeDocument(ids);
document.getElementById("app-panel").hidden = true;
document.getElementById("teacher-shell").hidden = true;
const eventTarget = new FakeEventTarget();
const network = { onLine: true };
const teacherSession = {
    role: "teacher",
    classId: "r1",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ",
    schoolName: "โรงเรียนทดสอบ"
};

let currentRoomStock = -3;
let refreshCount = 0;
let currentView = null;
const teacherManager = {
    async refresh() {
        refreshCount += 1;
        currentView = {
            snapshot: {
                session: { ...teacherSession },
                room: { id: "r1", name: "อ.3-1", teacher: "ครูทดสอบ" },
                roomStock: currentRoomStock
            },
            dashboard: {
                roomId: "r1",
                actualRoomStock: currentRoomStock
            }
        };
        return currentView;
    },
    getSnapshot() {
        return currentView?.snapshot || null;
    },
    getDashboard() {
        return currentView?.dashboard || null;
    }
};
const authService = {
    session: teacherSession,
    getSession() {
        return this.session;
    }
};
let queueCount = 2;
const syncManager = {
    getStatus() {
        return {
            online: network.onLine,
            queueCount
        };
    }
};
let logoutCount = 0;
const loginManager = {
    logout() {
        logoutCount += 1;
    }
};

const context = {
    window: {
        TeacherManager: teacherManager,
        AuthService: authService,
        SyncManager: syncManager,
        LoginManager: loginManager,
        document,
        navigator: network
    },
    Intl,
    Number,
    String,
    Object,
    Boolean,
    Error,
    console
};
vm.runInNewContext(viewCode, context);
const TeacherView = context.window.TeacherView.constructor;
const teacherView = new TeacherView(
    teacherManager,
    authService,
    syncManager,
    loginManager,
    { document, eventTarget, network }
);

await teacherView.initialize();
assert.equal(refreshCount, 1, "Restored Teacher session must trigger one scoped Teacher refresh");
assert.equal(document.getElementById("teacher-shell").hidden, false, "Teacher session must reveal the Teacher shell");
assert.equal(document.getElementById("admin-shell").hidden, true, "Teacher session must hide the Admin shell");
assert.equal(document.getElementById("teacher-school-name").textContent, "โรงเรียนทดสอบ", "Teacher shell must display the school name");
assert.equal(document.getElementById("teacher-room-name").textContent, "อ.3-1", "Teacher shell must display the authenticated room");
assert.equal(document.getElementById("teacher-name").textContent, "ครูทดสอบ", "Teacher shell must display the teacher name");
assert.equal(document.getElementById("teacher-room-stock").textContent, "-3 กล่อง", "Negative Room Stock must remain visible and unclamped");
assert.equal(document.getElementById("teacher-queue-count").textContent, "2 รายการ", "Teacher shell must display the persistent queue count");
assert.equal(document.getElementById("teacher-connection-state").textContent, "ออนไลน์", "Teacher shell must display online state");
assert.equal(document.getElementById("teacher-connection-state").dataset.state, "online", "Online state must be machine-readable for styling");

currentRoomStock = 0;
await teacherView.activate(teacherSession);
assert.equal(document.getElementById("teacher-room-stock").textContent, "0 กล่อง", "Zero Room Stock must display as zero");
currentRoomStock = 12;
await teacherView.activate(teacherSession);
assert.equal(document.getElementById("teacher-room-stock").textContent, "12 กล่อง", "Positive Room Stock must display without recalculation");

queueCount = 5;
eventTarget.dispatch("milkapp:sync-queue-count", { queueCount });
assert.equal(document.getElementById("teacher-queue-count").textContent, "5 รายการ", "Queue events must refresh the displayed count");

network.onLine = false;
eventTarget.dispatch("offline");
assert.equal(document.getElementById("teacher-connection-state").textContent, "ออฟไลน์", "Offline browser event must update the connection label");
assert.equal(document.getElementById("teacher-connection-state").dataset.state, "offline", "Offline state must be machine-readable for styling");

network.onLine = true;
eventTarget.dispatch("online");
assert.equal(document.getElementById("teacher-connection-state").textContent, "ออนไลน์", "Online browser event must restore the connection label");

document.getElementById("teacher-logout-button").dispatch("click");
assert.equal(logoutCount, 1, "Teacher Logout button must delegate to LoginManager");

eventTarget.dispatch("milkapp:logout");
assert.equal(document.getElementById("teacher-shell").hidden, true, "Logout event must clear and hide the Teacher shell");
assert.equal(document.getElementById("teacher-room-stock").textContent, "—", "Logout must clear the displayed Room Stock");
assert.equal(document.getElementById("teacher-queue-count").textContent, "0 รายการ", "Logout must clear the displayed queue count");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("teacher-shell").hidden = true;
const adminEventTarget = new FakeEventTarget();
let adminRefreshCount = 0;
const adminTeacherManager = {
    async refresh() {
        adminRefreshCount += 1;
        return null;
    },
    getSnapshot: () => null,
    getDashboard: () => null
};
const adminView = new TeacherView(
    adminTeacherManager,
    { getSession: () => ({ role: "admin", classId: "__admin__" }) },
    syncManager,
    loginManager,
    { document: adminDocument, eventTarget: adminEventTarget, network }
);
await adminView.initialize();
assert.equal(adminRefreshCount, 0, "Admin session must not load Teacher data");
assert.equal(adminDocument.getElementById("teacher-shell").hidden, true, "Admin session must not render the Teacher shell");

console.log("Teacher UI shell checks passed.");
