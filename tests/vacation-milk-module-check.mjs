import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const repositoryCode = read("modules/repositories/vacationMilkRepository.js");
const serviceCode = read("modules/services/vacationMilkService.js");
const managerCode = read("modules/vacation/vacationMilkManager.js");
const viewCode = read("modules/vacation/vacationMilkView.js");
const appCode = read("modules/core/app.js");
const legacyCode = read("teacher.html");

for (const [name, source] of [
    ["vacationMilkRepository.js", repositoryCode],
    ["vacationMilkService.js", serviceCode],
    ["vacationMilkManager.js", managerCode],
    ["vacationMilkView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(repositoryCode.includes('this.path("vacationMilk")'), "Repository must preserve milkApp/vacationMilk");
assert.ok(repositoryCode.includes('orderBy: "roomId"'), "Vacation records must use a room-scoped query");
assert.ok(serviceCode.includes('type: "VACATION"'), "Vacation issue must create a VACATION ledger entry");
assert.ok(serviceCode.includes('type: "ROLLBACK"'), "Vacation delete must create a ROLLBACK ledger entry");
assert.ok(serviceCode.includes('type: "OUT"'), "Vacation issue must create an OUT stockLog entry");
assert.ok(serviceCode.includes('type: "IN"'), "Vacation delete must create an IN stockLog entry");
assert.ok(serviceCode.includes("mainStockDelta: 0"), "Vacation workflows must preserve Main Stock");
assert.ok(managerCode.includes("VACATION_STOCK_ADJUSTMENT_REQUIRED"), "Manager must recognize Vacation partial saves");
assert.ok(managerCode.includes("queueRoomStockAdjustment"), "Manager must queue unresolved Room Stock work");
assert.ok(managerCode.includes("queueAttendanceAudit"), "Manager must queue unresolved audit work");
assert.ok(viewCode.includes('panel.id = "vacation-milk-panel"'), "View must create the Vacation Milk panel");
assert.ok(viewCode.includes("vacationMilkManager.preview"), "View must delegate calculation to Manager");
assert.ok(viewCode.includes("vacationMilkManager.issue"), "View must delegate issue commands to Manager");
assert.ok(viewCode.includes("vacationMilkManager.remove"), "View must delegate rollback commands to Manager");
assert.ok(viewCode.includes("รายชื่อนักเรียนและจำนวนกล่อง"), "View must retain visible student detail");
assert.ok(viewCode.includes("Shared Media & Signature Workflow"), "View must preserve the mandatory media/signature handoff");
assert.ok(appCode.includes('import("../repositories/vacationMilkRepository.js")'), "App must load Vacation Repository");
assert.ok(appCode.includes('import("../services/vacationMilkService.js")'), "App must load Vacation Service");
assert.ok(appCode.includes('import("../vacation/vacationMilkManager.js")'), "App must load Vacation Manager");
assert.ok(appCode.includes('import("../vacation/vacationMilkView.js")'), "App must load Vacation View");

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
    assert.ok(!viewCode.includes(forbidden), `VacationMilkView must not contain ${forbidden}`);
}

for (const legacyField of [
    "const total=dy*STUDS.length",
    "academicYear:yr,semester:tm,date:dt,days:dy,roomId:S.room",
    "studentCount:STUDS.length,totalBoxes:total",
    "signatures:{...vcSigData},photos:[...vcPhotos]",
    "type:'VACATION'",
    "type:'ROLLBACK'"
]) {
    assert.ok(legacyCode.includes(legacyField), `Protected legacy evidence must contain ${legacyField}`);
}

const session = {
    role: "teacher",
    roomId: "isolated-vacation-room",
    roomName: "ห้องปิดเทอมทดสอบ",
    teacher: "ครูทดสอบ"
};
const students = [
    { id: "s1", num: 1, name: "นักเรียนหนึ่ง" },
    { id: "s2", num: 2, name: "นักเรียนสอง" },
    { id: "s3", num: 3, name: "นักเรียนสาม" }
];
const records = {
    previous: {
        roomId: "isolated-vacation-room",
        roomName: "ห้องปิดเทอมทดสอบ",
        academicYear: "2568",
        semester: "2",
        date: "2026-03-20",
        days: 30,
        studentCount: 3,
        totalBoxes: 90,
        note: "previous",
        signature: "",
        signatures: {},
        photos: [],
        savedAt: "2026-03-20T00:00:00.000Z"
    }
};
let createdId = 0;
const repository = {
    async loadRoomRecords(roomId) {
        assert.equal(roomId, "isolated-vacation-room");
        return { ...records };
    },
    async loadRecord(id) {
        return records[id] || null;
    },
    async createRecord(record) {
        createdId += 1;
        const id = `vacation-${createdId}`;
        records[id] = { ...record };
        return { id, record };
    },
    async deleteRecord(id) {
        delete records[id];
        return null;
    }
};
let roomStock = 200;
let mainStock = 999;
let auditWrites = [];
let nextId = 0;
const sharedStock = {
    async atomicRoomStockDifference(roomId, difference) {
        assert.equal(roomId, "isolated-vacation-room");
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
        VacationMilkRepository: repository,
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
const VacationMilkService = context.window.VacationMilkService.constructor;
const service = new VacationMilkService(repository, teacherService, sharedStock, {
    clock: () => new Date("2026-10-01T03:00:00.000Z")
});

await assert.rejects(
    async () => service.preview(session, {
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-10-01",
        days: 0,
        students
    }),
    error => error.code === "VACATION_DAYS_INVALID"
);

const preview = service.preview(session, {
    roomId: "isolated-vacation-room",
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-10-01",
    days: 30,
    students
});
assert.equal(preview.studentCount, 3);
assert.equal(preview.days, 30);
assert.equal(preview.totalBoxes, 90);
assert.equal(preview.mainStockDelta, 0);

const issued = await service.issue(session, {
    roomId: "isolated-vacation-room",
    academicYear: "2569",
    semester: "1",
    issueDate: "2026-10-01",
    days: 30,
    students,
    note: "isolated",
    signatures: {
        s1: { receiverName: "ผู้ปกครองหนึ่ง", sig: "data:image/png;base64,isolated" }
    },
    photos: ["data:image/jpeg;base64,isolated"]
});
assert.equal(issued.quantity, 90);
assert.equal(issued.record.studentCount, 3);
assert.equal(issued.record.days, 30);
assert.equal(issued.record.totalBoxes, 90);
assert.equal(issued.record.signature, "");
assert.equal(issued.record.signatures.s1.receiverName, "ผู้ปกครองหนึ่ง");
assert.deepEqual(plain(issued.record.photos), ["data:image/jpeg;base64,isolated"]);
assert.equal(issued.ledger.type, "VACATION");
assert.equal(issued.ledger.quantity, -90);
assert.equal(issued.stockLog.type, "OUT");
assert.equal(issued.stockLog.quantity, 90);
assert.equal(issued.roomStockBefore, 200);
assert.equal(issued.roomStockAfter, 110);
assert.equal(issued.mainStockDelta, 0);
assert.equal(mainStock, 999);

await assert.rejects(
    service.issue(session, {
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-10-01",
        days: 30,
        students
    }),
    error => error.code === "VACATION_DUPLICATE_ISSUE",
    "Service must block an exact duplicate academic period, issue date, and day count"
);

const history = await service.loadHistory(session);
assert.equal(history.records.length, 2);
assert.equal(history.totalBoxes, 180);

const removed = await service.remove(session, { recordId: issued.id });
assert.equal(removed.quantity, 90);
assert.equal(removed.ledger.type, "ROLLBACK");
assert.equal(removed.ledger.quantity, 90);
assert.equal(removed.stockLog.type, "IN");
assert.equal(removed.stockLog.quantity, 90);
assert.equal(removed.roomStockBefore, 110);
assert.equal(removed.roomStockAfter, 200);
assert.equal(removed.mainStockDelta, 0);
assert.equal(roomStock, 200);
assert.equal(mainStock, 999);
assert.equal(auditWrites.length, 2);

await assert.rejects(
    service.issue({ ...session, roomId: "other-room" }, {
        roomId: "isolated-vacation-room",
        academicYear: "2569",
        semester: "1",
        issueDate: "2026-10-02",
        days: 30,
        students
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED"
);

console.log("Vacation Milk module checks passed.");
