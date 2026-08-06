import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const repositoryCode = read("modules/repositories/pendingMilkRepository.js");
const serviceCode = read("modules/services/pendingMilkService.js");
const managerCode = read("modules/pending/pendingMilkManager.js");
const viewCode = read("modules/pending/pendingMilkView.js");
const appCode = read("modules/core/app.js");
const legacyCode = read("teacher.html");

for (const [name, source] of [
    ["pendingMilkRepository.js", repositoryCode],
    ["pendingMilkService.js", serviceCode],
    ["pendingMilkManager.js", managerCode],
    ["pendingMilkView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(repositoryCode.includes('this.path("absentMilk")'), "Repository must preserve milkApp/absentMilk");
assert.ok(repositoryCode.includes('orderBy: "roomId"'), "Pending records must use a room-scoped query");
assert.ok(repositoryCode.includes("loadAttendanceDates"), "Repository must load exact Attendance dates only");
assert.ok(serviceCode.includes('type: "PENDING"'), "Pending issue must create a PENDING ledger entry");
assert.ok(serviceCode.includes('type: "ROLLBACK"'), "Pending deletion must create a ROLLBACK ledger entry");
assert.ok(serviceCode.includes("mainStockDelta: 0"), "Pending workflows must preserve Main Stock");
assert.ok(serviceCode.includes('signature: ""'), "Pending record must preserve the legacy signature field");
assert.ok(serviceCode.includes("signatures: {}"), "Pending record must preserve the signatures field");
assert.ok(serviceCode.includes("photos: []"), "Pending record must preserve the photos field");
assert.ok(managerCode.includes("PENDING_STOCK_ADJUSTMENT_REQUIRED"), "Manager must recognize Pending partial saves");
assert.ok(managerCode.includes("queueRoomStockAdjustment"), "Manager must queue unresolved Room Stock work");
assert.ok(managerCode.includes("queueAttendanceAudit"), "Manager must queue unresolved audit work");
assert.ok(viewCode.includes('panel.id = "pending-milk-panel"'), "View must create the Pending Milk panel");
assert.ok(viewCode.includes("pendingMilkManager.loadWeek"), "View must delegate week loading to Manager");
assert.ok(viewCode.includes("pendingMilkManager.issue"), "View must delegate issue commands to Manager");
assert.ok(viewCode.includes("pendingMilkManager.remove"), "View must delegate rollback commands to Manager");
assert.ok(appCode.includes('import("../repositories/pendingMilkRepository.js")'), "App must load Pending Repository");
assert.ok(appCode.includes('import("../services/pendingMilkService.js")'), "App must load Pending Service");
assert.ok(appCode.includes('import("../pending/pendingMilkManager.js")'), "App must load Pending Manager");
assert.ok(appCode.includes('import("../pending/pendingMilkView.js")'), "App must load Pending View");

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "stockTransactions/",
    "stockLog/"
]) {
    assert.ok(!viewCode.includes(forbidden), `PendingMilkView must not contain ${forbidden}`);
}

for (const legacyField of [
    "weekStart:s,weekEnd:e,roomId:S.room,roomName:S.roomName,teacher:S.teacher,date:todStr()",
    "students:am,totalBoxes:boxes",
    "signature:'',",
    "signatures:{...absSigData}",
    "photos:[...absPhotos]",
    "type:'PENDING'",
    "type:'ROLLBACK'"
]) {
    assert.ok(legacyCode.includes(legacyField), `Protected legacy evidence must contain ${legacyField}`);
}

const session = {
    role: "teacher",
    roomId: "isolated-room",
    roomName: "ห้องทดสอบแยก",
    teacher: "ครูทดสอบ"
};
const students = [
    { id: "s1", num: 1, name: "นักเรียนหนึ่ง" },
    { id: "s2", num: 2, name: "นักเรียนสอง" }
];
const attendanceRecords = {
    "isolated-room_2026-08-03": {
        clsId: "isolated-room",
        date: "2026-08-03",
        data: { s1: "absent", s2: "present" }
    },
    "isolated-room_2026-08-04": {
        clsId: "isolated-room",
        date: "2026-08-04",
        data: { s1: "absent", s2: "absent" }
    }
};
const pendingRecords = {
    existing: {
        roomId: "isolated-room",
        weekStart: "2026-08-03",
        weekEnd: "2026-08-07",
        students: { s1: { name: "นักเรียนหนึ่ง", days: ["2026-08-03"] } },
        totalBoxes: 1,
        savedAt: "2026-08-03T00:00:00.000Z"
    }
};
let createdId = 0;
const repository = {
    async loadAttendanceDates(roomId, dates) {
        assert.equal(roomId, "isolated-room");
        assert.deepEqual(plain(dates), [
            "2026-08-03",
            "2026-08-04",
            "2026-08-05",
            "2026-08-06",
            "2026-08-07"
        ]);
        return { ...attendanceRecords };
    },
    async loadRoomPendingRecords(roomId) {
        assert.equal(roomId, "isolated-room");
        return { ...pendingRecords };
    },
    async loadPendingRecord(id) {
        return pendingRecords[id] || null;
    },
    async createPendingRecord(record) {
        createdId += 1;
        const id = `pending-${createdId}`;
        pendingRecords[id] = { ...record };
        return { id, record };
    },
    async deletePendingRecord(id) {
        delete pendingRecords[id];
        return null;
    }
};
let roomStock = 100;
let mainStock = 999;
let auditWrites = [];
let nextId = 0;
const sharedStock = {
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, "isolated-room");
        const before = roomStock;
        roomStock -= difference;
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
        return { id: `ledger-${++nextId}`, ...input };
    },
    buildStockLog(input) {
        return { id: `stocklog-${++nextId}`, ...input };
    },
    async writeAuditWithRetry(ledger, stockLog) {
        auditWrites.push({ ledger, stockLog });
        return { ok: true, attempts: 1, error: null };
    }
};
const teacherService = {
    assertRoomAccess(activeSession, roomId = null) {
        assert.equal(activeSession.role, "teacher");
        if (roomId && roomId !== activeSession.roomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return activeSession.roomId;
    }
};
const context = {
    window: {
        PendingMilkRepository: repository,
        TeacherService: teacherService,
        AttendanceService: sharedStock
    },
    console,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Object,
    Array,
    Error,
    Promise,
    Set,
    Map
};
vm.runInNewContext(serviceCode, context);
const PendingMilkService = context.window.PendingMilkService.constructor;
const service = new PendingMilkService(repository, teacherService, sharedStock, {
    clock: () => new Date("2026-08-05T12:00:00.000Z")
});

const range = service.weekRange("2026-08-05");
assert.deepEqual(plain(range), {
    weekStart: "2026-08-03",
    weekEnd: "2026-08-07",
    dates: ["2026-08-03", "2026-08-04", "2026-08-05", "2026-08-06", "2026-08-07"]
});

const loaded = await service.loadWeek(session, "2026-08-05", students);
assert.deepEqual(
    plain(loaded.eligible.map(pair => pair.key)),
    ["s1_2026-08-04", "s2_2026-08-04"],
    "Already-issued student/date pairs must be excluded"
);
assert.deepEqual(
    plain(loaded.alreadyIssued.map(pair => pair.key)),
    ["s1_2026-08-03"],
    "Existing legacy records must be represented as already issued"
);

const issued = await service.issue(session, {
    roomId: "isolated-room",
    weekDate: "2026-08-05",
    students,
    selectedPairs: [
        { studentId: "s1", date: "2026-08-04" },
        { studentId: "s2", date: "2026-08-04" }
    ],
    note: "isolated"
});
assert.equal(issued.quantity, 2);
assert.equal(issued.record.totalBoxes, 2);
assert.deepEqual(plain(issued.record.students), {
    s1: { name: "นักเรียนหนึ่ง", days: ["2026-08-04"] },
    s2: { name: "นักเรียนสอง", days: ["2026-08-04"] }
});
assert.equal(issued.record.weekStart, "2026-08-03");
assert.equal(issued.record.weekEnd, "2026-08-07");
assert.equal(issued.record.date, "2026-08-05");
assert.equal(issued.record.signature, "");
assert.deepEqual(plain(issued.record.signatures), {});
assert.deepEqual(plain(issued.record.photos), []);
assert.equal(issued.ledger.type, "PENDING");
assert.equal(issued.ledger.quantity, -2);
assert.equal(issued.stockLog.type, "OUT");
assert.equal(issued.roomStockBefore, 100);
assert.equal(issued.roomStockAfter, 98);
assert.equal(issued.mainStockDelta, 0);
assert.equal(mainStock, 999);

await assert.rejects(
    service.issue(session, {
        weekDate: "2026-08-05",
        students,
        selectedPairs: [{ studentId: "s1", date: "2026-08-04" }]
    }),
    error => error.code === "PENDING_SELECTION_INVALID",
    "Service must block duplicate student/date issue"
);

const removed = await service.remove(session, { recordId: issued.id });
assert.equal(removed.restoredQuantity, 2);
assert.equal(removed.ledger.type, "ROLLBACK");
assert.equal(removed.ledger.quantity, 2);
assert.equal(removed.stockLog.type, "IN");
assert.equal(removed.roomStockBefore, 98);
assert.equal(removed.roomStockAfter, 100);
assert.equal(removed.mainStockDelta, 0);
assert.equal(roomStock, 100);
assert.equal(mainStock, 999);
assert.equal(auditWrites.length, 2);

await assert.rejects(
    service.issue({ ...session, roomId: "other-room" }, {
        roomId: "isolated-room",
        weekDate: "2026-08-05",
        students,
        selectedPairs: [{ studentId: "s2", date: "2026-08-04" }]
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED"
);

console.log("Pending Milk module checks passed.");
