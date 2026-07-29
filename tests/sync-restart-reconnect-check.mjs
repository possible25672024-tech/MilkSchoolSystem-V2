import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const storageCode = read("modules/storage/queueStorage.js");
const serviceCode = read("modules/services/syncService.js");
const managerCode = read("modules/sync/syncManager.js");

for (const [name, source] of [
    ["queueStorage.js", storageCode],
    ["syncService.js", serviceCode],
    ["syncManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

class MemoryStorage {
    constructor() {
        this.values = new Map();
    }

    getItem(key) {
        return this.values.has(key) ? this.values.get(key) : null;
    }

    setItem(key, value) {
        this.values.set(key, String(value));
    }

    removeItem(key) {
        this.values.delete(key);
    }
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

    dispatchEvent(event) {
        this.events.push(event);
        for (const listener of this.listeners.get(event.type || event.name) || []) {
            listener(event);
        }
    }

    trigger(name, detail = null) {
        const results = [];
        for (const listener of this.listeners.get(name) || []) {
            results.push(listener({ type: name, detail }));
        }
        return results.at(-1);
    }
}

const memoryStorage = new MemoryStorage();
const teacherSession = {
    role: "teacher",
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก"
};
const teacherPolicy = {
    assertRoomAccess(session, targetRoomId = null) {
        const roomId = String(session?.roomId || session?.classId || "");
        if (session?.role !== "teacher" || !roomId || roomId === "__admin__") {
            const error = new Error("Teacher session is invalid.");
            error.code = "TEACHER_SESSION_INVALID";
            throw error;
        }
        if (targetRoomId && String(targetRoomId) !== roomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return roomId;
    }
};

function createQueueStorage() {
    const context = {
        window: { localStorage: memoryStorage },
        console,
        Date,
        JSON,
        String,
        Number,
        Object,
        Array,
        Error,
        Map
    };
    vm.runInNewContext(storageCode, context);
    const QueueStorage = context.window.QueueStorage.constructor;
    return new QueueStorage(memoryStorage);
}

function createSyncService(queueStorage, attendanceService, clock, attendanceRepository = null) {
    const context = {
        window: {
            QueueStorage: queueStorage,
            AttendanceService: attendanceService,
            TeacherService: teacherPolicy,
            AttendanceRepository: attendanceRepository
        },
        console,
        Date,
        Math,
        JSON,
        String,
        Number,
        Object,
        Array,
        Error
    };
    vm.runInNewContext(serviceCode, context);
    const SyncService = context.window.SyncService.constructor;
    return new SyncService(queueStorage, attendanceService, teacherPolicy, {
        clock,
        attendanceRepository
    });
}

function createSyncManager(syncService, network, eventTarget) {
    const context = {
        window: {
            SyncService: syncService,
            AuthService: { getSession: () => teacherSession },
            navigator: network,
            setTimeout: () => 1,
            clearTimeout: () => {},
            setInterval: () => 1,
            clearInterval: () => {}
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
        Error,
        Promise,
        Map
    };
    vm.runInNewContext(managerCode, context);
    const SyncManager = context.window.SyncManager.constructor;
    return new SyncManager(
        syncService,
        context.window.AuthService,
        {
            eventTarget,
            network,
            setTimeoutFn: () => 1,
            clearTimeoutFn() {},
            setIntervalFn: () => 1,
            clearIntervalFn() {},
            periodicIntervalMs: 60000
        }
    );
}

let clockValue = 10000;
let mainStock = 999;
let replayCalls = [];
const firstAttendanceService = {
    async saveAttendance(session, input) {
        replayCalls.push(`attendance:${input.date}`);
        if (input.date === "2026-08-02") {
            const error = new Error("Attendance saved; Room Stock adjustment is pending.");
            error.code = "ROOM_STOCK_ADJUSTMENT_REQUIRED";
            error.details = {
                attendanceSaved: true,
                roomId: session.roomId,
                difference: 2,
                referenceId: `${session.roomId}_${input.date}`,
                roomName: session.roomName,
                date: input.date
            };
            throw error;
        }
        return {
            key: `${session.roomId}_${input.date}`,
            roomId: session.roomId,
            referenceId: `${session.roomId}_${input.date}`,
            mainStockDelta: 0
        };
    },
    async adjustRoomStock(session, input) {
        replayCalls.push(`stock:${input.referenceId}`);
        const error = new Error("Isolated retry failure.");
        error.code = "NETWORK_ERROR";
        throw error;
    }
};

const queueStorage1 = createQueueStorage();
const syncService1 = createSyncService(queueStorage1, firstAttendanceService, () => clockValue);
syncService1.queueAttendance(teacherSession, {
    key: "isolated-room_2026-08-01",
    record: {
        clsId: "isolated-room",
        roomName: "ห้องทดสอบแยก",
        date: "2026-08-01",
        data: { mockStudent: "present" }
    },
    baselinePresent: 0,
    queuedAt: 100
});
syncService1.queueAttendance(teacherSession, {
    key: "isolated-room_2026-08-02",
    record: {
        clsId: "isolated-room",
        roomName: "ห้องทดสอบแยก",
        date: "2026-08-02",
        data: { mockStudent: "present" }
    },
    baselinePresent: 0,
    queuedAt: 101
});
syncService1.queueRoomStockAdjustment(teacherSession, {
    key: "stockadj_isolated-room_manual",
    roomId: "isolated-room",
    difference: 1,
    referenceId: "isolated-room_manual",
    roomName: "ห้องทดสอบแยก",
    date: "2026-08-03",
    queuedAt: 102
});

assert.equal(queueStorage1.count(), 3, "Isolated persistent queue must contain all seeded entries");
assert.ok(memoryStorage.getItem("tc_pending_saves_v1"), "Queue must use the compatible persistent storage key");

const offlineNetwork = { onLine: false };
const offlineEvents = new FakeEventTarget();
const offlineManager = createSyncManager(syncService1, offlineNetwork, offlineEvents);
offlineManager.start();
await Promise.resolve();
assert.equal(replayCalls.length, 0, "Offline startup must not replay persistent queue entries");
assert.equal(queueStorage1.count(), 3, "Offline startup must preserve every queue entry");
offlineManager.stop();

const queueStorage2 = createQueueStorage();
assert.equal(queueStorage2.count(), 3, "Queue entries must survive QueueStorage recreation");
assert.deepEqual(
    plain(queueStorage2.snapshot().map(entry => entry.key)),
    [
        "isolated-room_2026-08-01",
        "isolated-room_2026-08-02",
        "stockadj_isolated-room_manual"
    ],
    "Persistent queue order must survive recreation"
);

const syncService2 = createSyncService(queueStorage2, firstAttendanceService, () => clockValue);
const reconnectNetwork = { onLine: false };
const reconnectEvents = new FakeEventTarget();
const reconnectManager = createSyncManager(syncService2, reconnectNetwork, reconnectEvents);
reconnectManager.start();
assert.equal(replayCalls.length, 0, "Offline recreated Manager must not replay before reconnect");

reconnectNetwork.onLine = true;
const reconnectSummary = await reconnectEvents.trigger("online");
assert.deepEqual(
    replayCalls,
    [
        "attendance:2026-08-01",
        "attendance:2026-08-02",
        "stock:isolated-room_manual"
    ],
    "Reconnect must replay the isolated queue sequentially"
);
assert.equal(reconnectSummary.processed, 3, "Reconnect must process each isolated entry once");
assert.equal(reconnectSummary.succeeded, 1, "Successful entry must be removed individually");
assert.equal(reconnectSummary.failed, 2, "Failed and deferred entries must remain pending");
assert.equal(reconnectSummary.deferred, 1, "Attendance partial save must convert to one deferred Room Stock entry");
assert.equal(reconnectSummary.remaining, 2, "Only failed/deferred entries must remain after reconnect");
assert.equal(reconnectSummary.mainStockDelta, 0, "Reconnect replay must not change Main Stock");
assert.equal(mainStock, 999, "Isolated replay must leave Main Stock unchanged");

const remainingAfterReconnect = queueStorage2.snapshot();
assert.equal(
    remainingAfterReconnect.some(entry => entry.key === "isolated-room_2026-08-01"),
    false,
    "Successful Attendance entry must disappear individually"
);
const failedEntry = remainingAfterReconnect.find(entry => entry.key === "stockadj_isolated-room_manual");
assert.equal(failedEntry?.attempts, 1, "Failed entry must persist with incremented attempts");
assert.equal(failedEntry?.nextRetryAt, 15000, "Failed entry must persist its next retry time");
const deferredEntry = remainingAfterReconnect.find(entry => entry.key === "stockadj_isolated-room_2026-08-02");
assert.equal(deferredEntry?.type, "roomStockAdjust", "Partial Attendance save must persist as Room Stock-only work");
assert.equal(deferredEntry?.attempts, 1, "Deferred entry must preserve its retry attempt");
assert.equal(deferredEntry?.nextRetryAt, 15000, "Deferred entry must preserve its next retry time");

const visibleStatus = reconnectManager.getStatus();
assert.equal(visibleStatus.queueCount, 2, "Manager must expose the two remaining queue entries");
assert.equal(
    visibleStatus.queueItems.some(item => item.key === "stockadj_isolated-room_manual" && item.status === "failed"),
    true,
    "Manager must expose failed queue status safely"
);
assert.equal(
    visibleStatus.queueItems.some(item => item.key === "stockadj_isolated-room_2026-08-02" && item.status === "deferred"),
    true,
    "Manager must expose deferred queue status safely"
);
reconnectManager.stop();

const queueStorage3 = createQueueStorage();
assert.equal(queueStorage3.count(), 2, "Failed/deferred entries must survive a later restart");
assert.equal(
    queueStorage3.snapshot().every(entry => entry.attempts === 1 && entry.nextRetryAt === 15000),
    true,
    "Restart must preserve attempts and next retry timestamps"
);

clockValue = 20000;
const successfulRetryService = {
    async saveAttendance() {
        throw new Error("No Attendance replay is expected after conversion.");
    },
    async adjustRoomStock(session, input) {
        replayCalls.push(`retry-stock:${input.referenceId}`);
        return {
            roomId: session.roomId,
            referenceId: input.referenceId,
            difference: input.difference,
            mainStockDelta: 0
        };
    }
};
const syncService3 = createSyncService(queueStorage3, successfulRetryService, () => clockValue);
const finalNetwork = { onLine: false };
const finalEvents = new FakeEventTarget();
const finalManager = createSyncManager(syncService3, finalNetwork, finalEvents);
finalManager.start();
assert.equal(queueStorage3.count(), 2, "Restarted offline Manager must preserve pending work before reconnect");

finalNetwork.onLine = true;
const finalSummary = await finalEvents.trigger("online");
assert.equal(finalSummary.succeeded, 2, "Later successful reconnect must remove each retained entry");
assert.equal(finalSummary.failed, 0, "Successful reconnect must leave no failed entry");
assert.equal(finalSummary.deferred, 0, "Successful reconnect must leave no deferred entry");
assert.equal(finalSummary.remaining, 0, "Successful reconnect must empty the isolated queue");
assert.equal(finalSummary.mainStockDelta, 0, "Successful retry must not change Main Stock");
assert.equal(queueStorage3.count(), 0, "Successful entries must be removed from persistent storage individually");
assert.equal(mainStock, 999, "Main Stock must remain unchanged after all isolated retries");
assert.ok(finalManager.getStatus().lastSyncedAt, "Successful reconnect must record the latest sync time");
finalManager.stop();

console.log("Sync restart/reconnect isolated checks passed.");
