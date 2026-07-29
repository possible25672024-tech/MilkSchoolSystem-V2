import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const indexCode = read("index-v2.html");
const viewCode = read("modules/sync/syncView.js");
const managerCode = read("modules/sync/syncManager.js");
const appCode = read("modules/core/app.js");

assert.doesNotThrow(() => new vm.Script(viewCode), "syncView.js must contain valid JavaScript");
assert.doesNotThrow(() => new vm.Script(managerCode), "syncManager.js must contain valid JavaScript");
assert.ok(
    indexCode.indexOf("modules/sync/syncManager.js") < indexCode.indexOf("modules/core/app.js"),
    "SyncManager must load before App"
);
assert.ok(appCode.includes('import("../sync/syncView.js")'), "App must load SyncView from the Sync module boundary");
assert.ok(appCode.includes("syncView.initialize"), "App must initialize SyncView after the Teacher Attendance UI");
assert.ok(
    viewCode.includes('panel.id = "sync-panel"') || viewCode.includes('id="sync-panel"'),
    "SyncView must create the operational queue panel"
);
assert.ok(viewCode.includes('id="sync-retry-button"'), "SyncView must create the manual retry action");
assert.ok(viewCode.includes('flushNow("manual-ui")'), "Manual retry must delegate to SyncManager");
assert.ok(managerCode.includes("summarizeQueueEntries"), "SyncManager must expose safe queue summaries");

for (const forbidden of [
    "QueueStorage",
    "SyncService",
    "FirebaseService",
    "Repository",
    "fetch(",
    "localStorage",
    "sessionStorage"
]) {
    assert.ok(!viewCode.includes(forbidden), `SyncView must not contain ${forbidden}`);
}

class FakeEventTarget {
    constructor() {
        this.listeners = new Map();
        this.events = [];
    }

    addEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        listeners.push(listener);
        this.listeners.set(name, listeners);
    }

    removeEventListener(name, listener) {
        const listeners = this.listeners.get(name) || [];
        this.listeners.set(name, listeners.filter(item => item !== listener));
    }

    dispatch(name, detail = null) {
        for (const listener of this.listeners.get(name) || []) {
            listener({ type: name, detail });
        }
    }

    dispatchEvent(event) {
        this.events.push(event);
        this.dispatch(event.type || event.name, event.detail);
    }
}

const rawEntries = [
    {
        type: "attendance",
        key: "r1_2026-07-28",
        roomId: "r1",
        attempts: 1,
        queuedAt: 1000,
        nextRetryAt: 6000,
        record: {
            clsId: "r1",
            roomName: "อ.3-1",
            date: "2026-07-28",
            data: { secretStudent: "present" },
            photos: ["PRIVATE_PHOTO"],
            signature: "PRIVATE_SIGNATURE"
        }
    },
    {
        type: "roomStockAdjust",
        key: "stockadj_r1_2026-07-28",
        roomId: "r1",
        roomName: "อ.3-1",
        date: "2026-07-28",
        referenceId: "r1_2026-07-28",
        attempts: 0,
        queuedAt: 2000
    }
];

let resolveFlush;
const managerService = {
    getStatus() {
        return {
            count: rawEntries.length,
            maxAttempts: 1,
            entries: rawEntries
        };
    },
    flush() {
        return new Promise(resolve => {
            resolveFlush = resolve;
        });
    },
    queueAttendance() {
        return {};
    },
    queueRoomStockAdjustment() {
        return {};
    }
};
const managerEvents = new FakeEventTarget();
const network = { onLine: true };
const teacherSession = {
    role: "teacher",
    roomId: "r1",
    roomName: "อ.3-1"
};
const managerContext = {
    window: {
        SyncService: managerService,
        AuthService: { getSession: () => teacherSession },
        navigator: network,
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {}
    },
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.name = type;
            this.detail = options?.detail;
        }
    },
    Date,
    Math,
    Number,
    Boolean,
    Object,
    Array,
    String,
    Error,
    Promise,
    Map
};
vm.runInNewContext(managerCode, managerContext);
const SyncManager = managerContext.window.SyncManager.constructor;
const manager = new SyncManager(
    managerService,
    managerContext.window.AuthService,
    {
        eventTarget: managerEvents,
        network,
        setTimeoutFn: () => 1,
        clearTimeoutFn() {},
        setIntervalFn: () => 1,
        clearIntervalFn() {}
    }
);
manager.lastSummary = {
    results: [
        {
            key: "r1_2026-07-28",
            status: "failed",
            error: { code: "NETWORK", message: "retry" }
        }
    ]
};
const safeStatus = manager.getStatus();
assert.equal(safeStatus.queueItems.length, 2, "Manager must expose one safe summary per valid queue entry");
assert.equal(safeStatus.queueItems[0].date, "2026-07-28", "Safe Attendance summary must preserve the date");
assert.equal(safeStatus.queueItems[0].status, "failed", "Safe summary must preserve replay status");
const safeJson = JSON.stringify(safeStatus.queueItems);
for (const secret of [
    "secretStudent",
    "PRIVATE_PHOTO",
    "PRIVATE_SIGNATURE",
    '"data"',
    '"photos"',
    '"signature"'
]) {
    assert.ok(!safeJson.includes(secret), `Safe queue summaries must not expose ${secret}`);
}

const firstFlush = manager.flushNow("manual-ui");
const overlappingFlush = manager.flushNow("overlap");
assert.equal(firstFlush, overlappingFlush, "Overlapping UI retries must reuse one in-flight SyncManager operation");
const startedEvent = managerEvents.events.find(event => event.type === "milkapp:sync-started");
assert.equal(startedEvent.detail.status.flushing, true, "Sync started event must expose flushing state");
resolveFlush({
    processed: 2,
    succeeded: 2,
    failed: 0,
    deferred: 0,
    remaining: 0,
    results: [],
    nextRetryDelay: 0,
    mainStockDelta: 0
});
await firstFlush;

class FakeElement {
    constructor(id = "", tagName = "div") {
        this.id = id;
        this.tagName = tagName;
        this.textContent = "";
        this.hidden = false;
        this.disabled = false;
        this.dataset = {};
        this.attributes = new Map();
        this.listeners = new Map();
        this.children = [];
        this.className = "";
        this.innerHTML = "";
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
            this.children.push(child);
        }
        return child;
    }

    replaceChildren(...children) {
        this.children = children.filter(Boolean);
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

const ids = [
    "teacher-shell",
    "sync-view-style",
    "sync-panel",
    "sync-banner",
    "sync-pending-count",
    "sync-max-attempts",
    "sync-last-succeeded",
    "sync-last-failed",
    "sync-last-synced-at",
    "sync-last-summary",
    "sync-next-retry",
    "sync-queue-items",
    "sync-status",
    "sync-error",
    "sync-retry-button"
];
const document = new FakeDocument(ids);
document.getElementById("sync-panel").hidden = true;
const events = new FakeEventTarget();
let status = {
    online: true,
    flushing: false,
    queueCount: 2,
    maxAttempts: 1,
    lastSyncedAt: null,
    lastSummary: {
        processed: 2,
        succeeded: 0,
        failed: 1,
        deferred: 1,
        remaining: 2,
        nextRetryDelay: 5000
    },
    queueItems: safeStatus.queueItems
};
let startCount = 0;
let stopCount = 0;
let retryReason = "";
const viewManager = {
    getStatus() {
        return status;
    },
    start() {
        startCount += 1;
        return status;
    },
    stop() {
        stopCount += 1;
        return status;
    },
    async flushNow(reason) {
        retryReason = reason;
        status = {
            ...status,
            queueCount: 0,
            maxAttempts: 0,
            lastSyncedAt: "2026-07-28T05:00:00.000Z",
            lastSummary: {
                processed: 2,
                succeeded: 2,
                failed: 0,
                deferred: 0,
                remaining: 0,
                nextRetryDelay: 0
            },
            queueItems: []
        };
        return status.lastSummary;
    }
};
const viewContext = {
    window: {
        SyncManager: viewManager,
        AuthService: { getSession: () => teacherSession },
        document,
        navigator: network
    },
    Date,
    Intl,
    Math,
    Number,
    Boolean,
    Object,
    Array,
    String,
    Error,
    Promise,
    console
};
vm.runInNewContext(viewCode, viewContext);
const SyncView = viewContext.window.SyncView.constructor;
const view = new SyncView(
    viewManager,
    viewContext.window.AuthService,
    { document, eventTarget: events, network }
);

await view.initialize();
assert.equal(startCount, 1, "Restored Teacher session must start the existing SyncManager lifecycle");
assert.equal(document.getElementById("sync-panel").hidden, false, "Teacher session must reveal the Queue panel");
assert.equal(document.getElementById("sync-pending-count").textContent, "2", "Queue count must render from Manager status");
assert.equal(document.getElementById("sync-banner").dataset.state, "error", "Failed/deferred work must render a visible retry state");
assert.equal(document.getElementById("sync-retry-button").disabled, false, "Online pending work must allow manual retry");
assert.equal(document.getElementById("sync-queue-items").children.length, 2, "Safe queue item summaries must render individually");
const renderedItems = JSON.stringify(document.getElementById("sync-queue-items").children);
for (const secret of ["secretStudent", "PRIVATE_PHOTO", "PRIVATE_SIGNATURE"]) {
    assert.ok(!renderedItems.includes(secret), `Rendered summaries must not expose ${secret}`);
}

network.onLine = false;
events.dispatch("offline");
assert.equal(document.getElementById("sync-banner").dataset.state, "offline", "Offline event must render offline state");
assert.equal(document.getElementById("sync-retry-button").disabled, true, "Manual retry must be disabled while offline");

network.onLine = true;
status = { ...status, online: true, lastSummary: null };
events.dispatch("online");
assert.equal(document.getElementById("sync-retry-button").disabled, false, "Manual retry must return when online with pending work");

await view.handleManualRetry();
assert.equal(retryReason, "manual-ui", "Manual retry must use the reviewed UI reason");
assert.equal(document.getElementById("sync-banner").dataset.state, "success", "Empty queue after retry must render synchronized state");
assert.equal(document.getElementById("sync-retry-button").disabled, true, "Manual retry must disable when no work remains");

status = {
    ...status,
    queueCount: 1,
    queueItems: [safeStatus.queueItems[1]],
    flushing: true
};
events.dispatch("milkapp:sync-started", {});
assert.equal(document.getElementById("sync-banner").dataset.state, "syncing", "Sync-started event must render active syncing state");
assert.equal(document.getElementById("sync-retry-button").disabled, true, "Manual retry must be disabled during an active flush");

events.dispatch("milkapp:logout");
assert.equal(document.getElementById("sync-panel").hidden, true, "Logout must hide the Queue panel");
assert.equal(stopCount, 1, "Logout must stop the SyncManager browser lifecycle");

const adminDocument = new FakeDocument(ids);
adminDocument.getElementById("sync-panel").hidden = true;
let adminStartCount = 0;
const adminManager = {
    getStatus: () => ({ online: true, queueCount: 0, queueItems: [] }),
    flushNow: async () => ({}),
    start() {
        adminStartCount += 1;
    },
    stop() {}
};
const adminView = new SyncView(
    adminManager,
    { getSession: () => ({ role: "admin" }) },
    { document: adminDocument, eventTarget: new FakeEventTarget(), network }
);
await adminView.initialize();
assert.equal(adminStartCount, 0, "Admin session must not start Teacher queue replay");
assert.equal(adminDocument.getElementById("sync-panel").hidden, true, "Admin session must not render the Queue panel");

console.log("Sync UI checks passed.");
