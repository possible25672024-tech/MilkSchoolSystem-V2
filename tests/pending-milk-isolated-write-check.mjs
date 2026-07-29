import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const serviceCode = read("modules/services/pendingMilkService.js");
const managerCode = read("modules/pending/pendingMilkManager.js");

assert.doesNotThrow(() => new vm.Script(serviceCode), "pendingMilkService.js must contain valid JavaScript");
assert.doesNotThrow(() => new vm.Script(managerCode), "pendingMilkManager.js must contain valid JavaScript");

const session = {
    role: "teacher",
    roomId: "isolated-pending-room",
    roomName: "ห้องทดสอบนมค้าง",
    teacher: "ครูทดสอบ"
};
const students = [
    { id: "s1", num: 1, name: "นักเรียนหนึ่ง" },
    { id: "s2", num: 2, name: "นักเรียนสอง" }
];
const attendance = {
    "isolated-pending-room_2026-08-03": {
        clsId: "isolated-pending-room",
        date: "2026-08-03",
        data: { s1: "absent", s2: "present" }
    },
    "isolated-pending-room_2026-08-04": {
        clsId: "isolated-pending-room",
        date: "2026-08-04",
        data: { s1: "absent", s2: "absent" }
    }
};
const pendingRecords = {};
let recordSequence = 0;
let createCount = 0;
let deleteCount = 0;
const repository = {
    async loadAttendanceDates(roomId, dates) {
        assert.equal(roomId, session.roomId, "Attendance reads must remain room-scoped");
        assert.deepEqual(plain(dates), [
            "2026-08-03",
            "2026-08-04",
            "2026-08-05",
            "2026-08-06",
            "2026-08-07"
        ]);
        return { ...attendance };
    },
    async loadRoomPendingRecords(roomId) {
        assert.equal(roomId, session.roomId, "Pending history reads must remain room-scoped");
        return { ...pendingRecords };
    },
    async loadPendingRecord(id) {
        return pendingRecords[id] || null;
    },
    async createPendingRecord(record) {
        createCount += 1;
        const id = `pending-${++recordSequence}`;
        pendingRecords[id] = { ...record };
        return { id, record };
    },
    async deletePendingRecord(id) {
        deleteCount += 1;
        delete pendingRecords[id];
        return null;
    }
};

let roomStock = 50;
const mainStock = 999;
let stockMode = "success";
let stockMutationCount = 0;
let auditWrites = [];
let idSequence = 0;
const sharedStock = {
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, session.roomId, "Room Stock mutation must remain room-scoped");
        if (stockMode === "fail") {
            const error = new Error("Isolated Room Stock failure.");
            error.code = "ROOM_STOCK_CONDITIONAL_WRITE_FAILED";
            throw error;
        }
        const before = roomStock;
        roomStock -= Number(difference);
        stockMutationCount += 1;
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
        return {
            id: `ledger-${++idSequence}`,
            timestamp: "2026-08-05T03:00:00.000Z",
            source: "teacher",
            ...input
        };
    },
    buildStockLog(input) {
        return {
            id: `stocklog-${idSequence}`,
            savedAt: "2026-08-05T03:00:00.000Z",
            qty: input.quantity,
            ...input
        };
    },
    async writeAuditWithRetry(ledger, stockLog) {
        auditWrites.push({ ledger: plain(ledger), stockLog: plain(stockLog) });
        return { ok: true, attempts: 1, error: null };
    }
};
const teacherService = {
    assertRoomAccess(activeSession, targetRoomId = null) {
        assert.equal(activeSession?.role, "teacher", "Pending Milk requires a Teacher session");
        const roomId = String(activeSession.roomId || "");
        if (targetRoomId && String(targetRoomId) !== roomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return roomId;
    }
};

const queuedStock = [];
const queuedAudit = [];
const syncService = {
    queueRoomStockAdjustment(activeSession, input) {
        teacherService.assertRoomAccess(activeSession, input.roomId);
        const entry = {
            type: "roomStockAdjust",
            key: input.key,
            roomId: input.roomId,
            difference: input.difference,
            referenceId: input.referenceId,
            roomName: input.roomName,
            date: input.date,
            operationType: input.operationType,
            note: input.note
        };
        queuedStock.push(entry);
        return entry;
    },
    queueAttendanceAudit(activeSession, input) {
        teacherService.assertRoomAccess(activeSession, input.roomId);
        const entry = { type: "attendanceAudit", ...input };
        queuedAudit.push(entry);
        return entry;
    }
};
const events = [];
const windowObject = {
    PendingMilkRepository: repository,
    TeacherService: teacherService,
    AttendanceService: sharedStock,
    AuthService: { getSession: () => session },
    TeacherManager: {
        getSnapshot() {
            return { students };
        }
    },
    SyncService: syncService,
    dispatchEvent(event) {
        events.push({ type: event.type, detail: event.detail });
    }
};
const context = {
    window: windowObject,
    CustomEvent: class CustomEvent {
        constructor(type, options) {
            this.type = type;
            this.detail = options?.detail;
        }
    },
    Date,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Set,
    Map,
    Error,
    Promise,
    console
};
vm.runInNewContext(serviceCode, context);
const PendingMilkService = context.window.PendingMilkService.constructor;
const service = new PendingMilkService(repository, teacherService, sharedStock, {
    clock: () => new Date("2026-08-05T03:00:00.000Z")
});
context.window.PendingMilkService = service;
vm.runInNewContext(managerCode, context);
const PendingMilkManager = context.window.PendingMilkManager.constructor;
const manager = new PendingMilkManager(
    service,
    context.window.AuthService,
    context.window.TeacherManager,
    syncService
);

const selectedPairs = [
    { studentId: "s1", date: "2026-08-04" },
    { studentId: "s2", date: "2026-08-04" }
];
const issued = await manager.issue({
    roomId: session.roomId,
    weekDate: "2026-08-05",
    selectedPairs,
    note: "isolated successful issue"
});
assert.equal(issued.quantity, 2, "Successful issue must deduct one box per selected student/date pair");
assert.equal(issued.roomStockBefore, 50, "Successful issue must report Room Stock baseline");
assert.equal(issued.roomStockAfter, 48, "Successful issue must deduct exactly two boxes");
assert.equal(roomStock, 48, "In-memory Room Stock must reflect successful issue exactly once");
assert.equal(issued.ledger.type, "PENDING", "Successful issue must create PENDING ledger type");
assert.equal(issued.ledger.quantity, -2, "Successful issue ledger must record a two-box deduction");
assert.equal(issued.stockLog.type, "OUT", "Successful issue must create OUT stockLog");
assert.equal(issued.record.totalBoxes, 2, "Legacy-compatible record must preserve totalBoxes");
assert.deepEqual(plain(issued.record.students), {
    s1: { name: "นักเรียนหนึ่ง", days: ["2026-08-04"] },
    s2: { name: "นักเรียนสอง", days: ["2026-08-04"] }
});
assert.equal(issued.record.signature, "", "Legacy signature field must remain compatible");
assert.deepEqual(plain(issued.record.signatures), {}, "Legacy signatures field must remain compatible");
assert.deepEqual(plain(issued.record.photos), [], "Legacy photos field must remain compatible");
assert.equal(issued.mainStockDelta, 0, "Successful issue must report zero Main Stock delta");
assert.equal(mainStock, 999, "Successful issue must not change Main Stock");

await assert.rejects(
    manager.issue({
        roomId: session.roomId,
        weekDate: "2026-08-05",
        selectedPairs: [{ studentId: "s1", date: "2026-08-04" }]
    }),
    error => error.code === "PENDING_SELECTION_INVALID",
    "Duplicate student/date issue must be blocked after the first write"
);

const removed = await manager.remove({ recordId: issued.id });
assert.equal(removed.restoredQuantity, 2, "Successful delete must restore the exact record quantity");
assert.equal(removed.roomStockBefore, 48, "Successful rollback must report the deducted Room Stock");
assert.equal(removed.roomStockAfter, 50, "Successful rollback must restore the baseline Room Stock");
assert.equal(roomStock, 50, "Issue then delete must return Room Stock to baseline");
assert.equal(removed.ledger.type, "ROLLBACK", "Successful delete must create ROLLBACK ledger type");
assert.equal(removed.ledger.quantity, 2, "Rollback ledger must record the restored quantity");
assert.equal(removed.stockLog.type, "IN", "Successful delete must create IN stockLog");
assert.equal(removed.mainStockDelta, 0, "Successful delete must report zero Main Stock delta");
assert.equal(mainStock, 999, "Successful delete must not change Main Stock");
assert.equal(auditWrites.length, 2, "Successful issue/delete must create one audit pair each");

stockMode = "fail";
const partialIssue = await manager.issue({
    roomId: session.roomId,
    weekDate: "2026-08-05",
    selectedPairs: [{ studentId: "s1", date: "2026-08-04" }],
    note: "isolated partial issue"
});
assert.equal(partialIssue.stockQueued, true, "Issue saved before stock failure must be converted to queued stock work");
assert.equal(partialIssue.operationType, "PENDING", "Partial issue queue must preserve PENDING operation type");
assert.equal(partialIssue.difference, 1, "Partial issue queue must deduct exactly one box later");
assert.equal(pendingRecords[partialIssue.recordId]?.totalBoxes, 1, "Partial issue must leave the saved legacy record available");
assert.equal(roomStock, 50, "Failed Room Stock adjustment must not change Room Stock before retry");
assert.equal(mainStock, 999, "Partial issue must not change Main Stock");
assert.equal(queuedStock.at(-1).operationType, "PENDING", "Queued issue retry must remain typed PENDING");
assert.match(queuedStock.at(-1).note, /จ่ายนมค้าง/, "Queued issue retry must retain a safe Pending note");

const partialDelete = await manager.remove({ recordId: partialIssue.recordId });
assert.equal(partialDelete.stockQueued, true, "Record deleted before stock failure must be converted to queued rollback work");
assert.equal(partialDelete.operationType, "ROLLBACK", "Partial delete queue must preserve ROLLBACK operation type");
assert.equal(partialDelete.difference, -1, "Partial delete queue must restore exactly one box later");
assert.equal(pendingRecords[partialIssue.recordId], undefined, "Partial delete must leave the record deleted before queued restoration");
assert.equal(roomStock, 50, "Failed rollback adjustment must not change Room Stock before retry");
assert.equal(mainStock, 999, "Partial delete must not change Main Stock");
assert.equal(queuedStock.at(-1).operationType, "ROLLBACK", "Queued delete retry must remain typed ROLLBACK");
assert.match(queuedStock.at(-1).note, /ลบรายการนมค้าง/, "Queued delete retry must retain a safe rollback note");

assert.equal(createCount, 2, "Test must create exactly one successful and one partial Pending record");
assert.equal(deleteCount, 2, "Test must delete exactly one successful and one partial Pending record");
assert.equal(stockMutationCount, 2, "Only successful issue/delete may mutate Room Stock in this isolated gate");
assert.equal(queuedStock.length, 2, "Partial issue/delete must create exactly two typed Room Stock retries");
assert.equal(queuedAudit.length, 0, "Successful audit writes must not create audit-only queue entries");
assert.ok(events.some(event => event.type === "milkapp:pending-issued"), "Manager must emit successful issue event");
assert.ok(events.some(event => event.type === "milkapp:pending-deleted"), "Manager must emit successful delete event");
assert.ok(events.some(event => event.type === "milkapp:pending-stock-queued"), "Manager must emit partial-save queue feedback");

console.log("Pending Milk isolated write checks passed.");
