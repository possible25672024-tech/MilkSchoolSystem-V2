import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/services/loginService.js", "utf8");
const authCalls = [];
const authService = {
    identity: { uid: "uid-teacher-1", email: "teacher@example.invalid" },
    async signIn(email, password) {
        authCalls.push({ email, password });
        return { ...this.identity };
    },
    signOut() { authCalls.push({ signOut: true }); }
};
const repository = {
    publicReads: 0,
    settingsReads: 0,
    async loadPublicLoginDirectory() {
        this.publicReads += 1;
        return {
            schoolName: "โรงเรียนทดสอบ",
            accounts: {
                __admin__: { name: "ผู้ดูแลระบบ", authEmail: "admin@example.invalid" },
                r1: { name: "อ.3-1", teacher: "ครูหนึ่ง", authEmail: "teacher@example.invalid" }
            }
        };
    },
    async loadAuthorizedUser(uid) {
        assert.equal(uid, authService.identity.uid);
        return uid === "uid-admin-1"
            ? { role: "admin", enabled: true }
            : { role: "teacher", roomId: "r1", enabled: true };
    },
    async loadSettings() {
        this.settingsReads += 1;
        return { school: "โรงเรียนทดสอบ" };
    },
    async loadRoom(roomId) {
        return roomId === "r1"
            ? { id: "r1", name: "อ.3-1", teacher: "ครูหนึ่ง", students: [{ id: "s1" }] }
            : null;
    }
};
const context = vm.createContext({
    window: { LoginRepository: repository, FirebaseAuthService: authService },
    Date,
    String,
    Number,
    Object,
    Array,
    Error,
    Promise,
    console
});
new vm.Script(source, { filename: "loginService.js" }).runInContext(context);
const LoginService = context.window.LoginService.constructor;
const service = new LoginService(repository, authService, { clock: () => 1000 });

const options = await service.loadLoginOptions({ forceReload: true });
assert.equal(options.rooms.length, 1);
assert.equal(options.rooms[0].id, "r1");
const teacher = await service.login("r1", "teacher-password");
assert.equal(teacher.ok, true);
assert.equal(teacher.session.firebaseUid, "uid-teacher-1");
assert.equal(teacher.session.authorizationSource, "firebase-uid-profile");
assert.equal(teacher.session.roomSnapshot.students.length, 1);
assert.deepEqual(authCalls[0], { email: "teacher@example.invalid", password: "teacher-password" });
assert.equal(repository.publicReads, 1, "The public login directory should remain cached");
assert.equal(repository.settingsReads, 0, "Teacher login must not read Admin-only settings");

authService.identity = { uid: "uid-wrong-room", email: "wrong@example.invalid" };
repository.loadAuthorizedUser = async () => ({ role: "teacher", roomId: "r2", enabled: true });
await assert.rejects(service.login("r1", "wrong-room-password"), error => error.code === "TEACHER_ROOM_MISMATCH");
assert.equal(authCalls.at(-1).signOut, true);

authService.identity = { uid: "uid-admin-1", email: "admin@example.invalid" };
repository.loadAuthorizedUser = async () => ({ role: "admin", enabled: true });
const admin = await service.login("__admin__", "admin-password");
assert.equal(admin.ok, true);
assert.equal(admin.session.role, "admin");
assert.equal(admin.session.firebaseUid, "uid-admin-1");
assert.equal(repository.settingsReads, 1, "Only Admin login should read full settings");

assert.doesNotMatch(source, /adminPassword|teacherPassword|defaultPassword/);
console.log("Firebase UID profile login, role, room scope, cache, and legacy-password removal checks passed.");
