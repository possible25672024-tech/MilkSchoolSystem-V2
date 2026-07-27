import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const loginServiceCode = read("modules/services/loginService.js");
const baseRepositoryCode = read("modules/repositories/baseRepository.js");
const repositoryCode = read("modules/repositories/teacherRepository.js");
const managerCode = read("modules/teacher/teacherManager.js");

const loginContext = {
    window: { LoginRepository: null },
    Date,
    String,
    Number,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(loginServiceCode, loginContext);
const LoginService = loginContext.window.LoginService.constructor;
const loginService = new LoginService({
    async loadLoginContext() {
        return {
            settings: {
                school: "โรงเรียนทดสอบ",
                teacherPassword: "1234"
            },
            rooms: [
                {
                    id: "r1",
                    name: "อ.3-1",
                    teacher: "ครูหนึ่ง",
                    students: [{ id: "s1", name: "นักเรียนหนึ่ง" }]
                }
            ]
        };
    }
});
const loginResult = await loginService.login("r1", "1234");
assert.equal(loginResult.ok, true, "Teacher login fixture must succeed");
assert.equal(loginResult.session.roomSnapshot.id, "r1", "Teacher session must carry the authenticated room snapshot");
assert.equal(loginResult.session.roomSnapshot.students.length, 1, "Teacher room snapshot must preserve students");

const calls = [];
const firebase = {
    get(pathName, query = {}) {
        calls.push({ path: pathName, query: { ...query } });

        if (pathName.endsWith("/settings")) {
            return Promise.resolve({ school: "โรงเรียนทดสอบ" });
        }
        if (pathName.endsWith("/rooms")) {
            return Promise.resolve({
                0: { id: "r1", name: "อ.3-1", teacher: "ครูหนึ่ง", students: [] }
            });
        }
        if (pathName.includes("/roomStock/")) {
            return Promise.resolve(12);
        }
        if (pathName.endsWith("/data")) {
            return Promise.resolve({ s1: "present", s2: "absent" });
        }
        return Promise.resolve({});
    }
};

const repositoryContext = {
    window: { FirebaseService: firebase },
    Promise,
    String,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(baseRepositoryCode, repositoryContext);
vm.runInNewContext(repositoryCode, repositoryContext);
const TeacherRepository = repositoryContext.window.TeacherRepository.constructor;
const repository = new TeacherRepository(firebase);
const roomSnapshot = {
    id: "r1",
    name: "อ.3-1",
    teacher: "ครูหนึ่ง",
    students: [{ id: "s1", name: "นักเรียนหนึ่ง" }]
};

const snapshot = await repository.loadTeacherSnapshot("r1", {
    includeExtras: false,
    attendanceDate: "2026-07-27",
    roomSnapshot
});

assert.equal(calls.length, 4, "Session-backed Teacher core refresh must use four Firebase requests");
assert.equal(
    calls.some(call => call.path.endsWith("/rooms")),
    false,
    "Session-backed Teacher core refresh must not download or query the rooms collection"
);
assert.equal(snapshot.roomSource, "session", "Teacher core snapshot must report the session room source");

const attendanceCall = calls.find(call => call.path.includes("/mcAttendance/"));
assert.ok(attendanceCall, "Teacher core refresh must load an attendance summary");
assert.equal(
    attendanceCall.path,
    "milkApp/mcAttendance/r1_2026-07-27/data",
    "Teacher core refresh must read only today's attendance data child"
);
assert.deepEqual(attendanceCall.query, {}, "Date summary read must not request room-wide attendance history");
assert.equal(
    calls.some(call => call.path === "milkApp/mcAttendance"),
    false,
    "Default Teacher core refresh must not download all attendance history for the room"
);
assert.equal(snapshot.attendanceScope.mode, "date-summary", "Snapshot must report the date-summary scope");
assert.equal(snapshot.attendanceScope.date, "2026-07-27", "Snapshot must retain the requested attendance date");
assert.deepEqual(
    snapshot.attendance["r1_2026-07-27"].data,
    { s1: "present", s2: "absent" },
    "Date summary must preserve attendance status data"
);

const managerOptions = [];
const managerContext = {
    window: {
        TeacherService: {
            requireSession: () => "r1",
            async loadTeacherView(session, options) {
                managerOptions.push({ ...options });
                return {
                    snapshot: {
                        room: { id: session.roomId },
                        extrasLoaded: options.includeExtras,
                        attendanceScope: options.attendanceDate
                            ? { mode: "date-summary", date: options.attendanceDate }
                            : { mode: "room-history", date: null },
                        roomSource: options.roomSnapshot ? "session" : "firebase-fallback"
                    },
                    dashboard: { roomId: session.roomId }
                };
            },
            prepareRoomStockCommand: () => ({ mainStockDelta: 0 }),
            prepareRollbackCommand: () => ({ mainStockDelta: 0 })
        },
        AuthService: {
            getSession: () => ({
                roomId: "r1",
                classId: "r1",
                role: "teacher",
                roomSnapshot
            })
        },
        addEventListener: () => {},
        dispatchEvent: () => {}
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    Date,
    String,
    Error,
    console
};
vm.runInNewContext(managerCode, managerContext);
const TeacherManager = managerContext.window.TeacherManager.constructor;
const manager = new TeacherManager(
    managerContext.window.TeacherService,
    managerContext.window.AuthService
);
manager.today = () => "2026-07-27";
manager.initialize();

await manager.refresh();
await manager.refreshFull();

assert.equal(managerOptions[0].includeExtras, false, "Normal refresh must remain a core refresh");
assert.equal(
    managerOptions[0].attendanceDate,
    "2026-07-27",
    "Normal refresh must default to today's attendance summary"
);
assert.equal(managerOptions[0].roomSnapshot.id, "r1", "Normal refresh must reuse the authenticated room snapshot");
assert.equal(managerOptions[1].includeExtras, true, "Full refresh must request deferred data");
assert.equal(managerOptions[1].roomSnapshot.id, "r1", "Full refresh must preserve the authenticated room snapshot");
assert.equal(
    Object.hasOwn(managerOptions[1], "attendanceDate"),
    false,
    "Full refresh must retain room-history attendance behavior"
);

console.log("Teacher core payload checks passed.");
