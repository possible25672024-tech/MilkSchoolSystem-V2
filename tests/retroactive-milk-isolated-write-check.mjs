import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const serviceCode = read("modules/services/retroactiveMilkService.js");
const managerCode = read("modules/retroactive/retroactiveMilkManager.js");

assert.doesNotThrow(() => new vm.Script(serviceCode), "retroactiveMilkService.js must contain valid JavaScript");
assert.doesNotThrow(() => new vm.Script(managerCode), "retroactiveMilkManager.js must contain valid JavaScript");

const session = {
    role: "teacher",
    roomId: "isolated-retro-room",
    roomName: "ห้องย้อนหลังทดสอบ",
    teacher: "ครูทดสอบ"
};
const students = [
    { id: "s1", num: 1, name: "นักเรียนหนึ่ง" },
    { id: "s2", num: 2, name: "นักเรียนสอง" },
    { id: "s3", num: 3, name: "นักเรียนสาม" }
];

const records = {};
let recordSequence = 0;
let createCount = 0;
let deleteCount = 0;
const repository = {
    async loadRoomRecords(roomId) {
        assert.equal(roomId, session.roomId, "Retroactive history reads must remain room-scoped");
        return { ...records };
    },
    async loadRecord(id) {
        return records[id] || null;
    },
    async createRecord(record) {
        createCount += 1;
        const id = `retro-${++recordSequence}`;
        records[id] = { ...record };
        return { id, record };
    },
    async deleteRecord(id) {
        deleteCount += 1;
        delete records[id];
        return null;
    }
};

let roomStock = 100;
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
            timestamp: "2026-08-10T03:00:00.000Z",
            source: "teacher",
            ...input
        };
    },
    buildStockLog(input) {
        return {
            id: `stocklog-${idSequence}`,
            savedAt: "2026-08-10T03:00:00.000Z",
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
        assert.equal(activeSession?.role, "teacher", "Retroactive Milk requires a Teacher session");
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
    RetroactiveMilkRepository: repository,
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
const RetroactiveMilkService = context.window.RetroactiveMilkService.constructor;
const service = new RetroactiveMilkService(repository, teacherService, sharedStock, {
    clock: () => new Date("2026-08-10T03:00:00.000Z")
});
context.window.RetroactiveMilkService = service;
vm.runInNewContext(managerCode, context);
const RetroactiveMilkManager = context.window.RetroactiveMilkManager.constructor;
const manager = new RetroactiveMilkManager(
    service,
    context.window.AuthService,
    context.window.TeacherManager,
    syncService
);

const successfulInput = {
    roomId: session.roomId,
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-10",
    retroStart: "2026-08-07",
    retroEnd: "2026-08-10",
    note: "isolated successful issue"
};
const issued = await manager.issue(successfulInput);
assert.equal(issued.quantity, 6, "Three students across two weekdays must deduct six boxes");
assert.equal(issued.roomStockBefore, 100, "Successful issue must report Room Stock baseline");
assert.equal(issued.roomStockAfter, 94, "Successful issue must deduct exactly six boxes");
assert.equal(roomStock, 94, "In-memory Room Stock must reflect successful issue exactly once");
assert.equal(issued.ledger.type, "RETRO", "Successful issue must create RETRO ledger type");
assert.equal(issued.ledger.quantity, -6, "RETRO ledger must record a six-box deduction");
assert.equal(issued.stockLog.type, "OUT", "Successful issue must create OUT stockLog");
assert.equal(issued.stockLog.quantity, 6, "Successful issue stockLog must preserve exact quantity");
assert.equal(issued.record.studentCount, 3, "Record must preserve authenticated-room student count");
assert.equal(issued.record.days, 2, "Record must preserve weekday count");
assert.equal(issued.record.totalBoxes, 6, "Record must preserve totalBoxes");
assert.equal(issued.record.debtBoxes, 6, "Record must preserve debtBoxes");
assert.equal(issued.record.status, "debt", "Record must preserve debt status");
assert.equal(issued.record.signature, "", "Legacy signature field must remain compatible");
assert.deepEqual(plain(issued.record.signatures), {}, "Legacy signatures field must remain compatible");
assert.deepEqual(plain(issued.record.photos), [], "Legacy photos field must remain compatible");
assert.equal(issued.mainStockDelta, 0, "Successful issue must report zero Main Stock delta");
assert.equal(mainStock, 999, "Successful issue must not change Main Stock");

await assert.rejects(
    manager.issue({ ...successfulInput, issueDate: "2026-08-11" }),
    error => error.code === "RETRO_DUPLICATE_RANGE",
    "Exact academic-period/range duplicate must be blocked"
);
assert.equal(roomStock, 94, "Duplicate rejection must not mutate Room Stock");

const removed = await manager.remove({ recordId: issued.id });
assert.equal(removed.quantity, 6, "Successful delete must restore the exact record quantity");
assert.equal(removed.roomStockBefore, 94, "Successful rollback must report deducted Room Stock");
assert.equal(removed.roomStockAfter, 100, "Successful rollback must restore baseline Room Stock");
assert.equal(roomStock, 100, "Issue then delete must return Room Stock to baseline");
assert.equal(removed.ledger.type, "ROLLBACK", "Successful delete must create ROLLBACK ledger type");
assert.equal(removed.ledger.quantity, 6, "Rollback ledger must record restored quantity");
assert.equal(removed.stockLog.type, "IN", "Successful delete must create IN stockLog");
assert.equal(removed.stockLog.quantity, 6, "Rollback stockLog must preserve exact quantity");
assert.equal(removed.mainStockDelta, 0, "Successful delete must report zero Main Stock delta");
assert.equal(mainStock, 999, "Successful delete must not change Main Stock");
assert.equal(auditWrites.length, 2, "Successful issue/delete must create one audit pair each");

stockMode = "fail";
const partialIssue = await manager.issue({
    roomId: session.roomId,
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-11",
    retroStart: "2026-08-11",
    retroEnd: "2026-08-11",
    note: "isolated partial issue"
});
assert.equal(partialIssue.stockQueued, true, "Saved record before stock failure must convert to queued stock work");
assert.equal(partialIssue.operationType, "RETRO", "Partial issue queue must preserve RETRO operation type");
assert.equal(partialIssue.difference, 3, "Partial issue queue must deduct three boxes later");
assert.equal(records[partialIssue.recordId]?.totalBoxes, 3, "Partial issue must leave saved compatible record available");
assert.equal(roomStock, 100, "Failed Room Stock adjustment must not change Room Stock before retry");
assert.equal(mainStock, 999, "Partial issue must not change Main Stock");
assert.equal(queuedStock.at(-1).operationType, "RETRO", "Queued issue retry must remain typed RETRO");
assert.match(queuedStock.at(-1).note, /จ่ายนมย้อนหลัง/, "Queued issue retry must retain safe Retroactive note");

const partialDelete = await manager.remove({ recordId: partialIssue.recordId });
assert.equal(partialDelete.stockQueued, true, "Deleted record before stock failure must convert to queued rollback work");
assert.equal(partialDelete.operationType, "ROLLBACK", "Partial delete queue must preserve ROLLBACK operation type");
assert.equal(partialDelete.difference, -3, "Partial delete queue must restore three boxes later");
assert.equal(records[partialIssue.recordId], undefined, "Partial delete must leave record deleted before queued restoration");
assert.equal(roomStock, 100, "Failed rollback adjustment must not change Room Stock before retry");
assert.equal(mainStock, 999, "Partial delete must not change Main Stock");
assert.equal(queuedStock.at(-1).operationType, "ROLLBACK", "Queued delete retry must remain typed ROLLBACK");
assert.match(queuedStock.at(-1).note, /ลบรายการนมย้อนหลัง/, "Queued delete retry must retain safe rollback note");

assert.equal(createCount, 2, "Test must create exactly one successful and one partial Retroactive record");
assert.equal(deleteCount, 2, "Test must delete exactly one successful and one partial Retroactive record");
assert.equal(stockMutationCount, 2, "Only successful issue/delete may mutate Room Stock in this isolated gate");
assert.equal(queuedStock.length, 2, "Partial issue/delete must create exactly two typed Room Stock retries");
assert.equal(queuedAudit.length, 0, "Successful audit writes must not create audit-only queue entries");
assert.ok(events.some(event => event.type === "milkapp:retro-issued"), "Manager must emit successful issue event");
assert.ok(events.some(event => event.type === "milkapp:retro-deleted"), "Manager must emit successful delete event");
assert.ok(events.some(event => event.type === "milkapp:retro-stock-queued"), "Manager must emit partial-save queue feedback");

console.log("Retroactive Milk isolated write checks passed.");
