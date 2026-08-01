import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const indexCode = read("index-v2.html");
const firebaseCode = read("modules/services/firebaseService.js");
const baseRepositoryCode = read("modules/repositories/baseRepository.js");
const loginServiceCode = read("modules/services/loginService.js");
const loginManagerCode = read("modules/login/loginManager.js");
const teacherRepositoryCode = read("modules/repositories/teacherRepository.js");
const teacherServiceCode = read("modules/services/teacherService.js");
const teacherManagerCode = read("modules/teacher/teacherManager.js");
const queueStorageCode = read("modules/storage/queueStorage.js");

for (const [name, source] of [
    ["firebaseService.js", firebaseCode],
    ["loginService.js", loginServiceCode],
    ["loginManager.js", loginManagerCode],
    ["teacherRepository.js", teacherRepositoryCode],
    ["teacherService.js", teacherServiceCode],
    ["teacherManager.js", teacherManagerCode],
    ["queueStorage.js", queueStorageCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(indexCode.includes("Sprint 4.0 Cutover Readiness and Compatibility"), "V2 shell must identify the current Sprint 4.0 validation");
assert.ok(firebaseCode.includes("inflightGets"), "FirebaseService must track identical in-flight GET requests");
assert.ok(loginManagerCode.includes("forceReload: true"), "Manual room-option refresh must explicitly bypass the Login cache");
assert.ok(teacherRepositoryCode.includes("loadTeacherCoreSnapshot"), "TeacherRepository must expose a core snapshot boundary");
assert.ok(teacherRepositoryCode.includes("loadTeacherExtraSnapshot"), "TeacherRepository must expose a deferred extra-data boundary");
assert.ok(teacherManagerCode.includes("includeExtras = options?.includeExtras === true"), "TeacherManager refresh must default to the core Teacher snapshot");
assert.ok(teacherManagerCode.includes("refreshFull()"), "TeacherManager must expose an explicit full refresh command");
assert.ok(!teacherServiceCode.includes("fetch("), "TeacherService must not fetch directly during performance work");
assert.ok(!teacherManagerCode.includes("FirebaseService"), "TeacherManager must not access Firebase directly during performance work");

let firebaseFetchCount = 0;
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
    fetch: async url => {
        firebaseFetchCount += 1;
        return {
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ url })
        };
    },
    setTimeout,
    clearTimeout,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Map,
    Error,
    console
};
vm.runInNewContext(firebaseCode, firebaseContext);
const FirebaseService = firebaseContext.window.FirebaseService.constructor;
const firebaseService = new FirebaseService();
firebaseService.databaseURL = "https://example.firebaseio.com";

const firstGet = firebaseService.get("milkApp/settings");
const duplicateGet = firebaseService.get("milkApp/settings");
assert.strictEqual(firstGet, duplicateGet, "Concurrent identical GET calls must share one Promise");
await Promise.all([firstGet, duplicateGet]);
assert.equal(firebaseFetchCount, 1, "Concurrent identical GET calls must produce one network request");
await firebaseService.get("milkApp/settings");
assert.equal(firebaseFetchCount, 2, "Completed GET calls must not become a stale persistent response cache");
await Promise.all([
    firebaseService.get("milkApp/mcAttendance", { orderBy: "$key", startAt: "r1_", endAt: "r1_\uf8ff" }),
    firebaseService.get("milkApp/mcAttendance", { orderBy: "$key", startAt: "r2_", endAt: "r2_\uf8ff" })
]);
assert.equal(firebaseFetchCount, 4, "Different room queries must remain independent requests");

let loginRepositoryCalls = 0;
let loginClock = 1000;
const loginRepository = {
    async loadPublicLoginDirectory() {
        loginRepositoryCalls += 1;
        return {
            schoolName: "โรงเรียนทดสอบ",
            accounts: {
                __admin__: { name: "ผู้ดูแลระบบ", authEmail: "admin@example.invalid" },
                r1: { name: "อ.3-1", teacher: "ครูหนึ่ง", authEmail: "r1@example.invalid" }
            }
        };
    },
    async loadAuthorizedUser() { return { role: "admin", enabled: true }; },
    async loadSettings() { return { school: "โรงเรียนทดสอบ" }; },
    async loadRoom() { return null; }
};
const loginAuth = {
    async signIn(email) { return { uid: "uid-admin", email }; },
    signOut() {}
};
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
const loginService = new LoginService(loginRepository, loginAuth, {
    clock: () => loginClock,
    cacheTtlMs: 1000
});

const firstOptions = await loginService.loadLoginOptions({ forceReload: true });
assert.equal(loginRepositoryCalls, 1, "Initial login-option load must read the login context once");
firstOptions.rooms[0].name = "mutated outside cache";
const cachedOptions = await loginService.loadLoginOptions();
assert.equal(loginRepositoryCalls, 1, "Repeated login-option reads inside the TTL must reuse the normalized context");
assert.equal(cachedOptions.rooms[0].name, "อ.3-1", "Login cache must not be mutated by consumers");
const adminLogin = await loginService.login("__admin__", "admin-pass");
assert.equal(adminLogin.ok, true, "Cached login context must preserve Admin authentication");
assert.equal(loginRepositoryCalls, 1, "Credential validation must reuse the cached public login directory");
loginClock = 2501;
await loginService.loadLoginOptions();
assert.equal(loginRepositoryCalls, 2, "Expired login context must reload from the repository");

const teacherCalls = [];
const teacherFirebase = {
    get(pathName, query = {}) {
        teacherCalls.push({ path: pathName, query: { ...query } });
        if (pathName.endsWith("/rooms/r1")) {
            return Promise.resolve({ id: "r1", name: "อ.3-1", students: [] });
        }
        if (pathName.includes("roomStock/")) {
            return Promise.resolve(12);
        }
        return Promise.resolve({});
    }
};
const teacherRepositoryContext = {
    window: { FirebaseService: teacherFirebase },
    Promise,
    String,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(baseRepositoryCode, teacherRepositoryContext);
vm.runInNewContext(teacherRepositoryCode, teacherRepositoryContext);
const TeacherRepository = teacherRepositoryContext.window.TeacherRepository.constructor;
const teacherRepository = new TeacherRepository(teacherFirebase);

const coreSnapshot = await teacherRepository.loadTeacherSnapshot("r1", { includeExtras: false });
assert.equal(teacherCalls.length, 5, "Core Teacher snapshot must use five Firebase reads");
assert.equal(coreSnapshot.extrasLoaded, false, "Core Teacher snapshot must declare deferred extras");
for (const deferredPath of ["distributes", "absentMilk", "retroMilk", "vacationMilk", "stockTransactions"]) {
    assert.equal(
        teacherCalls.some(call => call.path.endsWith(`/${deferredPath}`)),
        false,
        `Core Teacher snapshot must defer ${deferredPath}`
    );
}
const attendanceCall = teacherCalls.find(call => call.path.endsWith("/mcAttendance"));
assert.ok(attendanceCall, "Core Teacher snapshot must include attendance");
assert.deepEqual(
    attendanceCall.query,
    { orderBy: "$key", startAt: "r1_", endAt: "r1_\uf8ff" },
    "Teacher attendance must remain scoped to the authenticated room key prefix"
);

teacherCalls.length = 0;
const fullSnapshot = await teacherRepository.loadTeacherSnapshot("r1", { includeExtras: true });
assert.equal(teacherCalls.length, 10, "Explicit full Teacher snapshot must load the five deferred collections in addition to core data");
assert.equal(fullSnapshot.extrasLoaded, true, "Explicit full Teacher snapshot must declare complete extras");
for (const deferredPath of ["distributes", "absentMilk", "retroMilk", "vacationMilk", "stockTransactions"]) {
    const call = teacherCalls.find(item => item.path.endsWith(`/${deferredPath}`));
    assert.deepEqual(call?.query, { orderBy: "roomId", equalTo: "r1" }, `${deferredPath} must use an authenticated-room query`);
}

const managerOptions = [];
const managerEvents = [];
const teacherSession = { roomId: "r1", classId: "r1", role: "teacher" };
const fakeTeacherService = {
    requireSession: () => "r1",
    async loadTeacherView(session, options) {
        managerOptions.push({ ...options });
        return {
            snapshot: {
                room: { id: session.roomId },
                extrasLoaded: options.includeExtras
            },
            dashboard: { roomId: session.roomId }
        };
    },
    prepareRoomStockCommand: () => ({ mainStockDelta: 0 }),
    prepareRollbackCommand: () => ({ mainStockDelta: 0 })
};
const teacherManagerContext = {
    window: {
        TeacherService: fakeTeacherService,
        AuthService: { getSession: () => teacherSession },
        addEventListener: () => {},
        dispatchEvent: event => managerEvents.push(event)
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
vm.runInNewContext(teacherManagerCode, teacherManagerContext);
const TeacherManager = teacherManagerContext.window.TeacherManager.constructor;
const teacherManager = new TeacherManager(fakeTeacherService, teacherManagerContext.window.AuthService);
teacherManager.initialize();
await teacherManager.refresh();
await teacherManager.refreshFull();
assert.equal(managerOptions[0].includeExtras, false, "Normal Teacher refresh must load only the core snapshot");
assert.equal(managerOptions[1].includeExtras, true, "Full Teacher refresh must explicitly load deferred collections");

let storedQueue = null;
let queueReads = 0;
let queueWrites = 0;
const persistentStorage = {
    getItem() {
        queueReads += 1;
        return storedQueue;
    },
    setItem(key, value) {
        queueWrites += 1;
        storedQueue = value;
    },
    removeItem() {
        storedQueue = null;
    }
};
const queueContext = {
    window: { localStorage: persistentStorage },
    Date,
    JSON,
    String,
    Number,
    Object,
    Array,
    Error,
    console
};
vm.runInNewContext(queueStorageCode, queueContext);
const QueueStorage = queueContext.window.QueueStorage.constructor;
const queueStorage = new QueueStorage(persistentStorage);

const queued = queueStorage.upsert({
    type: "attendance",
    key: "r1_2026-07-27",
    roomId: "r1",
    record: { roomId: "r1", date: "2026-07-27", data: { s1: "present" } },
    baselinePresent: 1,
    queuedAt: 100,
    attempts: 0
});
assert.equal(queueReads, 1, "Queue upsert must read persistent storage once");
assert.equal(queueWrites, 1, "Queue upsert must write persistent storage once");
assert.equal(queued.baselinePresent, 1, "Queue upsert must preserve the supplied baseline");

const replaced = queueStorage.upsert({
    type: "attendance",
    key: "r1_2026-07-27",
    roomId: "r1",
    record: { roomId: "r1", date: "2026-07-27", data: { s1: "absent" } },
    baselinePresent: 0,
    queuedAt: 200,
    attempts: 3
});
assert.equal(queueReads, 2, "Repeated Queue upsert must add only one storage read");
assert.equal(queueWrites, 2, "Repeated Queue upsert must add only one storage write");
assert.equal(replaced.baselinePresent, 1, "Repeated queued edits must preserve the original baseline");
assert.equal(replaced.queuedAt, 100, "Repeated queued edits must preserve the original queue timestamp");
assert.equal(replaced.record.data.s1, "absent", "Repeated queued edits must retain the latest attendance record");

storedQueue = JSON.stringify([
    {
        type: "attendance",
        key: "r1_2026-07-28",
        rec: { clsId: "r1", date: "2026-07-28", data: { s1: "present" } },
        baselinePresent: 0,
        queuedAt: 300
    },
    {
        type: "attendance",
        key: "r1_2026-07-29",
        record: { roomId: "r1", date: "2026-07-29", data: { s1: "absent" } },
        baselinePresent: 1,
        queuedAt: 301
    },
    {
        type: "roomStockAdjust",
        key: "stockadj_legacy",
        roomId: "r1",
        diff: 2,
        referenceId: "legacy",
        queuedAt: 302
    },
    {
        type: "roomStockAdjust",
        key: "stockadj_v2",
        roomId: "r1",
        difference: -1,
        referenceId: "v2",
        queuedAt: 303
    },
    { type: "attendance", key: "", rec: null },
    null
]);
const compatibilityQueue = queueStorage.load();
assert.equal(compatibilityQueue.length, 4, "Mixed queue fixtures must retain valid legacy and V2 entries while filtering corrupt entries");
assert.equal(compatibilityQueue[0].record.clsId, "r1", "Legacy attendance `rec` must normalize to `record`");
assert.equal(compatibilityQueue[2].difference, 2, "Legacy Room Stock `diff` must normalize to `difference`");
assert.equal(compatibilityQueue[3].difference, -1, "V2 Room Stock `difference` must remain unchanged");

console.log("Performance module checks passed.");
