import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const firebaseCode = read("modules/services/firebaseService.js");
const attendanceCode = read("modules/services/attendanceService.js");
const managerCode = read("modules/attendance/attendanceManager.js");
const storageCode = read("modules/storage/queueStorage.js");
const syncCode = read("modules/services/syncService.js");

for (const [name, source] of [
    ["firebaseService.js", firebaseCode],
    ["attendanceService.js", attendanceCode],
    ["attendanceManager.js", managerCode],
    ["queueStorage.js", storageCode],
    ["syncService.js", syncCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

const firebaseRequests = [];
const firebaseResponses = [
    {
        ok: true,
        status: 200,
        text: async () => "20",
        headers: { get: name => name.toLowerCase() === "etag" ? '"v1"' : null }
    },
    {
        ok: false,
        status: 412,
        text: async () => "19",
        headers: { get: name => name.toLowerCase() === "etag" ? '"v2"' : null }
    },
    {
        ok: true,
        status: 200,
        text: async () => "17",
        headers: { get: name => name.toLowerCase() === "etag" ? '"v3"' : null }
    }
];
const firebaseContext = {
    window: {
        ConfigManager: {
            getFirebaseConfig: () => ({}),
            getDatabaseURL: () => "",
            getAuthToken: () => ""
        }
    },
    URLSearchParams,
    AbortController,
    fetch: async (url, options) => {
        firebaseRequests.push({ url, options: { ...options, headers: { ...(options.headers || {}) } } });
        return firebaseResponses.shift();
    },
    setTimeout,
    clearTimeout,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Map,
    Error,
    console
};
vm.runInNewContext(firebaseCode, firebaseContext);
const FirebaseService = firebaseContext.window.FirebaseService.constructor;
const firebaseService = new FirebaseService();
firebaseService.databaseURL = "https://example.firebaseio.com";

const versioned = await firebaseService.getWithEtag("milkApp/roomStock/r1");
assert.equal(versioned.value, 20, "ETag read must return the current Room Stock value");
assert.equal(versioned.etag, '"v1"', "ETag read must expose the Firebase ETag");
assert.equal(
    firebaseRequests[0].options.headers["X-Firebase-ETag"],
    "true",
    "ETag read must request the Firebase ETag header"
);

const conflict = await firebaseService.setIfMatch("milkApp/roomStock/r1", 18, '"v1"');
assert.equal(conflict.status, "conflict", "HTTP 412 must be returned as a retryable conflict");
assert.equal(firebaseRequests[1].options.headers["If-Match"], '"v1"', "Conditional write must send If-Match");
assert.equal(firebaseRequests[1].options.headers["Content-Type"], "application/json", "Conditional JSON write must keep Content-Type");

const conditionalSuccess = await firebaseService.setIfMatch("milkApp/roomStock/r1", 17, '"v2"');
assert.equal(conditionalSuccess.status, "ok", "Successful conditional write must return ok");
assert.equal(conditionalSuccess.value, 17, "Successful conditional write must preserve the written value");

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
const teacherSession = {
    role: "teacher",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ"
};

const conflictState = {
    attendance: null,
    savedRecord: null,
    stockReads: 0,
    stockWrites: 0,
    auditWrites: 0
};
const conflictRepository = {
    async loadAttendanceRecord() {
        return conflictState.attendance;
    },
    async loadRoomAttendance() {
        return {};
    },
    async saveAttendanceRecord(roomId, date, record) {
        conflictState.savedRecord = plain(record);
        return record;
    },
    async deleteAttendanceRecord() {
        conflictState.savedRecord = null;
    },
    async loadRoomStockVersioned() {
        conflictState.stockReads += 1;
        return conflictState.stockReads === 1
            ? { value: 20, etag: '"v1"' }
            : { value: 19, etag: '"v2"' };
    },
    async setRoomStockIfMatch(roomId, value, etag) {
        conflictState.stockWrites += 1;
        if (conflictState.stockWrites === 1) {
            return { status: "conflict", value: 19, etag: '"v2"' };
        }
        assert.equal(etag, '"v2"', "Retry must use the refreshed ETag");
        assert.equal(value, 17, "Retry must apply the difference to the latest Room Stock value");
        return { status: "ok", value, etag: '"v3"' };
    },
    async appendAttendanceAudit() {
        conflictState.auditWrites += 1;
        return {};
    }
};

let idNumber = 0;
const attendanceContext = {
    window: {
        AttendanceRepository: null,
        TeacherService: teacherPolicy
    },
    Date,
    Math,
    Object,
    Array,
    Number,
    String,
    Error,
    Promise,
    setTimeout,
    console
};
vm.runInNewContext(attendanceCode, attendanceContext);
const AttendanceService = attendanceContext.window.AttendanceService.constructor;
const attendanceService = new AttendanceService(conflictRepository, teacherPolicy, {
    clock: () => new Date("2026-07-28T01:00:00.000Z"),
    idFactory: () => `id${++idNumber}`,
    sleep: async () => {},
    maxStockRetries: 6
});

const conflictSave = await attendanceService.saveAttendance(teacherSession, {
    date: "2026-07-28",
    data: { s1: "present", s2: "present" }
});
assert.equal(conflictSave.roomStockBefore, 19, "Conflict retry must use the newest Room Stock value");
assert.equal(conflictSave.roomStockAfter, 17, "Conflict retry must avoid losing the other writer's change");
assert.equal(conflictSave.stockAttempts, 2, "One conflict must require two conditional attempts");
assert.equal(conflictSave.stockConflictCount, 1, "Conflict count must be reported");
assert.equal(conflictState.stockReads, 2, "Conflict must trigger a fresh ETag read");
assert.equal(conflictState.auditWrites, 1, "Audit must be written only after Room Stock succeeds");
assert.equal(conflictSave.mainStockDelta, 0, "ETag retry must never change Main Stock");

const alwaysConflictRepository = {
    async loadAttendanceRecord() {
        return null;
    },
    async loadRoomAttendance() {
        return {};
    },
    async saveAttendanceRecord(roomId, date, record) {
        this.saved = plain(record);
        return record;
    },
    async deleteAttendanceRecord() {},
    async loadRoomStockVersioned() {
        return { value: 10, etag: '"same"' };
    },
    async setRoomStockIfMatch() {
        return { status: "conflict", value: 10, etag: '"same"' };
    },
    async appendAttendanceAudit() {
        throw new Error("Audit must not run before Room Stock succeeds.");
    }
};
const alwaysConflictService = new AttendanceService(alwaysConflictRepository, teacherPolicy, {
    clock: () => new Date("2026-07-28T01:00:00.000Z"),
    idFactory: () => "fixed",
    sleep: async () => {},
    maxStockRetries: 2
});

let partialError;
try {
    await alwaysConflictService.saveAttendance(teacherSession, {
        date: "2026-07-29",
        data: { s1: "present" }
    });
} catch (error) {
    partialError = error;
}
assert.equal(partialError?.code, "ROOM_STOCK_ADJUSTMENT_REQUIRED", "Exhausted conflicts must request a queued stock adjustment");
assert.equal(partialError.details.attendanceSaved, true, "Attendance must remain saved before stock retry is queued");
assert.equal(partialError.details.difference, 1, "Queued stock retry must preserve the original difference");
assert.equal(partialError.details.cause.code, "ROOM_STOCK_CONFLICT_RETRY_EXHAUSTED", "Partial error must retain the conflict cause");

const managerEvents = [];
const queuedAdjustments = [];
const partialService = {
    assertRoomAccess: teacherPolicy.assertRoomAccess,
    async saveAttendance() {
        throw partialError;
    },
    async deleteAttendance() {
        throw new Error("Not used");
    }
};
const managerContext = {
    window: {
        AttendanceService: partialService,
        AuthService: { getSession: () => teacherSession },
        SyncService: {
            queueRoomStockAdjustment(session, input) {
                queuedAdjustments.push(plain(input));
                return { ...input, type: "roomStockAdjust" };
            }
        },
        dispatchEvent: event => managerEvents.push(event)
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    Object,
    Error
};
vm.runInNewContext(managerCode, managerContext);
const AttendanceManager = managerContext.window.AttendanceManager.constructor;
const manager = new AttendanceManager(
    partialService,
    managerContext.window.AuthService,
    managerContext.window.SyncService
);
const queuedResult = await manager.save({ date: "2026-07-29" });
assert.equal(queuedResult.stockQueued, true, "Manager must queue the unresolved Room Stock difference");
assert.equal(queuedAdjustments.length, 1, "Manager must create one Room Stock adjustment queue entry");
assert.equal(queuedAdjustments[0].difference, 1, "Manager queue must preserve the stock difference");
assert.equal(manager.history[partialError.details.key].date, "2026-07-29", "Saved attendance must remain visible while stock waits for retry");
assert.equal(managerEvents.at(-1).name, "milkapp:attendance-stock-queued", "Manager must emit the partial-save event");

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
const storageContext = {
    window: { localStorage: memoryStorage },
    Date,
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    Map,
    console
};
vm.runInNewContext(storageCode, storageContext);
const QueueStorage = storageContext.window.QueueStorage.constructor;
const queueStorage = new QueueStorage(memoryStorage);
queueStorage.upsert({
    type: "attendance",
    key: "r1_2026-07-29",
    roomId: "r1",
    rec: alwaysConflictRepository.saved,
    baselinePresent: 0,
    queuedAt: 100
});

const syncAttendanceService = {
    async saveAttendance() {
        throw partialError;
    },
    async adjustRoomStock() {
        return { mainStockDelta: 0 };
    }
};
const syncContext = {
    window: {
        QueueStorage: queueStorage,
        AttendanceService: syncAttendanceService,
        TeacherService: teacherPolicy
    },
    Date,
    Math,
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(syncCode, syncContext);
const SyncService = syncContext.window.SyncService.constructor;
const syncService = new SyncService(queueStorage, syncAttendanceService, teacherPolicy, {
    clock: () => 1000
});
const flushResult = await syncService.flush(teacherSession);
assert.equal(flushResult.deferred, 1, "Partial attendance replay must be converted to a stock-only retry");
assert.equal(flushResult.remaining, 1, "Converted stock retry must remain queued");
assert.equal(queueStorage.snapshot()[0].type, "roomStockAdjust", "Attendance retry must become a Room Stock adjustment entry");
assert.equal(queueStorage.snapshot()[0].difference, 1, "Converted queue entry must preserve the stock difference");
assert.equal(queueStorage.snapshot()[0].referenceId, "r1_2026-07-29", "Converted queue entry must preserve the attendance reference");
assert.equal(flushResult.mainStockDelta, 0, "Cutover concurrency handling must never change Main Stock");

console.log("Cutover concurrency checks passed.");
