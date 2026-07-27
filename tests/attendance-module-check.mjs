import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const toPlainData = value => JSON.parse(JSON.stringify(value));

const indexCode = read("index-v2.html");
const repositoryCode = read("modules/repositories/attendanceRepository.js");
const serviceCode = read("modules/services/attendanceService.js");
const managerCode = read("modules/attendance/attendanceManager.js");

for (const [name, source] of [
    ["attendanceRepository.js", repositoryCode],
    ["attendanceService.js", serviceCode],
    ["attendanceManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

const loadOrder = [
    "modules/repositories/teacherRepository.js",
    "modules/repositories/attendanceRepository.js",
    "modules/services/teacherService.js",
    "modules/services/attendanceService.js",
    "modules/teacher/teacherManager.js",
    "modules/attendance/attendanceManager.js",
    "modules/core/app.js"
];

for (let position = 0; position < loadOrder.length - 1; position += 1) {
    assert.ok(
        indexCode.indexOf(loadOrder[position]) < indexCode.indexOf(loadOrder[position + 1]),
        `${loadOrder[position]} must load before ${loadOrder[position + 1]}`
    );
}

assert.ok(repositoryCode.includes("extends BaseRepository"), "AttendanceRepository must use BaseRepository");
assert.ok(repositoryCode.includes('this.appRoot = "milkApp"'), "AttendanceRepository must preserve the milkApp root");
assert.ok(repositoryCode.includes('this.path("mcAttendance")'), "AttendanceRepository must read mcAttendance");
assert.ok(repositoryCode.includes('orderBy: "$key"'), "AttendanceRepository must query attendance by Firebase key");
assert.ok(repositoryCode.includes("\\uf8ff"), "AttendanceRepository must use the room-prefix upper bound");
assert.ok(repositoryCode.includes("applyAttendanceMutation"), "AttendanceRepository must expose the multi-location update boundary");
assert.ok(!repositoryCode.includes(".reduce("), "AttendanceRepository must not contain business aggregation");
assert.ok(!repositoryCode.includes("document."), "AttendanceRepository must not contain DOM logic");
assert.ok(!repositoryCode.includes("localStorage"), "AttendanceRepository must not own offline storage");

assert.ok(!serviceCode.includes("document."), "AttendanceService must not contain DOM logic");
assert.ok(!serviceCode.includes("localStorage"), "AttendanceService must not own the offline queue");
assert.ok(!serviceCode.includes("sessionStorage"), "AttendanceService must not own sessions");
assert.ok(!serviceCode.includes("fetch("), "AttendanceService must not fetch directly");
assert.ok(!serviceCode.includes("FirebaseService"), "AttendanceService must not access Firebase directly");
assert.ok(!managerCode.includes("FirebaseService"), "AttendanceManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "AttendanceManager must not fetch directly");

class RepositoryBaseStub {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
    }

    get(pathValue, query) {
        return this.firebaseService.get(pathValue, query);
    }

    update(pathValue, data) {
        return this.firebaseService.update(pathValue, data);
    }
}

const repositoryCalls = [];
const repositoryContext = {
    BaseRepository: RepositoryBaseStub,
    window: {
        FirebaseService: {
            get(pathValue, query) {
                repositoryCalls.push({ method: "get", path: pathValue, query });
                return {};
            },
            update(pathValue, data) {
                repositoryCalls.push({ method: "update", path: pathValue, data });
                return data;
            }
        }
    },
    String,
    Object,
    Array,
    Error,
    Promise
};
vm.runInNewContext(repositoryCode, repositoryContext);
await repositoryContext.window.AttendanceRepository.loadRoomAttendance("r1");
assert.deepEqual(
    toPlainData(repositoryCalls[0]),
    {
        method: "get",
        path: "milkApp/mcAttendance",
        query: {
            orderBy: "$key",
            startAt: "r1_",
            endAt: "r1_\uf8ff"
        }
    },
    "Room attendance must use the compatible Firebase key-prefix query"
);

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

const state = {
    attendance: {},
    roomStock: { r1: 20 },
    stockTransactions: {},
    stockLog: {},
    mutations: []
};

const repositoryMock = {
    async loadAttendanceRecord(roomId, date) {
        return state.attendance[`${roomId}_${date}`] || null;
    },
    async loadRoomAttendance(roomId) {
        return Object.fromEntries(
            Object.entries(state.attendance).filter(([key]) => key.startsWith(`${roomId}_`))
        );
    },
    async loadMutationState(roomId, date) {
        return {
            attendance: state.attendance[`${roomId}_${date}`] || null,
            roomStock: state.roomStock[roomId] ?? 0
        };
    },
    async applyAttendanceMutation(updates) {
        state.mutations.push(toPlainData(updates));
        Object.entries(updates).forEach(([key, value]) => {
            if (key.startsWith("mcAttendance/")) {
                const recordKey = key.slice("mcAttendance/".length);
                if (value === null) delete state.attendance[recordKey];
                else state.attendance[recordKey] = toPlainData(value);
            } else if (key.startsWith("roomStock/")) {
                state.roomStock[key.slice("roomStock/".length)] = value;
            } else if (key.startsWith("stockTransactions/")) {
                state.stockTransactions[key.slice("stockTransactions/".length)] = toPlainData(value);
            } else if (key.startsWith("stockLog/")) {
                state.stockLog[key.slice("stockLog/".length)] = toPlainData(value);
            }
        });
        return updates;
    }
};

let idNumber = 0;
const serviceContext = {
    window: {
        AttendanceRepository: null,
        TeacherService: teacherPolicy
    },
    console,
    Date,
    Math,
    Object,
    Array,
    Number,
    String,
    Error
};
vm.runInNewContext(serviceCode, serviceContext);
const AttendanceService = serviceContext.window.AttendanceService.constructor;
const service = new AttendanceService(repositoryMock, teacherPolicy, {
    clock: () => new Date("2026-07-27T12:00:00.000Z"),
    idFactory: () => `id${++idNumber}`
});

const teacherSession = {
    role: "teacher",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูทดสอบ"
};

const firstSave = await service.saveAttendance(teacherSession, {
    date: "2026-07-27",
    year: "2569",
    term: "1",
    data: {
        s1: "present",
        s2: "present",
        s3: "absent"
    },
    notes: { s3: "ลา" },
    photos: ["data:image/jpeg;base64,test"],
    signature: "data:image/png;base64,test"
});

assert.equal(firstSave.key, "r1_2026-07-27", "Attendance key must preserve roomId_date format");
assert.equal(firstSave.presentDifference, 2, "New attendance must consume the present count");
assert.equal(firstSave.roomStockBefore, 20, "New attendance must read the current Room Stock");
assert.equal(firstSave.roomStockAfter, 18, "New attendance must reduce only Room Stock");
assert.equal(firstSave.ledger.type, "ATTENDANCE", "New attendance must write an ATTENDANCE ledger entry");
assert.equal(firstSave.ledger.quantity, -2, "Attendance ledger quantity must be negative for consumption");
assert.equal(firstSave.mainStockDelta, 0, "Attendance must never change Main Stock");
assert.ok(!Object.prototype.hasOwnProperty.call(firstSave.updates, "stock"), "Attendance updates must not contain Main Stock");
assert.equal(state.attendance["r1_2026-07-27"].clsId, "r1", "Attendance record must preserve the legacy clsId field");

const editSave = await service.saveAttendance(teacherSession, {
    date: "2026-07-27",
    year: "2569",
    term: "1",
    data: {
        s1: "present",
        s2: "absent",
        s3: "absent"
    }
});

assert.equal(editSave.previousPresent, 2, "Attendance edit must use the previous present count");
assert.equal(editSave.presentDifference, -1, "Attendance edit must calculate only the present-count difference");
assert.equal(editSave.roomStockBefore, 18, "Attendance edit must start from the latest Room Stock");
assert.equal(editSave.roomStockAfter, 19, "Reducing present students must restore the difference to Room Stock");
assert.equal(editSave.ledger.quantity, 1, "Attendance edit ledger must restore the difference");
assert.equal(editSave.mainStockDelta, 0, "Attendance edit must never change Main Stock");

await assert.rejects(
    () => service.saveAttendance(teacherSession, {
        roomId: "r2",
        date: "2026-07-27",
        data: { s1: "present" }
    }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED",
    "Attendance service must reject cross-room writes"
);

const deletion = await service.deleteAttendance(teacherSession, {
    date: "2026-07-27"
});
assert.equal(deletion.restoredQuantity, 1, "Attendance deletion must restore the old present count");
assert.equal(deletion.roomStockAfter, 20, "Attendance deletion must restore Room Stock");
assert.equal(deletion.ledger.type, "ROLLBACK", "Attendance deletion must write a ROLLBACK ledger entry");
assert.equal(deletion.ledger.quantity, 1, "Attendance deletion rollback quantity must be positive");
assert.equal(deletion.mainStockDelta, 0, "Attendance deletion must never change Main Stock");
assert.equal(state.attendance["r1_2026-07-27"], undefined, "Attendance deletion must remove the record");

const managerEvents = [];
const managerContext = {
    window: {
        AttendanceService: service,
        AuthService: {
            getSession: () => teacherSession
        },
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
const manager = new AttendanceManager(service, managerContext.window.AuthService);
const managerSave = await manager.save({
    date: "2026-07-28",
    data: { s1: "present", s2: "absent" }
});
assert.equal(managerSave.roomStockAfter, 19, "AttendanceManager must delegate Room Stock rules to the service");
assert.equal(manager.history["r1_2026-07-28"].date, "2026-07-28", "AttendanceManager must cache the saved day");
assert.equal(managerEvents.at(-1).name, "milkapp:attendance-saved", "AttendanceManager must emit the saved event");
await manager.remove({ date: "2026-07-28" });
assert.equal(manager.history["r1_2026-07-28"], undefined, "AttendanceManager must remove deleted history from its cache");
assert.equal(state.roomStock.r1, 20, "Manager deletion must restore Room Stock through the service");

console.log("Attendance module checks passed.");
