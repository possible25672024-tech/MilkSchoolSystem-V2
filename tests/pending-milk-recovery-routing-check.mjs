import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const queueCode = read("modules/storage/queueStorage.js");
const syncCode = read("modules/services/syncService.js");
const managerCode = read("modules/sync/syncManager.js");
const viewCode = read("modules/sync/syncView.js");

for (const [name, source] of [
    ["queueStorage.js", queueCode],
    ["syncService.js", syncCode],
    ["syncManager.js", managerCode],
    ["syncView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(syncCode.includes('operationType === "ATTENDANCE"'), "Legacy Attendance retries must retain the existing route");
assert.ok(syncCode.includes('operationType !== "PENDING" && operationType !== "ROLLBACK"'), "Typed retries must allow only PENDING and ROLLBACK");
assert.ok(viewCode.includes('PENDING: "หักสต็อกนมค้างที่รอซิงก์"'), "Queue UI must label Pending Milk retries safely");
assert.ok(viewCode.includes('ROLLBACK: "คืนสต็อกนมค้างที่รอซิงก์"'), "Queue UI must label Pending Milk rollback retries safely");

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
}

const session = {
    role: "teacher",
    roomId: "isolated-pending-room",
    roomName: "ห้องทดสอบนมค้าง",
    teacher: "ครูทดสอบ"
};
const teacherService = {
    assertRoomAccess(activeSession, targetRoomId = null) {
        assert.equal(activeSession?.role, "teacher", "A Teacher session is required");
        const roomId = String(activeSession.roomId || "");
        if (targetRoomId && String(targetRoomId) !== roomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return roomId;
    }
};

const memoryStorage = new MemoryStorage();
const queueContext = {
    window: { localStorage: memoryStorage },
    Date,
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    Map
};
vm.runInNewContext(queueCode, queueContext);
const QueueStorage = queueContext.window.QueueStorage.constructor;
const queueStorage = new QueueStorage(memoryStorage);

queueStorage.upsert({
    type: "roomStockAdjust",
    key: "stockadj_legacy-attendance",
    roomId: session.roomId,
    diff: 1,
    referenceId: "legacy-attendance",
    roomName: session.roomName,
    date: "2026-08-03",
    queuedAt: 10
});
const legacyEntry = queueStorage.get("stockadj_legacy-attendance");
assert.equal(legacyEntry.operationType, "ATTENDANCE", "Legacy retry entries must default to ATTENDANCE");
assert.equal(legacyEntry.difference, 1, "Legacy diff alias must remain compatible");
queueStorage.remove(legacyEntry.key);

let roomStock = 50;
const mainStock = 999;
let stockMutationCount = 0;
let idSequence = 0;
let pendingAuditShouldFail = true;
const builtLedgers = [];
const builtStockLogs = [];
const sharedStockService = {
    async saveAttendance() {
        throw new Error("Attendance replay is not expected in this isolated test.");
    },
    async adjustRoomStock() {
        throw new Error("Typed Pending Milk retries must not use the Attendance-only adjustment route.");
    },
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, session.roomId, "Typed retry must remain room-scoped");
        stockMutationCount += 1;
        const before = roomStock;
        roomStock -= Number(difference);
        return {
            roomId,
            difference,
            roomStockBefore: before,
            roomStockAfter: roomStock,
            attempts: 1,
            conflictCount: 0,
            etag: `etag-${stockMutationCount}`
        };
    },
    buildLedgerEntry(input) {
        const ledger = {
            id: `ledger-${++idSequence}`,
            timestamp: "2026-08-03T08:00:00.000Z",
            source: "teacher",
            ...input
        };
        builtLedgers.push(ledger);
        return ledger;
    },
    buildStockLog(input) {
        const stockLog = {
            id: `stocklog-${idSequence}`,
            savedAt: "2026-08-03T08:00:00.000Z",
            qty: input.quantity,
            ...input
        };
        builtStockLogs.push(stockLog);
        return stockLog;
    },
    async writeAuditWithRetry(ledger) {
        if (ledger.type === "PENDING" && pendingAuditShouldFail) {
            pendingAuditShouldFail = false;
            return {
                ok: false,
                attempts: 3,
                error: {
                    code: "PENDING_AUDIT_WRITE_FAILED",
                    message: "Isolated Pending audit failure."
                }
            };
        }
        return { ok: true, attempts: 1, error: null };
    }
};

const writtenAudits = [];
const attendanceRepository = {
    async appendAttendanceAudit(ledger, stockLog) {
        writtenAudits.push({ ledger: plain(ledger), stockLog: plain(stockLog) });
        return true;
    }
};
let clockValue = 10000;
const syncContext = {
    window: {
        QueueStorage: queueStorage,
        AttendanceService: sharedStockService,
        TeacherService: teacherService,
        AttendanceRepository: attendanceRepository
    },
    Date,
    Math,
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    Promise,
    Map
};
vm.runInNewContext(syncCode, syncContext);
const SyncService = syncContext.window.SyncService.constructor;
const syncService = new SyncService(queueStorage, sharedStockService, teacherService, {
    attendanceRepository,
    clock: () => clockValue,
    backoffSteps: [5000, 10000, 20000, 40000, 60000]
});

const pendingEntry = syncService.queueRoomStockAdjustment(session, {
    roomId: session.roomId,
    difference: 2,
    referenceId: "pending-record-1",
    roomName: session.roomName,
    date: "2026-08-03",
    operationType: "PENDING",
    note: "หักสต็อกจากการจ่ายนมค้าง (ซิงก์ค้าง)",
    queuedAt: 100
});
const rollbackEntry = syncService.queueRoomStockAdjustment(session, {
    roomId: session.roomId,
    difference: -1,
    referenceId: "pending-record-2",
    roomName: session.roomName,
    date: "2026-08-03",
    operationType: "ROLLBACK",
    note: "คืนสต็อกจากการลบรายการนมค้าง (ซิงก์ค้าง)",
    queuedAt: 101
});

assert.equal(pendingEntry.operationType, "PENDING", "Pending retry must preserve PENDING operation type");
assert.equal(rollbackEntry.operationType, "ROLLBACK", "Delete retry must preserve ROLLBACK operation type");
assert.match(pendingEntry.note, /จ่ายนมค้าง/, "Pending retry must preserve safe Pending note metadata");
assert.match(rollbackEntry.note, /ลบรายการนมค้าง/, "Rollback retry must preserve safe rollback note metadata");

const managerContext = {
    window: {
        SyncService: syncService,
        AuthService: { getSession: () => session },
        navigator: { onLine: false },
        setTimeout: () => 1,
        clearTimeout: () => {},
        setInterval: () => 1,
        clearInterval: () => {}
    },
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
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
vm.runInNewContext(managerCode, managerContext);
const SyncManager = managerContext.window.SyncManager.constructor;
const manager = new SyncManager(
    syncService,
    managerContext.window.AuthService,
    {
        eventTarget: new FakeEventTarget(),
        network: managerContext.window.navigator,
        setTimeoutFn: () => 1,
        clearTimeoutFn() {},
        setIntervalFn: () => 1,
        clearIntervalFn() {}
    }
);
const safeItems = manager.getStatus().queueItems;
assert.equal(safeItems.length, 2, "Queue UI boundary must expose both typed retries safely");
assert.equal(safeItems[0].operationType, "PENDING", "Safe summary must preserve PENDING operation type");
assert.equal(safeItems[1].operationType, "ROLLBACK", "Safe summary must preserve ROLLBACK operation type");
assert.match(safeItems[0].note, /จ่ายนมค้าง/, "Safe summary must include only the reviewed Pending note");
assert.ok(!JSON.stringify(safeItems).includes("students"), "Safe typed summaries must not expose student payloads");

const firstSummary = await syncService.flush(session);
assert.equal(firstSummary.processed, 2, "First flush must process both typed retries");
assert.equal(firstSummary.succeeded, 1, "Rollback retry with successful audit must complete");
assert.equal(firstSummary.deferred, 1, "Pending retry with failed audit must convert to audit-only work");
assert.equal(firstSummary.remaining, 1, "Only the audit-only retry must remain");
assert.equal(firstSummary.mainStockDelta, 0, "Typed retries must report zero Main Stock delta");
assert.equal(mainStock, 999, "Main Stock must remain unchanged");
assert.equal(roomStock, 49, "Pending deduction and rollback restoration must apply exactly once");
assert.equal(stockMutationCount, 2, "Each typed Room Stock retry must mutate Room Stock exactly once");

assert.equal(builtLedgers[0].type, "PENDING", "Pending retry must create PENDING ledger type");
assert.equal(builtLedgers[0].quantity, -2, "Pending retry ledger quantity must deduct exactly two boxes");
assert.equal(builtStockLogs[0].type, "OUT", "Pending retry must create OUT stockLog");
assert.match(builtStockLogs[0].note, /จ่ายนมค้าง/, "Pending stockLog must retain Pending-specific note");
assert.equal(builtLedgers[1].type, "ROLLBACK", "Delete retry must create ROLLBACK ledger type");
assert.equal(builtLedgers[1].quantity, 1, "Rollback retry ledger quantity must restore exactly one box");
assert.equal(builtStockLogs[1].type, "IN", "Rollback retry must create IN stockLog");
assert.match(builtStockLogs[1].note, /ลบรายการนมค้าง/, "Rollback stockLog must retain rollback-specific note");

const auditOnlyEntry = queueStorage.snapshot()[0];
assert.equal(auditOnlyEntry.type, "attendanceAudit", "Failed Pending audit must convert to audit-only queue work");
assert.equal(auditOnlyEntry.ledger.type, "PENDING", "Audit-only entry must preserve PENDING ledger type");
assert.equal(auditOnlyEntry.stockLog.type, "OUT", "Audit-only entry must preserve Pending OUT stockLog");

clockValue = 20000;
const secondSummary = await syncService.flush(session);
assert.equal(secondSummary.succeeded, 1, "Audit-only retry must complete independently");
assert.equal(secondSummary.remaining, 0, "Successful audit-only retry must clear the queue");
assert.equal(secondSummary.mainStockDelta, 0, "Audit-only retry must report zero Main Stock delta");
assert.equal(stockMutationCount, 2, "Audit-only retry must never repeat Room Stock mutation");
assert.equal(roomStock, 49, "Audit-only retry must leave Room Stock unchanged");
assert.equal(mainStock, 999, "Audit-only retry must leave Main Stock unchanged");
assert.equal(writtenAudits.length, 1, "Audit-only retry must write the preserved audit exactly once");
assert.equal(writtenAudits[0].ledger.type, "PENDING", "Persisted audit must retain PENDING ledger type");

console.log("Pending Milk recovery routing checks passed.");
