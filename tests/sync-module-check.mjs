import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const indexCode = read("index-v2.html");
const storageCode = read("modules/storage/queueStorage.js");
const serviceCode = read("modules/services/syncService.js");
const managerCode = read("modules/sync/syncManager.js");
const attendanceCode = read("modules/services/attendanceService.js");

for (const [name, source] of [
    ["queueStorage.js", storageCode],
    ["syncService.js", serviceCode],
    ["syncManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

const loadOrder = [
    "modules/services/storageService.js",
    "modules/storage/queueStorage.js",
    "modules/services/attendanceService.js",
    "modules/services/syncService.js",
    "modules/attendance/attendanceManager.js",
    "modules/sync/syncManager.js",
    "modules/core/app.js"
];

for (let position = 0; position < loadOrder.length - 1; position += 1) {
    assert.ok(
        indexCode.indexOf(loadOrder[position]) < indexCode.indexOf(loadOrder[position + 1]),
        `${loadOrder[position]} must load before ${loadOrder[position + 1]}`
    );
}

assert.ok(storageCode.includes('"tc_pending_saves_v1"'), "QueueStorage must preserve the compatible legacy queue key");
assert.ok(!storageCode.includes("FirebaseService"), "QueueStorage must not access Firebase");
assert.ok(!storageCode.includes("document."), "QueueStorage must not contain DOM logic");
assert.ok(!serviceCode.includes("localStorage"), "SyncService must not own browser storage");
assert.ok(!serviceCode.includes("sessionStorage"), "SyncService must not own sessions");
assert.ok(!serviceCode.includes("document."), "SyncService must not contain DOM logic");
assert.ok(!serviceCode.includes("fetch("), "SyncService must not fetch directly");
assert.ok(!serviceCode.includes("FirebaseService"), "SyncService must not access Firebase directly");
assert.ok(!managerCode.includes("FirebaseService"), "SyncManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "SyncManager must not fetch directly");
assert.ok(attendanceCode.includes("adjustRoomStock"), "AttendanceService must expose Room Stock-only adjustment replay");

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

const memoryStorage = new MemoryStorage();
let now = 1000;
const storageContext = {
    window: { localStorage: memoryStorage },
    console,
    Date: class DateStub extends Date {
        static now() {
            return now;
        }
    },
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    Map
};
vm.runInNewContext(storageCode, storageContext);
const QueueStorage = storageContext.window.QueueStorage.constructor;
const queueStorage = new QueueStorage(memoryStorage);

assert.deepEqual(plain(queueStorage.load()), [], "Missing queue storage must return an empty queue");

memoryStorage.setItem("tc_pending_saves_v1", JSON.stringify([
    null,
    { type: "unknown", key: "bad" },
    {
        type: "attendance",
        key: "r1_2026-07-27",
        rec: { clsId: "r1", date: "2026-07-27", data: { s1: "present" } },
        baselinePresent: 0,
        queuedAt: 10
    },
    { type: "roomStockAdjust", key: "missing-room", diff: 2 }
]));
assert.equal(queueStorage.count(), 1, "Invalid queue entries must be filtered individually without deleting valid entries");

queueStorage.clear();
queueStorage.upsert({
    type: "attendance",
    key: "r1_2026-07-27",
    roomId: "r1",
    record: { clsId: "r1", date: "2026-07-27", data: { s1: "present" } },
    baselinePresent: 2,
    queuedAt: 50,
    attempts: 4
});
now = 2000;
queueStorage.upsert({
    type: "attendance",
    key: "r1_2026-07-27",
    roomId: "r1",
    record: { clsId: "r1", date: "2026-07-27", data: { s1: "absent", s2: "present" } },
    baselinePresent: 9,
    queuedAt: 2000
});
const replacedAttendance = queueStorage.get("r1_2026-07-27");
assert.equal(replacedAttendance.baselinePresent, 2, "Repeated queued attendance edits must preserve the original baseline");
assert.equal(replacedAttendance.record.data.s1, "absent", "Repeated queued attendance edits must keep the latest record");
assert.equal(replacedAttendance.queuedAt, 50, "Repeated queued attendance edits must preserve the first queue time");
assert.equal(replacedAttendance.attempts, 0, "A new queued edit must reset retry attempts");

queueStorage.upsert({
    type: "roomStockAdjust",
    key: "stockadj_r1_2026-07-27",
    roomId: "r1",
    difference: 2,
    referenceId: "r1_2026-07-27",
    roomName: "อ.3-1",
    queuedAt: 60
});
assert.equal(queueStorage.count(), 2, "Room Stock adjustment entries must persist beside attendance entries");
queueStorage.remove("r1_2026-07-27");
assert.equal(queueStorage.count(), 1, "Removing one successful entry must not delete unrelated entries");

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

const replayOrder = [];
let failStockAdjustment = true;
const attendanceService = {
    async saveAttendance(session, input) {
        replayOrder.push(`attendance:${input.date}`);
        return {
            key: `${session.roomId}_${input.date}`,
            presentDifference: 1,
            mainStockDelta: 0
        };
    },
    async adjustRoomStock(session, input) {
        replayOrder.push(`stock:${input.referenceId}`);
        if (failStockAdjustment) {
            const error = new Error("Temporary network failure");
            error.code = "NETWORK_ERROR";
            throw error;
        }
        return {
            roomId: session.roomId,
            difference: input.difference,
            mainStockDelta: 0
        };
    }
};

const serviceContext = {
    window: {
        QueueStorage: queueStorage,
        AttendanceService: attendanceService,
        TeacherService: teacherPolicy
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
vm.runInNewContext(serviceCode, serviceContext);
const SyncService = serviceContext.window.SyncService.constructor;
let serviceNow = 10000;
const syncService = new SyncService(queueStorage, attendanceService, teacherPolicy, {
    clock: () => serviceNow
});
const teacherSession = {
    role: "teacher",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ"
};

queueStorage.clear();
syncService.queueAttendance(teacherSession, {
    key: "r1_2026-07-28",
    record: {
        clsId: "r1",
        roomName: "อ.3-1",
        date: "2026-07-28",
        data: { s1: "present" }
    },
    baselinePresent: 0,
    queuedAt: 100
});
syncService.queueRoomStockAdjustment(teacherSession, {
    key: "stockadj_r1_2026-07-27",
    roomId: "r1",
    difference: 2,
    referenceId: "r1_2026-07-27",
    roomName: "อ.3-1",
    queuedAt: 101
});
syncService.queueAttendance(teacherSession, {
    key: "r1_2026-07-29",
    record: {
        clsId: "r1",
        roomName: "อ.3-1",
        date: "2026-07-29",
        data: { s1: "absent" }
    },
    baselinePresent: 0,
    queuedAt: 102
});

const firstFlush = await syncService.flush(teacherSession);
assert.deepEqual(
    replayOrder,
    ["attendance:2026-07-28", "stock:r1_2026-07-27", "attendance:2026-07-29"],
    "Queue entries must replay sequentially in stored order"
);
assert.equal(firstFlush.succeeded, 2, "Successful entries must be counted");
assert.equal(firstFlush.failed, 1, "Failed entries must be retained");
assert.equal(firstFlush.remaining, 1, "Only the failed entry must remain queued");
assert.equal(firstFlush.nextRetryDelay, 5000, "First failed attempt must use a 5 second retry delay");
assert.equal(firstFlush.mainStockDelta, 0, "Queue replay must never change Main Stock");
const retained = queueStorage.snapshot()[0];
assert.equal(retained.type, "roomStockAdjust", "Room Stock adjustment failure must not requeue attendance");
assert.equal(retained.attempts, 1, "Failed entries must increment attempts");
assert.equal(retained.nextRetryAt, 15000, "Failed entries must record the next retry time");

assert.equal(syncService.backoffForAttempts(1), 5000, "Backoff step 1 must be 5 seconds");
assert.equal(syncService.backoffForAttempts(2), 10000, "Backoff step 2 must be 10 seconds");
assert.equal(syncService.backoffForAttempts(3), 20000, "Backoff step 3 must be 20 seconds");
assert.equal(syncService.backoffForAttempts(4), 40000, "Backoff step 4 must be 40 seconds");
assert.equal(syncService.backoffForAttempts(5), 60000, "Backoff step 5 must be 60 seconds");
assert.equal(syncService.backoffForAttempts(99), 60000, "Backoff must remain capped at 60 seconds");

await assert.rejects(
    async () => syncService.queueAttendance(teacherSession, {
        key: "r2_2026-07-30",
        roomId: "r2",
        record: { clsId: "r2", date: "2026-07-30", data: {} },
        baselinePresent: 0
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED",
    "Cross-room queue entries must be rejected"
);

failStockAdjustment = false;
serviceNow = 20000;
const secondFlush = await syncService.flush(teacherSession);
assert.equal(secondFlush.succeeded, 1, "A later successful retry must remove the retained entry");
assert.equal(secondFlush.remaining, 0, "Successful retry must empty the queue");

class FakeEventTarget {
    constructor() {
        this.listeners = new Map();
        this.events = [];
    }

    addEventListener(name, listener) {
        this.listeners.set(name, listener);
    }

    removeEventListener(name) {
        this.listeners.delete(name);
    }

    dispatchEvent(event) {
        this.events.push(event);
    }

    trigger(name) {
        return this.listeners.get(name)?.();
    }
}

const managerEventTarget = new FakeEventTarget();
const network = { onLine: true };
let intervalCallback = null;
let retryCallback = null;
let managerFlushCount = 0;
let resolveFlush;
const managerSyncService = {
    getStatus() {
        return { count: 0, maxAttempts: 0 };
    },
    queueAttendance() {
        return {};
    },
    queueRoomStockAdjustment() {
        return {};
    },
    flush() {
        managerFlushCount += 1;
        return new Promise(resolve => {
            resolveFlush = resolve;
        });
    }
};
const managerContext = {
    window: {
        SyncService: managerSyncService,
        AuthService: { getSession: () => teacherSession },
        navigator: network,
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {}
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    Date,
    Math,
    Number,
    Boolean,
    Object,
    Error,
    Promise
};
vm.runInNewContext(managerCode, managerContext);
const SyncManager = managerContext.window.SyncManager.constructor;
const syncManager = new SyncManager(
    managerSyncService,
    managerContext.window.AuthService,
    {
        eventTarget: managerEventTarget,
        network,
        setTimeoutFn(callback) {
            retryCallback = callback;
            return 1;
        },
        clearTimeoutFn() {
            retryCallback = null;
        },
        setIntervalFn(callback) {
            intervalCallback = callback;
            return 2;
        },
        clearIntervalFn() {
            intervalCallback = null;
        },
        periodicIntervalMs: 60000
    }
);

syncManager.start();
assert.ok(intervalCallback, "SyncManager must register a periodic online flush");
const firstManagerFlush = syncManager.flushNow("manual");
const overlappingFlush = syncManager.flushNow("manual-overlap");
assert.equal(firstManagerFlush, overlappingFlush, "Overlapping flush requests must share one in-flight operation");
assert.equal(managerFlushCount, 1, "Overlapping flush requests must not replay the queue twice");
resolveFlush({
    processed: 1,
    succeeded: 0,
    failed: 1,
    remaining: 1,
    results: [],
    nextRetryDelay: 5000,
    mainStockDelta: 0
});
await firstManagerFlush;
assert.ok(retryCallback, "Failed sync must schedule a retry timer");

managerSyncService.flush = async () => {
    managerFlushCount += 1;
    return {
        processed: 0,
        succeeded: 0,
        failed: 0,
        remaining: 0,
        results: [],
        nextRetryDelay: 0,
        mainStockDelta: 0
    };
};
await managerEventTarget.trigger("online");
assert.equal(managerFlushCount, 2, "Reconnect must trigger a queue flush");
await intervalCallback();
await Promise.resolve();
assert.equal(managerFlushCount, 3, "Periodic online checks must trigger a queue flush");
network.onLine = false;
const offlineSummary = await syncManager.flushNow("manual-offline");
assert.equal(offlineSummary.skipped, "offline", "Offline flush attempts must be skipped without deleting queue entries");
syncManager.stop();
assert.equal(intervalCallback, null, "Stopping SyncManager must clear the periodic timer");

console.log("Sync module checks passed.");
