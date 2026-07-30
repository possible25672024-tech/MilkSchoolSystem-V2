import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plain = value => JSON.parse(JSON.stringify(value));

const indexCode = read("index-v2.html");
const firebaseCode = read("modules/services/firebaseService.js");
const baseRepositoryCode = read("modules/repositories/baseRepository.js");
const repositoryCode = read("modules/repositories/teacherRepository.js");
const serviceCode = read("modules/services/teacherService.js");
const managerCode = read("modules/teacher/teacherManager.js");

for (const [name, source] of [
    ["firebaseService.js", firebaseCode],
    ["baseRepository.js", baseRepositoryCode],
    ["teacherRepository.js", repositoryCode],
    ["teacherService.js", serviceCode],
    ["teacherManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

const loadOrder = [
    "modules/services/firebaseService.js",
    "modules/repositories/baseRepository.js",
    "modules/repositories/roomRepository.js",
    "modules/repositories/teacherRepository.js",
    "modules/services/roomService.js",
    "modules/services/teacherService.js",
    "modules/login/authService.js",
    "modules/room/roomManager.js",
    "modules/teacher/teacherManager.js",
    "modules/core/app.js"
];

for (let index = 0; index < loadOrder.length - 1; index += 1) {
    assert.ok(
        indexCode.indexOf(loadOrder[index]) < indexCode.indexOf(loadOrder[index + 1]),
        `${loadOrder[index]} must load before ${loadOrder[index + 1]}`
    );
}

assert.ok(repositoryCode.includes("extends BaseRepository"), "TeacherRepository must use BaseRepository");
assert.ok(repositoryCode.includes('this.appRoot = "milkApp"'), "TeacherRepository must preserve the milkApp root");
assert.ok(repositoryCode.includes('this.path("mcAttendance")'), "TeacherRepository must read the attendance path");
assert.ok(repositoryCode.includes('orderBy: "$key"'), "Teacher attendance must use a key query");
assert.ok(repositoryCode.includes("startAt:"), "Teacher attendance must use a room-prefix lower bound");
assert.ok(repositoryCode.includes("endAt:"), "Teacher attendance must use a room-prefix upper bound");
assert.ok(!repositoryCode.includes(".set("), "TeacherRepository must remain read-only in Sprint 3.6");
assert.ok(!repositoryCode.includes(".update("), "TeacherRepository must not update Firebase in Sprint 3.6");
assert.ok(!repositoryCode.includes(".push("), "TeacherRepository must not push Firebase records in Sprint 3.6");
assert.ok(!repositoryCode.includes(".remove("), "TeacherRepository must not remove Firebase records in Sprint 3.6");
assert.ok(!repositoryCode.includes(".reduce("), "TeacherRepository must not calculate teacher totals");

for (const forbidden of ["document.", "localStorage", "sessionStorage", "fetch(", "FirebaseService"]) {
    assert.ok(!serviceCode.includes(forbidden), `TeacherService must not contain ${forbidden}`);
}
assert.ok(!managerCode.includes("FirebaseService"), "TeacherManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "TeacherManager must not fetch directly");

const firebaseContext = {
    window: {
        ConfigManager: {
            getFirebaseConfig: () => ({}),
            getDatabaseURL: () => "",
            getAuthToken: () => ""
        }
    },
    URLSearchParams,
    AbortController,
    fetch: async () => { throw new Error("fetch should not run in URL test"); },
    setTimeout,
    clearTimeout,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Error,
    console
};
vm.runInNewContext(firebaseCode, firebaseContext);
const FirebaseService = firebaseContext.window.FirebaseService.constructor;
const firebaseService = new FirebaseService();
firebaseService.databaseURL = "https://example.firebaseio.com";
firebaseService.authToken = "secret";
const scopedURL = firebaseService.buildURL("milkApp/mcAttendance", {
    orderBy: "$key",
    startAt: "r1_",
    endAt: "r1_\uf8ff"
});
assert.ok(scopedURL.includes("orderBy=%22%24key%22"), "Firebase query must JSON-encode orderBy");
assert.ok(scopedURL.includes("startAt=%22r1_%22"), "Firebase query must JSON-encode startAt");
assert.ok(scopedURL.includes("endAt=%22r1_%EF%A3%BF%22"), "Firebase query must JSON-encode the room prefix upper bound");
assert.ok(scopedURL.includes("auth=secret"), "Firebase query must preserve authentication");

const serviceContext = {
    window: { TeacherRepository: null },
    Set,
    Object,
    Array,
    String,
    Number,
    Error,
    Math,
    JSON,
    console
};
vm.runInNewContext(serviceCode, serviceContext);
const TeacherService = serviceContext.window.TeacherService.constructor;

const rawSnapshot = {
    settings: { school: "โรงเรียนทดสอบ" },
    rooms: [
        {
            id: "r1",
            name: "อ.3-1",
            teacher: "ครูหนึ่ง",
            count: 3,
            stock: 999,
            students: [
                { id: "s1", "เลขที่": 1, "ชื่อ": "หนึ่ง", "นามสกุล": "ทดสอบ", "เพศ": "ชาย" },
                { id: "s2", "เลขที่": 2, "ชื่อ": "สอง", "นามสกุล": "ทดสอบ", "เพศ": "หญิง" },
                { id: "s3", "เลขที่": 3, "ชื่อ": "สาม", "นามสกุล": "ทดสอบ" }
            ]
        },
        { id: "r2", name: "อ.3-2", teacher: "ครูสอง", count: 1, students: [] }
    ],
    roomStock: 40,
    distributes: {
        d1: { roomId: "r1", total: 20 },
        d2: { roomId: "r1", total: 30 },
        d3: { roomId: "r2", total: 99 }
    },
    attendance: {
        "r1_2026-07-27": { data: { s1: "present", s2: "present", s3: "absent" } },
        "r2_2026-07-27": { data: { other: "present" } }
    },
    absentMilk: {
        a1: { roomId: "r1", totalBoxes: 3 },
        a2: { roomId: "r2", totalBoxes: 50 }
    },
    retroMilk: {
        rt1: { roomId: "r1", totalBoxes: 5 }
    },
    vacationMilk: {
        v1: { roomId: "r1", totalBoxes: 4 }
    },
    stockTransactions: {
        tx1: { roomId: "r1", type: "ATTENDANCE", quantity: -2, createdAt: "2026-07-27T10:00:00.000Z" },
        tx2: { roomId: "r2", type: "ATTENDANCE", quantity: -1, createdAt: "2026-07-27T11:00:00.000Z" }
    },
    updatedAt: { rooms: 1 }
};

const fakeRepository = {
    requestedRoomId: null,
    async loadTeacherSnapshot(roomId) {
        this.requestedRoomId = roomId;
        return structuredClone(rawSnapshot);
    }
};
const profileWrites = [];
const fakeRoomRepository = {
    async updateRoomTeacher(roomId, teacher) {
        profileWrites.push({ roomId, teacher });
        return { roomId, storageKey: "0" };
    }
};
const service = new TeacherService(fakeRepository, fakeRoomRepository);
const teacherSession = {
    classId: "r1",
    roomId: "r1",
    roomName: "อ.3-1",
    teacher: "ครูหนึ่ง",
    schoolName: "โรงเรียนทดสอบ",
    role: "teacher",
    isAdmin: false
};

assert.equal(service.validateSession(teacherSession).valid, true, "A room teacher session must be valid");
assert.equal(service.validateSession({ classId: "__admin__", role: "admin" }).valid, false, "Admin session must not become a teacher session");
assert.throws(
    () => service.assertRoomAccess(teacherSession, "r2"),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED",
    "TeacherService must reject cross-room access"
);
await assert.rejects(
    () => service.updateTeacherProfile(teacherSession, { roomId: "r2", teacher: "ครูใหม่" }),
    error => error.code === "TEACHER_CROSS_ROOM_ACCESS_DENIED",
    "Teacher profile writes must reject another room"
);
await assert.rejects(
    () => service.updateTeacherProfile(teacherSession, { teacher: "   " }),
    error => error.code === "TEACHER_NAME_REQUIRED",
    "Teacher profile writes must require a teacher name"
);
const profileResult = await service.updateTeacherProfile(teacherSession, {
    roomId: "r1",
    teacher: "  ครู   ชื่อใหม่  "
});
assert.deepEqual(profileWrites, [{ roomId: "r1", teacher: "ครู ชื่อใหม่" }]);
assert.equal(profileResult.teacher, "ครู ชื่อใหม่");

const sourceBefore = JSON.stringify(rawSnapshot);
const teacherView = await service.loadTeacherView(teacherSession);
assert.equal(fakeRepository.requestedRoomId, "r1", "TeacherRepository must receive only the authenticated room id");
assert.equal(JSON.stringify(rawSnapshot), sourceBefore, "Teacher calculations must not mutate source data");
assert.equal(teacherView.snapshot.room.id, "r1", "Teacher snapshot must expose only the authenticated room");
assert.equal(teacherView.snapshot.students.length, 3, "Teacher snapshot must normalize the active room students");
assert.equal(Object.keys(teacherView.snapshot.attendance).length, 1, "Teacher snapshot must exclude another room attendance");
assert.equal(teacherView.snapshot.distributes.length, 2, "Teacher snapshot must exclude another room distributions");
assert.equal(teacherView.snapshot.stockTransactions.length, 1, "Teacher snapshot must exclude another room ledger records");
assert.deepEqual(
    plain(teacherView.dashboard),
    {
        roomId: "r1",
        roomName: "อ.3-1",
        teacher: "ครูหนึ่ง",
        students: 3,
        distributed: 50,
        attendanceUsed: 2,
        pendingUsed: 3,
        retroUsed: 5,
        vacationUsed: 4,
        usedTotal: 14,
        expectedRoomStock: 36,
        actualRoomStock: 40,
        variance: 4,
        attendanceDays: 1,
        recentTransactions: [
            { id: "tx1", roomId: "r1", type: "ATTENDANCE", quantity: -2, createdAt: "2026-07-27T10:00:00.000Z" }
        ]
    },
    "Teacher dashboard must preserve room-scoped stock calculations"
);

for (const type of ["ATTENDANCE", "PENDING", "RETRO", "VACATION"]) {
    const command = service.prepareRoomStockCommand(teacherSession, type, 2, { roomId: "r1", referenceId: "ref1" });
    assert.equal(command.roomId, "r1", `${type} must target the authenticated room`);
    assert.equal(command.roomStockDelta, -2, `${type} must reduce Room Stock`);
    assert.equal(command.mainStockDelta, 0, `${type} must never change Main Stock`);
}

const rollback = service.prepareRollbackCommand(teacherSession, 2, { roomId: "r1", originalType: "ATTENDANCE" });
assert.equal(rollback.roomStockDelta, 2, "Teacher rollback must restore Room Stock");
assert.equal(rollback.mainStockDelta, 0, "Teacher rollback must not change Main Stock");
assert.equal(service.attendanceKey("r1", "2026-07-27"), "r1_2026-07-27", "Attendance key format must remain compatible");

const events = [];
const managerContext = {
    window: {
        TeacherService: service,
        AuthService: {
            getSession: () => teacherSession,
            saveSession: session => Object.assign(teacherSession, session)
        },
        addEventListener: () => {},
        dispatchEvent: event => events.push(event)
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    Error,
    console
};
vm.runInNewContext(managerCode, managerContext);
const TeacherManager = managerContext.window.TeacherManager.constructor;
const manager = new TeacherManager(service, managerContext.window.AuthService);
manager.initialize();
await manager.refresh();
assert.equal(manager.getDashboard().roomId, "r1", "TeacherManager must expose the authenticated room dashboard");
assert.equal(manager.prepareRoomStockCommand("ATTENDANCE", 1).mainStockDelta, 0, "TeacherManager commands must preserve Main Stock isolation");
const managerProfile = await manager.updateTeacherProfile({ teacher: "ครูบันทึกแล้ว" });
assert.equal(managerProfile.teacher, "ครูบันทึกแล้ว");
assert.equal(teacherSession.teacher, "ครูบันทึกแล้ว");
assert.equal(manager.getSnapshot().room.teacher, "ครูบันทึกแล้ว");
const profileEvent = events.find(event => event.name === "milkapp:teacher-profile-updated");
assert.deepEqual(plain(profileEvent.detail), { roomId: "r1" });
assert.ok(!JSON.stringify(profileEvent.detail).includes("ครูบันทึกแล้ว"), "Teacher profile events must be metadata-only");
manager.clear();
assert.equal(manager.getSnapshot(), null, "TeacherManager clear must remove cached teacher data");

console.log("Teacher module checks passed.");
