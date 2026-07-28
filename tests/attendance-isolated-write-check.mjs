import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const clone = value => JSON.parse(JSON.stringify(value));

const serviceCode = read("modules/services/attendanceService.js");
const managerCode = read("modules/attendance/attendanceManager.js");

assert.doesNotThrow(() => new vm.Script(serviceCode), "attendanceService.js must contain valid JavaScript");
assert.doesNotThrow(() => new vm.Script(managerCode), "attendanceManager.js must contain valid JavaScript");

const teacherSession = {
    role: "teacher",
    roomId: "isolated-room",
    classId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    teacher: "ครูทดสอบอัตโนมัติ"
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

function createState(roomStock = 50, mainStock = 999) {
    return {
        attendance: {},
        roomStock: { "isolated-room": roomStock },
        roomStockVersion: { "isolated-room": 0 },
        mainStock,
        stockTransactions: {},
        stockLog: {},
        mutations: []
    };
}

function createRepository(state, options = {}) {
    return {
        async loadAttendanceRecord(roomId, date) {
            return state.attendance[`${roomId}_${date}`] || null;
        },
        async saveAttendanceRecord(roomId, date, record) {
            const key = `${roomId}_${date}`;
            state.attendance[key] = clone(record);
            state.mutations.push({ type: "attendance-set", key });
            return record;
        },
        async deleteAttendanceRecord(roomId, date) {
            const key = `${roomId}_${date}`;
            delete state.attendance[key];
            state.mutations.push({ type: "attendance-delete", key });
            return null;
        },
        async loadRoomStockVersioned(roomId) {
            return {
                value: state.roomStock[roomId] ?? 0,
                etag: `"v${state.roomStockVersion[roomId] || 0}"`
            };
        },
        async setRoomStockIfMatch(roomId, value, etag) {
            if (options.failStockWrite) {
                const error = new Error("Simulated isolated Room Stock failure.");
                error.code = "SIMULATED_STOCK_FAILURE";
                throw error;
            }

            const currentEtag = `"v${state.roomStockVersion[roomId] || 0}"`;
            if (etag !== currentEtag) {
                return { status: "conflict", value: state.roomStock[roomId] };
            }

            state.roomStock[roomId] = value;
            state.roomStockVersion[roomId] = (state.roomStockVersion[roomId] || 0) + 1;
            state.mutations.push({ type: "room-stock-cas", roomId, value, etag });
            return {
                status: "ok",
                value,
                etag: `"v${state.roomStockVersion[roomId]}"`
            };
        },
        async appendAttendanceAudit(ledger, stockLog) {
            if (ledger?.id) {
                state.stockTransactions[ledger.id] = clone(ledger);
            }
            if (stockLog?.id) {
                state.stockLog[stockLog.id] = clone(stockLog);
            }
            state.mutations.push({
                type: "audit",
                ledgerId: ledger?.id || null,
                stockLogId: stockLog?.id || null
            });
            return { ledger, stockLog };
        }
    };
}

function createRuntime(repository, queueEntries = []) {
    let idNumber = 0;
    const emittedEvents = [];
    const authService = {
        getSession() {
            return teacherSession;
        }
    };
    const syncService = {
        queueRoomStockAdjustment(session, input) {
            const entry = {
                id: input.key,
                type: "room-stock-adjustment",
                roomId: input.roomId,
                difference: input.difference,
                referenceId: input.referenceId,
                sessionRoomId: session.roomId
            };
            queueEntries.push(entry);
            return entry;
        },
        queueAttendanceAudit() {
            throw new Error("Audit queue was not expected in this isolated scenario.");
        }
    };

    class CustomEvent {
        constructor(type, options = {}) {
            this.type = type;
            this.detail = options.detail;
        }
    }

    const context = {
        window: {
            AttendanceRepository: repository,
            TeacherService: teacherPolicy,
            AttendanceService: null,
            AuthService: authService,
            SyncService: syncService,
            dispatchEvent(event) {
                emittedEvents.push({ type: event.type, detail: event.detail });
                return true;
            }
        },
        CustomEvent,
        console,
        Date,
        Math,
        Object,
        Array,
        Number,
        String,
        Error,
        Promise,
        setTimeout
    };

    vm.runInNewContext(serviceCode, context);
    const AttendanceService = context.window.AttendanceService.constructor;
    const service = new AttendanceService(repository, teacherPolicy, {
        clock: () => new Date("2026-07-28T06:00:00.000Z"),
        idFactory: () => `isolated-${++idNumber}`,
        sleep: async () => {},
        maxStockRetries: 2,
        auditRetries: 1
    });
    context.window.AttendanceService = service;

    vm.runInNewContext(managerCode, context);
    const AttendanceManager = context.window.AttendanceManager.constructor;
    const manager = new AttendanceManager(service, authService, syncService);

    return { service, manager, emittedEvents };
}

const state = createState();
const queueEntries = [];
const runtime = createRuntime(createRepository(state), queueEntries);
const date = "2026-07-28";
const key = `isolated-room_${date}`;

const createResult = await runtime.manager.save({
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    date,
    year: "2569",
    term: "1",
    data: {
        s1: "present",
        s2: "present",
        s3: "present",
        s4: "absent",
        s5: "absent"
    },
    notes: { s4: "ทดสอบลา" },
    photos: ["isolated-photo"],
    signature: "isolated-signature"
});

assert.equal(createResult.key, key, "Create must preserve the compatible roomId_date key");
assert.equal(createResult.presentDifference, 3, "Create must deduct exactly the present count");
assert.equal(createResult.roomStockBefore, 50, "Create must begin from isolated Room Stock 50");
assert.equal(createResult.roomStockAfter, 47, "Create must reduce Room Stock by 3");
assert.equal(state.roomStock["isolated-room"], 47, "Isolated state must persist the create deduction");
assert.equal(state.mainStock, 999, "Create must leave Main Stock unchanged");
assert.equal(createResult.mainStockDelta, 0, "Create result must report zero Main Stock delta");
assert.equal(createResult.ledger.type, "ATTENDANCE", "Create must write an ATTENDANCE ledger entry");
assert.equal(createResult.ledger.quantity, -3, "Create ledger must record consumption as -3");
assert.equal(createResult.stockLog.type, "OUT", "Create stockLog must record OUT");
assert.equal(createResult.stockLog.qty, 3, "Create stockLog must record quantity 3");
assert.equal(state.attendance[key].clsId, "isolated-room", "Create must preserve clsId compatibility");
assert.equal(state.attendance[key].date, date, "Create must preserve the selected date");
assert.deepEqual(state.attendance[key].photos, ["isolated-photo"], "Create must preserve compatible photos");
assert.equal(state.attendance[key].signature, "isolated-signature", "Create must preserve compatible signature");

const increaseResult = await runtime.manager.save({
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    date,
    year: "2569",
    term: "1",
    data: {
        s1: "present",
        s2: "present",
        s3: "present",
        s4: "present",
        s5: "present"
    },
    photos: createResult.record.photos,
    signature: createResult.record.signature,
    savedAt: createResult.record.savedAt
});

assert.equal(increaseResult.previousPresent, 3, "Increase edit must use the previous present count");
assert.equal(increaseResult.presentDifference, 2, "Increase edit must deduct only the increase");
assert.equal(increaseResult.roomStockBefore, 47, "Increase edit must start from current Room Stock");
assert.equal(increaseResult.roomStockAfter, 45, "Increase edit must deduct 2 additional boxes");
assert.equal(increaseResult.ledger.quantity, -2, "Increase edit ledger must record only -2");
assert.equal(increaseResult.stockLog.type, "OUT", "Increase edit stockLog must record OUT");
assert.equal(state.mainStock, 999, "Increase edit must leave Main Stock unchanged");

const decreaseResult = await runtime.manager.save({
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    date,
    year: "2569",
    term: "1",
    data: {
        s1: "present",
        s2: "present",
        s3: "absent",
        s4: "absent",
        s5: "absent"
    },
    photos: increaseResult.record.photos,
    signature: increaseResult.record.signature,
    savedAt: increaseResult.record.savedAt
});

assert.equal(decreaseResult.previousPresent, 5, "Decrease edit must use the latest present count");
assert.equal(decreaseResult.presentDifference, -3, "Decrease edit must restore only the decrease");
assert.equal(decreaseResult.roomStockBefore, 45, "Decrease edit must start from latest Room Stock");
assert.equal(decreaseResult.roomStockAfter, 48, "Decrease edit must restore 3 boxes");
assert.equal(decreaseResult.ledger.quantity, 3, "Decrease edit ledger must record restoration as +3");
assert.equal(decreaseResult.stockLog.type, "IN", "Decrease edit stockLog must record IN");
assert.equal(decreaseResult.stockLog.qty, 3, "Decrease edit stockLog must record quantity 3");
assert.equal(state.mainStock, 999, "Decrease edit must leave Main Stock unchanged");

const deleteResult = await runtime.manager.remove({
    roomId: "isolated-room",
    date
});

assert.equal(deleteResult.restoredQuantity, 2, "Delete must restore the latest present count");
assert.equal(deleteResult.roomStockBefore, 48, "Delete must start from the latest Room Stock");
assert.equal(deleteResult.roomStockAfter, 50, "Delete must restore isolated Room Stock to its baseline");
assert.equal(state.roomStock["isolated-room"], 50, "Delete must persist the full Room Stock restoration");
assert.equal(state.attendance[key], undefined, "Delete must remove the exact Attendance key");
assert.equal(deleteResult.ledger.type, "ROLLBACK", "Delete must write a ROLLBACK ledger entry");
assert.equal(deleteResult.ledger.quantity, 2, "Delete ledger must restore 2 boxes");
assert.equal(deleteResult.stockLog.type, "IN", "Delete stockLog must record IN");
assert.equal(state.mainStock, 999, "Delete must leave Main Stock unchanged");
assert.equal(deleteResult.mainStockDelta, 0, "Delete result must report zero Main Stock delta");
assert.equal(Object.keys(state.stockTransactions).length, 4, "Create, two edits, and delete must each write one ledger entry");
assert.equal(Object.keys(state.stockLog).length, 4, "Create, two edits, and delete must each write one stockLog entry");
assert.equal(queueEntries.length, 0, "Successful isolated CRUD must not create retry queue entries");

const successfulEventTypes = runtime.emittedEvents.map(event => event.type);
assert.deepEqual(
    successfulEventTypes,
    [
        "milkapp:attendance-saved",
        "milkapp:attendance-saved",
        "milkapp:attendance-saved",
        "milkapp:attendance-deleted"
    ],
    "Manager must emit successful create, edit, and delete events"
);

const failedState = createState(40, 999);
const failedQueueEntries = [];
const failedRuntime = createRuntime(
    createRepository(failedState, { failStockWrite: true }),
    failedQueueEntries
);

const queuedResult = await failedRuntime.manager.save({
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    date: "2026-07-29",
    data: {
        s1: "present",
        s2: "present",
        s3: "absent"
    }
});

assert.equal(queuedResult.attendanceSaved, true, "Partial save must preserve the Attendance write");
assert.equal(queuedResult.stockQueued, true, "Partial save must queue the protected Room Stock retry");
assert.equal(queuedResult.difference, 2, "Queued retry must preserve the exact present-count difference");
assert.equal(failedState.roomStock["isolated-room"], 40, "Failed stock write must not change Room Stock before retry");
assert.equal(failedState.mainStock, 999, "Queued retry path must leave Main Stock unchanged");
assert.ok(failedState.attendance["isolated-room_2026-07-29"], "Queued retry path must retain the saved Attendance record");
assert.equal(failedQueueEntries.length, 1, "Queued retry path must add exactly one queue entry");
assert.equal(failedQueueEntries[0].roomId, "isolated-room", "Queue entry must stay in the authenticated room");
assert.equal(failedQueueEntries[0].difference, 2, "Queue entry must preserve the exact Room Stock difference");
assert.equal(failedQueueEntries[0].referenceId, "isolated-room_2026-07-29", "Queue entry must reference the compatible Attendance key");
assert.equal(
    failedRuntime.emittedEvents.at(-1)?.type,
    "milkapp:attendance-stock-queued",
    "Manager must emit persistent queue feedback after partial save"
);

console.log("Attendance isolated write checks passed.");
