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
const syncServiceCode = read("modules/services/syncService.js");
const syncManagerCode = read("modules/sync/syncManager.js");
const syncViewCode = read("modules/sync/syncView.js");
const adapterCode = read("modules/sync/retroactiveSyncAdapter.js");
const appCode = read("modules/core/app.js");

for (const [name, source] of [
    ["queueStorage.js", queueCode],
    ["syncService.js", syncServiceCode],
    ["syncManager.js", syncManagerCode],
    ["syncView.js", syncViewCode],
    ["retroactiveSyncAdapter.js", adapterCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(adapterCode.includes('normalized === "RETRO"'), "Adapter must preserve RETRO operation metadata");
assert.ok(adapterCode.includes('type: "RETRO"'), "Adapter must create RETRO ledger work");
assert.ok(adapterCode.includes('type: "OUT"'), "Adapter must create OUT stockLog work");
assert.ok(adapterCode.includes("mainStockDelta: 0"), "Adapter must preserve Main Stock");
assert.ok(
    appCode.indexOf("ensureRetroactiveSyncAdapter") < appCode.indexOf("await syncView.initialize"),
    "App must install Retroactive routing before Queue startup"
);
assert.ok(
    appCode.includes('import("../sync/retroactiveSyncAdapter.js")'),
    "App must load the Retroactive sync adapter"
);

for (const forbidden of ["FirebaseService", "fetch(", "retroMilk/"]) {
    assert.ok(!adapterCode.includes(forbidden), `Retroactive sync adapter must not contain ${forbidden}`);
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

class EventTargetStub {
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
        for (const listener of this.listeners.get(event.type) || []) {
            listener(event);
        }
        return true;
    }
}

const session = {
    role: "teacher",
    roomId: "isolated-retro-room",
    roomName: "ห้องย้อนหลังทดสอบแยก",
    teacher: "ครูทดสอบ"
};
const memoryStorage = new MemoryStorage();
const eventTarget = new EventTargetStub();
let roomStock = 100;
let mainStock = 999;
let stockMutationCount = 0;
let auditShouldFail = true;
let appendedAuditCount = 0;
let nextAuditId = 0;

const attendanceService = {
    async saveAttendance() {
        throw new Error("Attendance replay is not expected in this test.");
    },
    async adjustRoomStock() {
        throw new Error("Legacy Attendance stock replay is not expected in this test.");
    },
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, session.roomId);
        const before = roomStock;
        roomStock -= Number(difference);
        stockMutationCount += 1;
        return {
            roomId,
            difference,
            roomStockBefore: before,
            roomStockAfter: roomStock,
            attempts: 1,
            conflictCount: 0
        };
    },
    buildLedgerEntry(input) {
        return { id: `ledger-${++nextAuditId}`, ...input };
    },
    buildStockLog(input) {
        return { id: `stocklog-${++nextAuditId}`, ...input };
    },
    async writeAuditWithRetry() {
        return auditShouldFail
            ? {
                ok: false,
                attempts: 3,
                error: { code: "AUDIT_WRITE_FAILED", message: "isolated audit failure" }
            }
            : { ok: true, attempts: 1, error: null };
    }
};

const teacherService = {
    assertRoomAccess(activeSession, targetRoomId = null) {
        assert.equal(activeSession?.role, "teacher");
        const roomId = String(activeSession?.roomId || "");
        if (targetRoomId && String(targetRoomId) !== roomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return roomId;
    }
};

const attendanceRepository = {
    async appendAttendanceAudit(ledger, stockLog) {
        assert.ok(ledger?.id || stockLog?.id);
        appendedAuditCount += 1;
        return { ledger, stockLog };
    }
};

const documentStub = {
    getElementById() {
        return null;
    },
    createElement() {
        return {
            dataset: {},
            style: {},
            setAttribute() {},
            removeAttribute() {},
            addEventListener() {},
            appendChild() {},
            replaceChildren() {}
        };
    },
    head: { appendChild() {} }
};

const windowStub = {
    localStorage: memoryStorage,
    document: documentStub,
    navigator: { onLine: true },
    AttendanceService: attendanceService,
    TeacherService: teacherService,
    AttendanceRepository: attendanceRepository,
    AuthService: { getSession: () => session },
    setTimeout: () => 1,
    clearTimeout() {},
    setInterval: () => 1,
    clearInterval() {},
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    dispatchEvent: eventTarget.dispatchEvent.bind(eventTarget),
    confirm: () => true
};

class CustomEventStub {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
}

const context = {
    window: windowStub,
    console,
    Date,
    Math,
    JSON,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Error,
    Promise,
    Map,
    Set,
    Intl,
    CustomEvent: CustomEventStub
};

vm.runInNewContext(queueCode, context);
vm.runInNewContext(syncServiceCode, context);
vm.runInNewContext(syncManagerCode, context);
vm.runInNewContext(syncViewCode, context);
vm.runInNewContext(adapterCode, context);

const adapterStatus = plain(windowStub.RetroactiveSyncAdapter.getStatus());
assert.deepEqual(adapterStatus, {
    installed: true,
    queueStorage: true,
    syncService: true,
    syncManager: true,
    syncView: true
});

const legacyEntry = windowStub.QueueStorage.upsert({
    type: "roomStockAdjust",
    key: "stockadj_legacy-attendance",
    roomId: session.roomId,
    difference: 1,
    referenceId: "legacy-attendance",
    roomName: session.roomName,
    date: "2026-08-01"
});
assert.equal(legacyEntry.operationType, "ATTENDANCE", "Legacy operation metadata must remain ATTENDANCE");
windowStub.QueueStorage.remove(legacyEntry.key);

const retroEntry = windowStub.SyncService.queueRoomStockAdjustment(session, {
    roomId: session.roomId,
    difference: 6,
    referenceId: "retro-isolated-1",
    roomName: session.roomName,
    date: "2026-08-10",
    operationType: "RETRO"
});
assert.equal(retroEntry.operationType, "RETRO", "QueueStorage must persist RETRO metadata");
assert.equal(
    retroEntry.note,
    "หักสต็อกจากการจ่ายนมย้อนหลัง (ซิงก์ค้าง)",
    "RETRO queue entry must use the reviewed safe note"
);

const visibleBefore = windowStub.SyncManager.getStatus();
assert.equal(visibleBefore.queueCount, 1);
assert.equal(visibleBefore.queueItems[0].operationType, "RETRO");
assert.equal(
    windowStub.SyncView.typeLabel("roomStockAdjust", "RETRO"),
    "หักสต็อกนมย้อนหลังที่รอซิงก์"
);

const firstSummary = await windowStub.SyncService.flush(session);
assert.equal(firstSummary.processed, 1);
assert.equal(firstSummary.deferred, 1, "Failed RETRO audit must convert to audit-only work");
assert.equal(firstSummary.remaining, 1);
assert.equal(firstSummary.mainStockDelta, 0);
assert.equal(roomStock, 94, "RETRO replay must deduct Room Stock exactly once");
assert.equal(stockMutationCount, 1);
assert.equal(mainStock, 999);
assert.equal(firstSummary.results[0].convertedTo.type, "attendanceAudit");
assert.equal(firstSummary.results[0].convertedTo.ledger.type, "RETRO");
assert.equal(firstSummary.results[0].convertedTo.ledger.quantity, -6);
assert.equal(firstSummary.results[0].convertedTo.stockLog.type, "OUT");
assert.equal(firstSummary.results[0].convertedTo.stockLog.quantity, 6);

const persistedAuditOnly = windowStub.QueueStorage.snapshot();
assert.equal(persistedAuditOnly.length, 1);
assert.equal(persistedAuditOnly[0].type, "attendanceAudit");
assert.equal(persistedAuditOnly[0].ledger.type, "RETRO");

auditShouldFail = false;
const auditSummary = await windowStub.SyncService.flush(session);
assert.equal(auditSummary.succeeded, 1);
assert.equal(auditSummary.remaining, 0);
assert.equal(appendedAuditCount, 1);
assert.equal(stockMutationCount, 1, "Audit-only retry must not repeat Room Stock deduction");
assert.equal(roomStock, 94);
assert.equal(mainStock, 999);

const rollbackEntry = windowStub.SyncService.queueRoomStockAdjustment(session, {
    roomId: session.roomId,
    difference: -6,
    referenceId: "retro-isolated-1",
    roomName: session.roomName,
    date: "2026-08-10",
    operationType: "ROLLBACK",
    note: "คืนสต็อกจากการลบรายการนมย้อนหลัง (ซิงก์ค้าง)"
});
assert.equal(rollbackEntry.operationType, "ROLLBACK");
const rollbackSummary = await windowStub.SyncService.flush(session);
assert.equal(rollbackSummary.succeeded, 1);
assert.equal(rollbackSummary.remaining, 0);
assert.equal(rollbackSummary.results[0].value.ledger.type, "ROLLBACK");
assert.equal(rollbackSummary.results[0].value.ledger.quantity, 6);
assert.equal(rollbackSummary.results[0].value.stockLog.type, "IN");
assert.equal(rollbackSummary.results[0].value.stockLog.quantity, 6);
assert.equal(roomStock, 100, "ROLLBACK replay must restore the exact Room Stock quantity");
assert.equal(stockMutationCount, 2);
assert.equal(mainStock, 999);

console.log("Retroactive Milk recovery routing checks passed.");
