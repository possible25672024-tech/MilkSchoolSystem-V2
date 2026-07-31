import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const source = fs.readFileSync(path.join(root, "modules/services/roomService.js"), "utf8");
const repositorySource = fs.readFileSync(path.join(root, "modules/repositories/roomRepository.js"), "utf8");

assert.match(repositorySource, /loadRoomsWithEtag/, "RoomRepository must expose versioned roster reads");
assert.match(repositorySource, /replaceRoomsIfMatch/, "RoomRepository must expose conditional roster writes");
assert.match(repositorySource, /getWithEtag/, "Room roster preview must use a Firebase ETag");
assert.match(repositorySource, /setIfMatch/, "Room roster confirmation must use If-Match");

const context = {
    window: { RoomRepository: null },
    Date,
    Math,
    Map,
    Set,
    Object,
    Array,
    Number,
    String,
    Error,
    console
};
vm.runInNewContext(source, context);
const RoomService = context.window.RoomService.constructor;

class VersionedRoomRepository {
    constructor({ conflict = false } = {}) {
        this.rooms = [{
            id: "room-existing",
            name: "ป.1-1",
            level: "ป.1",
            teacher: "ครูเดิม",
            count: 1,
            students: [{ "รหัสประจำตัว": "old", "ชื่อ": "เดิม" }],
            stock: 77
        }];
        this.conflict = conflict;
        this.writeCalls = [];
    }

    async loadRooms() {
        return structuredClone(this.rooms);
    }

    async saveRooms(rooms) {
        this.rooms = structuredClone(rooms);
    }

    async loadRoomsWithEtag() {
        return { value: structuredClone(this.rooms), etag: '"roster-v1"' };
    }

    async replaceRoomsIfMatch(rooms, etag) {
        this.writeCalls.push({ rooms: structuredClone(rooms), etag });
        if (this.conflict) return { status: "conflict", value: this.rooms, etag: '"roster-v2"' };
        this.rooms = structuredClone(rooms);
        return { status: "ok", value: this.rooms, etag: '"roster-v2"' };
    }
}

const sheets = [{
    name: "ป.1-1",
    parsed: {
        teacher: "ครูใหม่",
        students: [
            { "เลขที่": "1", "รหัสประจำตัว": "001", "ชื่อ": "หนึ่ง", "เพศ": "ชาย" },
            { "เลขที่": "2", "รหัสประจำตัว": "002", "ชื่อ": "สอง", "เพศ": "หญิง" }
        ]
    }
}];

const repository = new VersionedRoomRepository();
const service = new RoomService(repository);
const preview = await service.prepareImportSnapshot(sheets);
assert.equal(preview.valid, true, "A versioned roster preview must be valid");
assert.equal(preview.etag, '"roster-v1"', "Preview must retain the ETag");
assert.equal(preview.rooms[0].id, "room-existing", "Repeated import must preserve roomId");
assert.equal(preview.rooms[0].stock, 77, "Repeated import must preserve embedded Room Stock");
assert.equal(preview.rooms[0].students.length, 2, "Preview must contain only imported students");
assert.equal(
    preview.rooms[0].students.some(student => /^student_\d+$/i.test(String(student.id || ""))),
    false,
    "Import must never create generated student_* rows"
);

const confirmed = await service.confirmImportSnapshot(preview);
assert.equal(confirmed.ok, true, "Unchanged ETag must allow confirmation");
assert.equal(repository.writeCalls.length, 1, "Confirmation must perform one conditional rooms write");
assert.equal(repository.writeCalls[0].etag, '"roster-v1"');
assert.equal(repository.writeCalls[0].rooms[0].stock, 77, "Conditional write must retain Room Stock");
assert.deepEqual(
    Object.keys(repository.writeCalls[0]),
    ["rooms", "etag"],
    "Sprint 5.5 must not write Main Stock, Room Stock, ledger or milk history paths"
);

const conflictRepository = new VersionedRoomRepository({ conflict: true });
const conflictService = new RoomService(conflictRepository);
const conflictPreview = await conflictService.prepareImportSnapshot(sheets);
const conflict = await conflictService.confirmImportSnapshot(conflictPreview);
assert.equal(conflict.ok, false, "Changed ETag must block the import");
assert.equal(conflict.code, "ROOM_IMPORT_CONFLICT");
assert.equal(conflictRepository.rooms[0].students[0]["รหัสประจำตัว"], "old", "Conflict must leave current data unchanged");

const duplicateAcrossRooms = service.prepareImport([
    {
        name: "ป.2-1",
        parsed: { students: [{ "รหัสประจำตัว": "999", "ชื่อ": "เด็กหนึ่ง" }] }
    },
    {
        name: "ป.2-2",
        parsed: { students: [{ studentId: "999", "ชื่อ": "เด็กหนึ่ง" }] }
    }
], []);
assert.equal(duplicateAcrossRooms.valid, false, "The same strong student id in two rooms must be blocked");
assert.ok(
    duplicateAcrossRooms.errors.some(error => error.code === "IMPORT_STUDENT_CROSS_ROOM_DUPLICATE")
);

console.log("Room import concurrency and stock-isolation checks passed.");
