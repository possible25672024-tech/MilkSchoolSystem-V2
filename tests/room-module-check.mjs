import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const clone = value => structuredClone(value);

const indexCode = read("index-v2.html");
const baseRepositoryCode = read("modules/repositories/baseRepository.js");
const repositoryCode = read("modules/repositories/roomRepository.js");
const serviceCode = read("modules/services/roomService.js");
const managerCode = read("modules/room/roomManager.js");

for (const [name, source] of [
    ["roomRepository.js", repositoryCode],
    ["roomService.js", serviceCode],
    ["roomManager.js", managerCode]
]) {
    assert.doesNotThrow(
        () => new vm.Script(source),
        `${name} must contain valid JavaScript`
    );
}

const loadOrder = [
    "modules/services/firebaseService.js",
    "modules/repositories/baseRepository.js",
    "modules/repositories/stockRepository.js",
    "modules/repositories/reportRepository.js",
    "modules/repositories/roomRepository.js",
    "modules/services/stockService.js",
    "modules/services/reportService.js",
    "modules/services/roomService.js",
    "modules/stock/stockManager.js",
    "modules/report/reportManager.js",
    "modules/room/roomManager.js",
    "modules/core/app.js"
];

for (let position = 0; position < loadOrder.length - 1; position += 1) {
    assert.ok(
        indexCode.indexOf(loadOrder[position]) < indexCode.indexOf(loadOrder[position + 1]),
        `${loadOrder[position]} must load before ${loadOrder[position + 1]}`
    );
}

assert.ok(repositoryCode.includes("extends BaseRepository"), "RoomRepository must use BaseRepository");
assert.ok(repositoryCode.includes('this.appRoot = "milkApp"'), "RoomRepository must preserve the milkApp root");
assert.ok(repositoryCode.includes('this.path("rooms")'), "RoomRepository must read and write milkApp/rooms");
assert.ok(repositoryCode.includes('this.path("roomStock")'), "RoomRepository must inspect Room Stock before deletion");
assert.ok(repositoryCode.includes('this.path("distributes")'), "RoomRepository must inspect classroom distributions");
assert.ok(repositoryCode.includes('this.path("mcAttendance")'), "RoomRepository must inspect attendance records");
assert.ok(repositoryCode.includes('this.path("stockTransactions")'), "RoomRepository must inspect stock ledger references");
assert.ok(!repositoryCode.includes("document."), "RoomRepository must not contain DOM logic");
assert.ok(!repositoryCode.includes("localStorage"), "RoomRepository must not own local storage");
assert.ok(!repositoryCode.includes("sessionStorage"), "RoomRepository must not own sessions");
assert.ok(!repositoryCode.includes(".reduce("), "RoomRepository must not contain business aggregation calculations");
assert.ok(
    repositoryCode.includes("updateRoomTeacher"),
    "RoomRepository must expose a scoped teacher-name update"
);
assert.ok(
    repositoryCode.includes("rooms/${storageKey}/teacher"),
    "Teacher-name updates must target only the matched room teacher leaf"
);

const teacherLeafWrites = [];
const repositoryFirebase = {
    async get(pathName) {
        assert.equal(pathName, "milkApp/rooms");
        return {
            firebaseKey: {
                id: "room-authenticated",
                name: "อ.3-6",
                teacher: "ครูเดิม",
                students: [{ id: "student-1" }],
                stock: 40
            }
        };
    },
    async set(pathName, value) {
        teacherLeafWrites.push({ pathName, value });
        return value;
    }
};
const repositoryContext = {
    window: {
        FirebaseService: repositoryFirebase,
        StockRepository: null
    },
    Promise,
    String,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(baseRepositoryCode, repositoryContext);
vm.runInNewContext(repositoryCode, repositoryContext);
const RoomRepository = repositoryContext.window.RoomRepository.constructor;
const scopedRepository = new RoomRepository(repositoryFirebase, null);
await scopedRepository.updateRoomTeacher("room-authenticated", "ครูชื่อใหม่");
assert.deepEqual(
    teacherLeafWrites,
    [{ pathName: "milkApp/rooms/firebaseKey/teacher", value: "ครูชื่อใหม่" }],
    "Teacher profile must write only the matched Firebase room teacher leaf"
);

assert.ok(!serviceCode.includes("document."), "RoomService must not contain DOM logic");
assert.ok(!serviceCode.includes("localStorage"), "RoomService must not own local storage");
assert.ok(!serviceCode.includes("sessionStorage"), "RoomService must not own sessions");
assert.ok(!serviceCode.includes("fetch("), "RoomService must not fetch directly");
assert.ok(!serviceCode.includes("FirebaseService"), "RoomService must not access Firebase directly");
assert.ok(!managerCode.includes("FirebaseService"), "RoomManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "RoomManager must not fetch directly");
assert.ok(!managerCode.includes("document."), "RoomManager must remain UI-framework neutral");

const serviceContext = {
    window: { RoomRepository: null },
    console,
    Date,
    Math,
    Map,
    Set,
    Object,
    Array,
    Number,
    String,
    Error
};
vm.runInNewContext(serviceCode, serviceContext);
const RoomService = serviceContext.window.RoomService.constructor;

class MockRoomRepository {
    constructor(rooms = [], context = {}) {
        this.rooms = clone(rooms);
        this.context = clone(context);
        this.saveCalls = 0;
    }

    async loadRooms() {
        return clone(this.rooms);
    }

    async saveRooms(rooms) {
        this.rooms = clone(rooms);
        this.saveCalls += 1;
        return clone(this.rooms);
    }

    async loadRoomContext() {
        return {
            rooms: clone(this.rooms),
            roomStock: {},
            distributes: [],
            attendance: {},
            absentMilk: {},
            retroMilk: {},
            vacationMilk: {},
            stockTransactions: {},
            ...clone(this.context)
        };
    }
}

let generatedId = 0;
const createId = () => `generated-room-${++generatedId}`;

const normalizationService = new RoomService(null, { idFactory: createId });
const normalizedObjectRooms = normalizationService.normalizeCollection({
    alpha: { name: " อ.1-1 ", teacher: " ครู ก ", count: 5, stock: 3 }
});
assert.equal(normalizedObjectRooms[0].id, "alpha", "Object-keyed Firebase rooms must retain their key as the room id");
assert.equal(normalizedObjectRooms[0].name, "อ.1-1", "Room names must be trimmed");
assert.equal(normalizedObjectRooms[0].stock, 3, "Room normalization must preserve Room Stock");

const createRepository = new MockRoomRepository([
    { id: "r1", name: "อ.3-1", level: "อ.3", teacher: "ครูเดิม", count: 2, students: [], stock: 7 }
]);
const createService = new RoomService(createRepository, { idFactory: createId });
const created = await createService.createRoom({
    name: "อ.3-2",
    level: "อ.3",
    teacher: "ครูใหม่",
    count: 5
});
assert.equal(created.ok, true, "Manual room creation must succeed for valid data");
assert.equal(created.room.count, 5, "Manual room creation must retain the entered student count when no student list exists");
assert.equal(created.room.students.length, 0, "Manual room creation must not invent student records");
assert.equal(created.room.stock, 0, "New rooms must start with zero Room Stock");

const duplicateCreate = await createService.createRoom({ name: " อ.3-2 ", count: 5 });
assert.equal(duplicateCreate.ok, false, "Duplicate room names must be rejected");
assert.ok(
    duplicateCreate.errors.some(error => error.code === "ROOM_NAME_DUPLICATE"),
    "Duplicate room validation must identify the room name"
);

const updateRepository = new MockRoomRepository([
    {
        id: "r1",
        name: "อ.3-1",
        level: "อ.3",
        teacher: "ครูเดิม",
        count: 2,
        students: [{ "รหัสประจำตัว": "001", "ชื่อ": "หนึ่ง" }, { "รหัสประจำตัว": "002", "ชื่อ": "สอง" }],
        stock: 12
    },
    { id: "r2", name: "อ.3-2", level: "อ.3", teacher: "ครูสอง", count: 1, students: [], stock: 0 }
]);
const updateService = new RoomService(updateRepository, { idFactory: createId });
const immutableId = await updateService.updateRoom("r1", { id: "changed-id", name: "อ.3-1" });
assert.equal(immutableId.code, "ROOM_ID_IMMUTABLE", "Existing room ids must be immutable");

const updated = await updateService.updateRoom("r1", {
    name: "อ.3-1 ปรับปรุง",
    teacher: "ครูปรับปรุง",
    count: 2
});
assert.equal(updated.ok, true, "Room metadata updates must succeed");
assert.equal(updated.room.id, "r1", "Room updates must preserve the original id");
assert.equal(updated.room.stock, 12, "Room updates must preserve Room Stock");
assert.equal(updated.room.students.length, 2, "Room updates must preserve students when no replacement list is supplied");

const duplicateUpdate = await updateService.updateRoom("r1", { name: "อ.3-2" });
assert.equal(duplicateUpdate.ok, false, "Room updates must reject another room's name");

const importExistingRooms = [
    {
        id: "existing-room",
        name: "ป.2-1",
        level: "ป.2",
        teacher: "ครูเดิม",
        count: 1,
        students: [{ "รหัสประจำตัว": "old" }],
        stock: 9
    }
];
const importService = new RoomService(null, { idFactory: createId });
const importPreview = importService.prepareImport([
    {
        name: "ป.2-1",
        parsed: {
            teacher: "ครูใหม่",
            students: [
                { "รหัสประจำตัว": "101", "ชื่อ": "เด็กหนึ่ง" },
                { "รหัสประจำตัว": "102", "ชื่อ": "เด็กสอง" }
            ]
        }
    },
    {
        name: "ป2-2",
        parsed: {
            teacher: "ครูสอง",
            students: [{ "รหัสประจำตัว": "201", "ชื่อ": "เด็กสาม" }]
        }
    }
], importExistingRooms);
assert.equal(importPreview.valid, true, "Valid student sheets must produce an import preview");
assert.equal(importPreview.roomCount, 2, "Import preview must include every sheet");
assert.equal(importPreview.importedStudents, 3, "Import preview must count all imported students");
const importedExisting = importPreview.rooms.find(room => room.id === "existing-room");
assert.equal(importedExisting.id, "existing-room", "Repeated room imports must preserve the existing room id");
assert.equal(importedExisting.stock, 9, "Repeated room imports must preserve Room Stock");
assert.equal(importedExisting.level, "ป.2", "Repeated room imports must preserve the configured grade when the sheet has no grade");
assert.equal(importedExisting.teacher, "ครูใหม่", "Repeated room imports may update the teacher from the sheet");
assert.equal(importedExisting.count, 2, "Imported room counts must match the imported student list");

const duplicateStudentImport = importService.prepareImport([
    {
        name: "ป.3-1",
        parsed: {
            students: [
                { "รหัสประจำตัว": "301", "ชื่อ": "ซ้ำ" },
                { "รหัสประจำตัว": "301", "ชื่อ": "ซ้ำ" }
            ]
        }
    }
], []);
assert.equal(duplicateStudentImport.valid, false, "Imports with duplicate students must be rejected");
assert.equal(duplicateStudentImport.errors[0].code, "IMPORT_STUDENT_DUPLICATE", "Duplicate student imports must return a specific error code");

const blockedRepository = new MockRoomRepository([
    { id: "blocked", name: "ป.4-1", count: 1, students: [], stock: 0 }
], {
    roomStock: { blocked: 0 },
    distributes: [{ roomId: "blocked", total: 10 }],
    attendance: { "blocked_2026-07-27": { data: {} } },
    absentMilk: { a1: { roomId: "blocked" } },
    retroMilk: {},
    vacationMilk: {},
    stockTransactions: { t1: { roomId: "blocked", type: "DISTRIBUTE" } }
});
const blockedService = new RoomService(blockedRepository, { idFactory: createId });
const blockedDelete = await blockedService.deleteRoom("blocked");
assert.equal(blockedDelete.ok, false, "Room deletion must be blocked when operational references exist");
assert.equal(blockedDelete.code, "ROOM_HAS_DEPENDENCIES", "Blocked deletion must return the dependency code");
assert.equal(blockedDelete.report.roomStockRecordExists, true, "A zero-valued Room Stock record must still block deletion");
assert.equal(blockedDelete.report.dependencies.distributes, 1, "Classroom distribution dependencies must be reported");
assert.equal(blockedDelete.report.dependencies.attendance, 1, "Attendance dependencies must be reported");
assert.equal(blockedRepository.saveCalls, 0, "Blocked deletion must not write the room collection");

const safeRepository = new MockRoomRepository([
    { id: "safe", name: "ห้องใหม่", count: 0, students: [], stock: 0 }
]);
const safeService = new RoomService(safeRepository, { idFactory: createId });
const safeDelete = await safeService.deleteRoom("safe");
assert.equal(safeDelete.ok, true, "A room without references may be deleted");
assert.equal(safeRepository.rooms.length, 0, "Safe deletion must remove only the selected room");
assert.equal(safeRepository.saveCalls, 1, "Safe deletion must persist the new room collection once");

const managerRepository = new MockRoomRepository([
    { id: "m1", name: "ม.1-1", level: "ม.1", teacher: "ครู ม", count: 1, students: [], stock: 0 }
]);
const managerService = new RoomService(managerRepository, { idFactory: createId });
const managerContext = {
    window: {
        RoomService: managerService,
        dispatchEvent: () => {}
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    console,
    Error,
    Array,
    String
};
vm.runInNewContext(managerCode, managerContext);
const RoomManager = managerContext.window.RoomManager.constructor;
const manager = new RoomManager(managerService);
await manager.refresh();
assert.equal(manager.getRooms().length, 1, "RoomManager must expose loaded rooms");
const managerCreate = await manager.create({ name: "ม.1-2", count: 3 });
assert.equal(managerCreate.ok, true, "RoomManager must route room creation through RoomService");
assert.equal(manager.getRooms().length, 2, "RoomManager must refresh its in-memory rooms after creation");

console.log("Room module checks passed.");
