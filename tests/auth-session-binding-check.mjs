import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/login/authService.js", "utf8");
const values = new Map();
const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key)
};
const firebaseAuth = {
    uid: "uid-r1",
    signedOut: false,
    getCurrentAuth() { return this.uid ? { uid: this.uid } : null; },
    signOut() { this.signedOut = true; this.uid = null; }
};
const login = {
    async login() {
        return {
            ok: true,
            session: { classId: "r1", roomId: "r1", role: "teacher", firebaseUid: "uid-r1" }
        };
    }
};
const context = vm.createContext({
    window: { LoginService: login, FirebaseAuthService: firebaseAuth },
    sessionStorage: storage,
    JSON,
    Boolean,
    String,
    Error,
    console
});
new vm.Script(source, { filename: "authService.js" }).runInContext(context);
const AuthService = context.window.AuthService.constructor;
const service = new AuthService(login, firebaseAuth);

await service.login("r1", "password-never-saved-here");
assert.equal(service.getSession().firebaseUid, "uid-r1");
assert.doesNotMatch(values.get(service.sessionKey), /password-never-saved-here/);

firebaseAuth.uid = "uid-other";
assert.equal(service.getSession(), null, "A session must be rejected when the Firebase UID changes");
assert.equal(values.has(service.sessionKey), false);

firebaseAuth.uid = "uid-admin";
service.saveSession({ classId: "__admin__", role: "admin", isAdmin: true, firebaseUid: "uid-admin" });
service.signOut();
assert.equal(firebaseAuth.signedOut, true);
assert.equal(values.size, 0);

console.log("Firebase UID-bound compatible session, tamper rejection, password redaction, and sign-out checks passed.");
