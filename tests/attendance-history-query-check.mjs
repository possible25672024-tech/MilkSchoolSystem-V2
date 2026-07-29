import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const repositorySource = read("modules/repositories/attendanceRepository.js");
const serviceSource = read("modules/reports/attendanceHistoryService.js");
const managerSource = read("modules/reports/attendanceHistoryManager.js");

for (const [name, source] of [
    ["attendanceHistoryService.js", serviceSource],
    ["attendanceHistoryManager.js", managerSource]
]) {
    new vm.Script(source, { filename: name });
    for (const forbidden of [
        "firebaseService.set",
        "firebaseService.update",
        "firebaseService.remove",
        "firebaseService.push",
        "fetch(",
        "localStorage",
        "sessionStorage",
        "roomStock",
        "mainStock",
        "stockLog",
        "ledger"
    ]) {
        assert.ok(!source.includes(forbidden), `${name} must not own ${forbidden}`);
    }
}

assert.ok(repositorySource.includes("loadAttendanceHistoryRecord"), "AttendanceRepository must expose media-free history reads");
assert.ok(repositorySource.includes("/data`"), "Attendance history reads must start from the Attendance data child");
assert.ok(!repositorySource.match(/loadAttendanceHistoryRecord[\s\S]*?\/photos/), "Attendance history record reads must not request photos");
assert.ok(!repositorySource.match(/loadAttendanceHistoryRecord[\s\S]*?\/signature/), "Attendance history record reads must not request signatures");

const dispatched = [];
class CustomEvent {
    constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
    }
}

const windowObject = {
    dispatchEvent(event) {
        dispatched.push(event);
    }
};
windowObject.window = windowObject;

const context = vm.createContext({
    window: windowObject,
    CustomEvent,
    console,
    Date,
    Promise,
    setTimeout,
    clearTimeout
});

vm.runInContext(serviceSource, context, { filename: "attendanceHistoryService.js" });
vm.runInContext(managerSource, context, { filename: "attendanceHistoryManager.js" });

const AttendanceHistoryService = windowObject.AttendanceHistoryServiceClass;
const AttendanceHistoryManager = windowObject.AttendanceHistoryManagerClass;

const sourceRecords = {
    "2026-07-01": {
        roomName: "อ.3-6สลิคคี",
        teacher: "ครูทดสอบ",
        year: 2569,
        term: 1,
        data: { s2: "absent", s1: "present", invalid: "late" },
        notes: { s2: "ลา", blank: "" },
        savedAt: "2026-07-01T08:00:00.000Z",
        photos: ["data:image/jpeg;base64,SECRET"],
        signature: "data:image/png;base64,SECRET"
    },
    "2026-07-03": {
        roomName: "อ.3-6สลิคคี",
        teacher: "ครูทดสอบ",
        year: 2569,
        term: 1,
        data: { s1: "absent", s2: "present" },
        notes: {},
        savedAt: "2026-07-03T08:00:00.000Z"
    }
};
const originalRecords = structuredClone(sourceRecords);
const calls = [];
const repository = {
    async loadAttendanceHistoryRecord(roomId, date) {
        calls.push({ roomId, date });
        return sourceRecords[date] || null;
    }
};
const teacherService = {
    assertRoomAccess(session, targetRoomId) {
        assert.equal(session.role, "teacher");
        const roomId = String(session.roomId);
        if (targetRoomId && targetRoomId !== roomId) {
            const error = new Error("cross-room");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }
        return roomId;
    }
};
const session = {
    role: "teacher",
    roomId: "room-36",
    roomName: "อ.3-6สลิคคี",
    teacher: "ครูทดสอบ"
};

const service = new AttendanceHistoryService(repository, teacherService, {
    maxRangeDays: 93,
    concurrency: 2
});

const result = await service.loadRange(session, {
    startDate: "2026-07-01",
    endDate: "2026-07-03"
});

assert.deepEqual(calls, [
    { roomId: "room-36", date: "2026-07-01" },
    { roomId: "room-36", date: "2026-07-02" },
    { roomId: "room-36", date: "2026-07-03" }
], "History service must request only the authenticated room and selected dates");
assert.equal(result.requestedDays, 3);
assert.equal(result.recordCount, 2);
assert.deepEqual(result.records.map(record => record.date), ["2026-07-01", "2026-07-03"]);
assert.deepEqual(result.records[0].data, { s2: "absent", s1: "present" });
assert.deepEqual(result.records[0].notes, { s2: "ลา" });
assert.deepEqual(result.records[0].evidence, {
    loaded: false,
    photoCount: null,
    hasSignature: null
});
assert.ok(!JSON.stringify(result).includes("data:image"), "History result must not expose photo or signature Data URLs");
assert.ok(!Object.hasOwn(result.records[0], "photos"), "History records must not expose photos");
assert.ok(!Object.hasOwn(result.records[0], "signature"), "History records must not expose signatures");
assert.deepEqual(sourceRecords, originalRecords, "History normalization must not mutate repository records");

const oneDay = await service.loadRange(session, "2026-07-03");
assert.equal(oneDay.startDate, "2026-07-03");
assert.equal(oneDay.endDate, "2026-07-03");
assert.equal(oneDay.recordCount, 1);

await assert.rejects(
    () => service.loadRange(session, {
        roomId: "another-room",
        startDate: "2026-07-01",
        endDate: "2026-07-01"
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED"
);
await assert.rejects(
    () => service.loadRange(session, {
        startDate: "2026-07-03",
        endDate: "2026-07-01"
    }),
    error => error.code === "ATTENDANCE_HISTORY_RANGE_REVERSED"
);
await assert.rejects(
    () => service.loadRange(session, {
        startDate: "2026-02-30",
        endDate: "2026-03-01"
    }),
    error => error.code === "ATTENDANCE_HISTORY_DATE_INVALID"
);
await assert.rejects(
    () => service.loadRange(session, {
        startDate: "2026-01-01",
        endDate: "2026-04-30"
    }),
    error => error.code === "ATTENDANCE_HISTORY_RANGE_TOO_LARGE"
);

const manager = new AttendanceHistoryManager(service, {
    getSession() {
        return session;
    }
});
dispatched.length = 0;
const managerResult = await manager.load({
    startDate: "2026-07-01",
    endDate: "2026-07-03"
});
assert.equal(managerResult.recordCount, 2);
assert.deepEqual(
    dispatched.map(event => event.type),
    ["milkapp:attendance-history-loading", "milkapp:attendance-history-loaded"]
);
assert.ok(!JSON.stringify(dispatched).includes("data:image"), "History events must remain evidence-payload safe");
const snapshot = manager.getSnapshot();
snapshot.current.records[0].data.s1 = "absent";
assert.equal(manager.getSnapshot().current.records[0].data.s1, "present", "Manager snapshots must be defensive copies");

const emptyService = new AttendanceHistoryService({
    async loadAttendanceHistoryRecord() {
        return null;
    }
}, teacherService);
const emptyManager = new AttendanceHistoryManager(emptyService, {
    getSession() {
        return session;
    }
});
dispatched.length = 0;
const emptyResult = await emptyManager.load("2026-07-02");
assert.equal(emptyResult.recordCount, 0);
assert.deepEqual(
    dispatched.map(event => event.type),
    ["milkapp:attendance-history-loading", "milkapp:attendance-history-empty"]
);

const repositoryCalls = [];
const firebaseService = {
    async get(requestPath) {
        repositoryCalls.push(requestPath);
        if (requestPath.endsWith("/data")) {
            return requestPath.includes("2026-07-01") ? { s1: "present" } : null;
        }
        if (requestPath.endsWith("/year")) return 2569;
        if (requestPath.endsWith("/term")) return 1;
        if (requestPath.endsWith("/roomName")) return "อ.3-6สลิคคี";
        if (requestPath.endsWith("/teacher")) return "ครูทดสอบ";
        if (requestPath.endsWith("/savedAt")) return "2026-07-01T08:00:00.000Z";
        if (requestPath.endsWith("/notes")) return {};
        return null;
    }
};
class BaseRepository {
    constructor(serviceInstance) {
        this.firebaseService = serviceInstance;
    }
    get(requestPath, query = {}) {
        return this.firebaseService.get(requestPath, query);
    }
    update() {
        throw new Error("write not allowed in history test");
    }
}
const repositoryWindow = { FirebaseService: firebaseService };
repositoryWindow.window = repositoryWindow;
const repositoryContext = vm.createContext({
    window: repositoryWindow,
    BaseRepository,
    console,
    Promise
});
vm.runInContext(repositorySource, repositoryContext, { filename: "attendanceRepository.js" });
const AttendanceRepositoryClass = vm.runInContext("AttendanceRepository", repositoryContext);
const productionRepository = new AttendanceRepositoryClass(firebaseService);

repositoryCalls.length = 0;
const productionRecord = await productionRepository.loadAttendanceHistoryRecord("room-36", "2026-07-01");
assert.equal(productionRecord.data.s1, "present");
assert.ok(repositoryCalls.every(requestPath => !requestPath.endsWith("/photos")), "Production history read must never request photos");
assert.ok(repositoryCalls.every(requestPath => !requestPath.endsWith("/signature")), "Production history read must never request signatures");
assert.ok(repositoryCalls.every(requestPath => requestPath.includes("room-36_2026-07-01")), "Production history reads must remain scoped to one room/date key");

repositoryCalls.length = 0;
const missingRecord = await productionRepository.loadAttendanceHistoryRecord("room-36", "2026-07-02");
assert.equal(missingRecord, null);
assert.equal(repositoryCalls.length, 1, "Missing days must stop after the media-free data existence read");
assert.ok(repositoryCalls[0].endsWith("/data"));

console.log("Attendance history query checks passed.");