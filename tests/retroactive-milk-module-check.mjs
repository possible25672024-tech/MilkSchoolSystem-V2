import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const repositoryCode = read("modules/repositories/retroactiveMilkRepository.js");
const serviceCode = read("modules/services/retroactiveMilkService.js");
const managerCode = read("modules/retroactive/retroactiveMilkManager.js");
const viewCode = read("modules/retroactive/retroactiveMilkView.js");
const appCode = read("modules/core/app.js");
const legacyCode = read("teacher.html");

for (const [name, source] of [
    ["retroactiveMilkRepository.js", repositoryCode],
    ["retroactiveMilkService.js", serviceCode],
    ["retroactiveMilkManager.js", managerCode],
    ["retroactiveMilkView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(repositoryCode.includes('this.path("retroMilk")'), "Repository must preserve milkApp/retroMilk");
assert.ok(repositoryCode.includes('orderBy: "roomId"'), "Retroactive records must use a room-scoped query");
assert.ok(serviceCode.includes('type: "RETRO"'), "Retroactive issue must create a RETRO ledger entry");
assert.ok(serviceCode.includes('type: "ROLLBACK"'), "Retroactive delete must create a ROLLBACK ledger entry");
assert.ok(serviceCode.includes('status: "debt"'), "Retroactive records must preserve debt status");
assert.ok(serviceCode.includes("debtBoxes: preview.debtBoxes"), "Retroactive records must preserve debtBoxes");
assert.ok(serviceCode.includes("mainStockDelta: 0"), "Retroactive workflows must preserve Main Stock");
assert.ok(managerCode.includes("RETRO_STOCK_ADJUSTMENT_REQUIRED"), "Manager must recognize Retroactive partial saves");
assert.ok(managerCode.includes("queueRoomStockAdjustment"), "Manager must queue unresolved Room Stock work");
assert.ok(managerCode.includes("queueAttendanceAudit"), "Manager must queue unresolved audit work");
assert.ok(viewCode.includes('panel.id = "retroactive-milk-panel"'), "View must create the Retroactive Milk panel");
assert.ok(viewCode.includes("retroactiveMilkManager.preview"), "View must delegate calculation to Manager");
assert.ok(viewCode.includes("retroactiveMilkManager.issue"), "View must delegate issue commands to Manager");
assert.ok(viewCode.includes("retroactiveMilkManager.remove"), "View must delegate rollback commands to Manager");
assert.ok(appCode.includes('import("../repositories/retroactiveMilkRepository.js")'), "App must load Retroactive Repository");
assert.ok(appCode.includes('import("../services/retroactiveMilkService.js")'), "App must load Retroactive Service");
assert.ok(appCode.includes('import("../retroactive/retroactiveMilkManager.js")'), "App must load Retroactive Manager");
assert.ok(appCode.includes('import("../retroactive/retroactiveMilkView.js")'), "App must load Retroactive View");

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "localStorage",
    "sessionStorage",
    "stockTransactions/",
    "stockLog/",
    "atomicRoomStockDifference"
]) {
    assert.ok(!viewCode.includes(forbidden), `RetroactiveMilkView must not contain ${forbidden}`);
}

for (const legacyField of [
    "const days=dBetween(s,e).length,boxes=days*STUDS.length",
    "academicYear:yr,semester:tm,date:dt,retroStart:s,retroEnd:e",
    "studentCount:STUDS.length,days,totalBoxes:boxes,debtBoxes:boxes,status:'debt'",
    "type:'RETRO'",
    "type:'ROLLBACK'"
]) {
    assert.ok(legacyCode.includes(legacyField), `Protected legacy evidence must contain ${legacyField}`);
}

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
const records = {
    previous: {
        roomId: "isolated-retro-room",
        roomName: "ห้องย้อนหลังทดสอบ",
        academicYear: "2569",
        semester: "1",
        date: "2026-07-01",
        retroStart: "2026-06-01",
        retroEnd: "2026-06-05",
        studentCount: 3,
        days: 5,
        totalBoxes: 15,
        debtBoxes: 15,
        status: "debt",
        savedAt: "2026-07-01T00:00:00.000Z"
    }
};
let createdId = 0;
const repository = {
    async loadRoomRecords(roomId) {
        assert.equal(roomId, "isolated-retro-room");
        return { ...records };
    },
    async loadRecord(id) {
        return records[id] || null;
    },
    async createRecord(record) {
        createdId += 1;
        const id = `retro-${createdId}`;
        records[id] = { ...record };
        return { id, record };
    },
    async deleteRecord(id) {
        delete records[id];
        return null;
    }
};
let roomStock = 100;
let mainStock = 999;
let auditWrites = [];
let nextId = 0;
const sharedStock = {
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, "isolated-retro-room");
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
        const activeRoomId = String(activeSession.roomId || "");
        if (roomId && roomId !== activeRoomId) {
            const error = new Error("Cross-room access denied.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return activeRoomId;
    }
};
const context = {
    window: {
        RetroactiveMilkRepository: repository,
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
const RetroactiveMilkService = context.window.RetroactiveMilkService.constructor;
const service = new RetroactiveMilkService(repository, teacherService, sharedStock, {
    clock: () => new Date("2026-08-10T03:00:00.000Z")
});

const range = service.weekdayRange("2026-08-07", "2026-08-10");
assert.deepEqual(plain(range), {
    retroStart: "2026-08-07",
    retroEnd: "2026-08-10",
    dates: ["2026-08-07", "2026-08-10"],
    days: 2
});

await assert.rejects(
    async () => service.weekdayRange("2026-08-10", "2026-08-07"),
    error => error.code === "RETRO_RANGE_REVERSED"
);
await assert.rejects(
    async () => service.weekdayRange("2026-08-08", "2026-08-09"),
    error => error.code === "RETRO_WEEKDAY_REQUIRED"
);

const preview = service.preview(session, {
    roomId: "isolated-retro-room",
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-10",
    retroStart: "2026-08-07",
    retroEnd: "2026-08-10",
    students
});
assert.equal(preview.studentCount, 3);
assert.equal(preview.days, 2);
assert.equal(preview.totalBoxes, 6);
assert.equal(preview.debtBoxes, 6);
assert.equal(preview.mainStockDelta, 0);

const issued = await service.issue(session, {
    roomId: "isolated-retro-room",
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-08-10",
    retroStart: "2026-08-07",
    retroEnd: "2026-08-10",
    students,
    note: "isolated"
});
assert.equal(issued.quantity, 6);
assert.equal(issued.record.studentCount, 3);
assert.equal(issued.record.days, 2);
assert.equal(issued.record.totalBoxes, 6);
assert.equal(issued.record.debtBoxes, 6);
assert.equal(issued.record.status, "debt");
assert.equal(issued.record.signature, "");
assert.deepEqual(plain(issued.record.signatures), {});
assert.deepEqual(plain(issued.record.photos), []);
assert.equal(issued.ledger.type, "RETRO");
assert.equal(issued.ledger.quantity, -6);
assert.equal(issued.stockLog.type, "OUT");
assert.equal(issued.roomStockBefore, 100);
assert.equal(issued.roomStockAfter, 94);
assert.equal(issued.mainStockDelta, 0);
assert.equal(mainStock, 999);

await assert.rejects(
    service.issue(session, {
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-08-11",
        retroStart: "2026-08-07",
        retroEnd: "2026-08-10",
        students
    }),
    error => error.code === "RETRO_DUPLICATE_RANGE",
    "Service must block an exact duplicate academic period and range"
);

const history = await service.loadHistory(session);
assert.equal(history.records.length, 2);
assert.equal(history.totalBoxes, 21);
assert.equal(history.debtBoxes, 21);

const removed = await service.remove(session, { recordId: issued.id });
assert.equal(removed.quantity, 6);
assert.equal(removed.ledger.type, "ROLLBACK");
assert.equal(removed.ledger.quantity, 6);
assert.equal(removed.stockLog.type, "IN");
assert.equal(removed.roomStockBefore, 94);
assert.equal(removed.roomStockAfter, 100);
assert.equal(removed.mainStockDelta, 0);
assert.equal(roomStock, 100);
assert.equal(mainStock, 999);
assert.equal(auditWrites.length, 2);

await assert.rejects(
    service.issue({ ...session, roomId: "other-room" }, {
        roomId: "isolated-retro-room",
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-08-10",
        retroStart: "2026-08-11",
        retroEnd: "2026-08-11",
        students
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED"
);

console.log("Retroactive Milk module checks passed.");
