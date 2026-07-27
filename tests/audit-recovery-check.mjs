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
const syncCode = read("modules/services/syncService.js");
const managerCode = read("modules/attendance/attendanceManager.js");

for (const [name, source] of [
    ["queueStorage.js", storageCode],
    ["syncService.js", syncCode],
    ["attendanceManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(storageCode.includes('type === "attendanceAudit"'), "QueueStorage must persist attendance audit entries");
assert.ok(syncCode.includes("queueAttendanceAudit"), "SyncService must expose attendance audit queueing");
assert.ok(syncCode.includes('entry.type === "attendanceAudit"'), "SyncService must replay attendance audit entries");
assert.ok(managerCode.includes("queueAuditIfNeeded"), "AttendanceManager must detect audit failures after stock success");

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

const teacherSession = {
    role: "teacher",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ"
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

const ledger = {
    id: "ledger1",
    timestamp: "2026-07-28T02:00:00.000Z",
    roomId: "r1",
    type: "ATTENDANCE",
    quantity: -2,
    stockBefore: 20,
    stockAfter: 18,
    source: "teacher",
    user: "ครูทดสอบ",
    referenceId: "r1_2026-07-28"
};
const stockLog = {
    id: "log1",
    type: "OUT",
    roomId: "r1",
    roomName: "อ.3-1",
    date: "2026-07-28",
    qty: 2,
    balanceAfter: 18,
    note: "หักสต็อกจากการเช็คดื่มนมรายวัน",
    savedAt: "2026-07-28T02:00:00.000Z"
};

const auditFailureResult = {
    key: "r1_2026-07-28",
    record: {
        clsId: "r1",
        roomName: "อ.3-1",
        date: "2026-07-28",
        data: { s1: "present", s2: "present" }
    },
    roomId: "r1",
    roomStockBefore: 20,
    roomStockAfter: 18,
    ledger,
    stockLog,
    audit: {
        ok: false,
        attempts: 3,
        error: {
            code: "ATTENDANCE_AUDIT_WRITE_FAILED",
            message: "Temporary audit failure"
        }
    },
    mainStockDelta: 0
};

const auditWrites = [];
const attendanceRepository = {
    async appendAttendanceAudit(nextLedger, nextStockLog) {
        auditWrites.push({
            ledger: plain(nextLedger),
            stockLog: plain(nextStockLog)
        });
        return { ledger: nextLedger, stockLog: nextStockLog };
    }
};
const attendanceService = {
    assertRoomAccess: teacherPolicy.assertRoomAccess,
    async saveAttendance() {
        return plain(auditFailureResult);
    },
    async deleteAttendance() {
        return {
            ...plain(auditFailureResult),
            deletedRecord: plain(auditFailureResult.record)
        };
    },
    async adjustRoomStock() {
        return { mainStockDelta: 0 };
    }
};

const syncContext = {
    window: {
        QueueStorage: queueStorage,
        AttendanceService: attendanceService,
        AttendanceRepository: attendanceRepository,
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
const syncService = new SyncService(
    queueStorage,
    attendanceService,
    teacherPolicy,
    {
        attendanceRepository,
        clock: () => 1000
    }
);

const managerEvents = [];
const managerContext = {
    window: {
        AttendanceService: attendanceService,
        AuthService: { getSession: () => teacherSession },
        SyncService: syncService,
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
    attendanceService,
    managerContext.window.AuthService,
    syncService
);

const saved = await manager.save({ date: "2026-07-28" });
assert.equal(saved.auditQueued, true, "Manager must persist audit recovery after stock succeeds");
assert.equal(saved.mainStockDelta, 0, "Audit recovery must never change Main Stock");
assert.equal(queueStorage.count(), 1, "One audit recovery entry must be queued");
assert.equal(queueStorage.snapshot()[0].type, "attendanceAudit", "Queued entry must be audit-only");
assert.equal(queueStorage.snapshot()[0].ledger.id, "ledger1", "Audit queue must preserve the stable ledger id");
assert.equal(queueStorage.snapshot()[0].stockLog.id, "log1", "Audit queue must preserve the stable stockLog id");
assert.equal(managerEvents.at(-1).name, "milkapp:attendance-audit-queued", "Manager must emit the audit queued event");

const firstFlush = await syncService.flush(teacherSession);
assert.equal(firstFlush.succeeded, 1, "Successful audit replay must be counted");
assert.equal(firstFlush.remaining, 0, "Successful audit replay must remove the queue entry");
assert.equal(auditWrites.length, 1, "Audit replay must write once");
assert.equal(auditWrites[0].ledger.id, "ledger1", "Audit replay must reuse the original ledger id");
assert.equal(auditWrites[0].stockLog.id, "log1", "Audit replay must reuse the original stockLog id");
assert.equal(firstFlush.mainStockDelta, 0, "Audit replay must never change Main Stock");

queueStorage.upsert({
    type: "roomStockAdjust",
    key: "stockadj_r1_2026-07-29",
    roomId: "r1",
    difference: 1,
    referenceId: "r1_2026-07-29",
    roomName: "อ.3-1",
    date: "2026-07-29",
    queuedAt: 200
});
const stockAdjustmentAuditFailure = {
    roomId: "r1",
    difference: 1,
    referenceId: "r1_2026-07-29",
    roomStockBefore: 18,
    roomStockAfter: 17,
    ledger: { ...ledger, id: "ledger2", referenceId: "r1_2026-07-29", stockBefore: 18, stockAfter: 17 },
    stockLog: { ...stockLog, id: "log2", date: "2026-07-29", balanceAfter: 17, qty: 1 },
    audit: {
        ok: false,
        attempts: 3,
        error: {
            code: "ATTENDANCE_AUDIT_WRITE_FAILED",
            message: "Temporary audit failure"
        }
    },
    mainStockDelta: 0
};
attendanceService.adjustRoomStock = async () => plain(stockAdjustmentAuditFailure);

const deferredFlush = await syncService.flush(teacherSession);
assert.equal(deferredFlush.deferred, 1, "Stock success with audit failure must become an audit-only retry");
assert.equal(deferredFlush.remaining, 1, "Converted audit retry must remain queued");
assert.equal(queueStorage.snapshot()[0].type, "attendanceAudit", "Room Stock queue must convert to audit-only after stock succeeds");
assert.equal(queueStorage.snapshot()[0].ledger.id, "ledger2", "Converted audit queue must preserve the new ledger id");
assert.equal(queueStorage.snapshot()[0].referenceId, "r1_2026-07-29", "Converted audit queue must preserve the operation reference");
assert.equal(deferredFlush.mainStockDelta, 0, "Stock-to-audit conversion must never change Main Stock");

console.log("Audit recovery checks passed.");
