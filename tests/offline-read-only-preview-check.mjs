import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const firebaseSource = fs.readFileSync("modules/services/firebaseService.js", "utf8");
const authSource = fs.readFileSync("modules/services/firebaseAuthService.js", "utf8");
const sessionSource = fs.readFileSync("modules/login/authService.js", "utf8");
const bootstrapSource = fs.readFileSync("modules/core/bootstrap.js", "utf8");
const appConfigSource = fs.readFileSync("config/app-config.js", "utf8");
const indexSource = fs.readFileSync("index-v2.html", "utf8");

const backup = {
    format: "MilkSchoolSystemV2Backup",
    formatVersion: 1,
    data: {
        settings: { school: "Offline Test School", year: "2569" },
        stock: 120,
        rooms: {
            room_a: { id: "room_a", name: "ป.1/1", teacher: "ครู ก", students: {} },
            room_b: { id: "room_b", name: "ป.1/2", teacher: "ครู ข", students: {} }
        },
        roomStock: { room_a: 10, room_b: 20 },
        mcAttendance: {
            a: { roomId: "room_a", date: "2026-07-30" },
            b: { roomId: "room_b", date: "2026-07-30" }
        }
    }
};
const requests = [];
const firebaseContext = vm.createContext({
    window: {
        ConfigManager: {
            getFirebaseConfig: () => ({}),
            getDatabaseURL: () => ""
        }
    },
    fetch: async (url, options = {}) => {
        requests.push({ url: String(url), options: { ...options } });
        return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(backup),
    json: async () => backup
};
    },
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Map,
    Error,
    Promise,
    console
});
new vm.Script(firebaseSource, { filename: "firebaseService.js" }).runInContext(firebaseContext);
const FirebaseService = firebaseContext.window.FirebaseService.constructor;
const firebase = new FirebaseService();

assert.equal(
    await firebase.initializeOffline({ backupURL: "milk_backup_2026-07-31.json" }),
    firebase,
    "offline initialization must resolve to the configured service"
);
assert.equal(requests.length, 1, "offline preview must load exactly one local backup file");
assert.equal(requests[0].url, "milk_backup_2026-07-31.json");
assert.equal(requests[0].options.method, "GET");
assert.doesNotMatch(requests[0].url, /firebaseio\.com|firebasedatabase\.app/i);
assert.equal(firebase.databaseURL, "", "offline preview must not retain a Firebase URL");
assert.equal(firebase.isConfigured(), true, "loaded offline backup must configure the data reader");

const settings = await firebase.get("milkApp/settings");
assert.equal(settings.school, "Offline Test School");
settings.school = "mutated";
assert.equal((await firebase.get("milkApp/settings")).school, "Offline Test School", "offline reads must be cloned");
assert.deepEqual(
    Object.keys(await firebase.get("milkApp/rooms", { shallow: true })),
    ["room_a", "room_b"]
);
assert.deepEqual(
    Object.keys(await firebase.get("milkApp/mcAttendance", { orderBy: "roomId", equalTo: "room_a" })),
    ["a"]
);
assert.equal((await firebase.getWithEtag("milkApp/stock")).etag, '"offline-read-only"');

for (const operation of [
    () => firebase.set("milkApp/stock", 0),
    () => firebase.update("milkApp", { stock: 0 }),
    () => firebase.remove("milkApp/rooms/room_a"),
    () => firebase.push("milkApp/receives", { total: 1 }),
    () => firebase.transaction("milkApp/stock", value => value),
    () => firebase.buildURL("milkApp/settings")
]) {
    assert.throws(operation, error => [
        "OFFLINE_READ_ONLY_WRITE_BLOCKED",
        "OFFLINE_READ_ONLY_NETWORK_BLOCKED"
    ].includes(error.code));
}
await assert.rejects(
    firebase.setIfMatch("milkApp/stock", 0, '"offline-read-only"'),
    error => error.code === "OFFLINE_READ_ONLY_WRITE_BLOCKED"
);
assert.equal(requests.length, 1, "offline reads and blocked writes must never call Firebase");

const firebaseAuthContext = vm.createContext({
    window: {
        ConfigManager: { getAppConfig: () => ({ mode: "OFFLINE_READ_ONLY" }) },
        FirebaseService: { setAuthTokenProvider() {}, setAuthToken() {} }
    },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    fetch: async () => { throw new Error("authentication network must not be called"); },
    URLSearchParams,
    encodeURIComponent,
    JSON,
    String,
    Number,
    Boolean,
    Object,
    Error,
    Date,
    Math,
    Promise,
    console
});
new vm.Script(authSource, { filename: "firebaseAuthService.js" }).runInContext(firebaseAuthContext);
firebaseAuthContext.window.FirebaseAuthService.initialize({
    auth: { mode: "firebase-email-password", apiKey: "must-still-be-disabled" }
});
assert.equal(
    firebaseAuthContext.window.FirebaseAuthService.isConfigured(),
    false,
    "Firebase Authentication must report unconfigured in offline preview"
);

const sessionValues = new Map();
let signOutCount = 0;
const sessionContext = vm.createContext({
    window: {
        ConfigManager: { getAppConfig: () => ({ mode: "OFFLINE_READ_ONLY" }) },
        LoginService: null,
        FirebaseAuthService: {
            signOut: () => { signOutCount += 1; },
            getCurrentAuth: () => null
        }
    },
    sessionStorage: {
        getItem: key => sessionValues.get(key) ?? null,
        setItem: (key, value) => sessionValues.set(key, value),
        removeItem: key => sessionValues.delete(key)
    },
    JSON,
    String,
    Boolean,
    Object,
    Error,
    Date,
    console
});
new vm.Script(sessionSource, { filename: "authService.js" }).runInContext(sessionContext);
const previewSession = sessionContext.window.AuthService.startOfflinePreview({ schoolName: "Offline Test School" });
assert.equal(previewSession.role, "admin");
assert.equal(previewSession.offlineReadOnly, true);
assert.equal(sessionContext.window.AuthService.getSession().firebaseUid, "__offline_read_only_preview__");
assert.equal(signOutCount, 1, "starting offline preview must clear any Firebase auth session");

assert.match(appConfigSource, /mode:\s*"OFFLINE_READ_ONLY"/);
assert.match(appConfigSource, /offlineBackupURL:\s*"milk_backup_2026-07-31\.json"/);
assert.match(bootstrapSource, /shouldInitializeFirebase\s*=\s*!offlineReadOnly/);
assert.match(bootstrapSource, /await window\.FirebaseService\.initialize\(firebaseConfig\)/);
assert.match(bootstrapSource, /await window\.FirebaseService\.initializeOffline/);
assert.match(indexSource, /id="offline-read-only-banner"/);
assert.match(indexSource, /OFFLINE READ-ONLY — ข้อมูลจากไฟล์สำรอง/);

let firebaseInitializeCount = 0;
let firebaseAuthInitializeCount = 0;
let firebaseAuthRestoreCount = 0;
let offlineInitializeCount = 0;
let appStartCount = 0;
const banner = { hidden: true, textContent: "", scrollIntoView() {} };
const bootstrapContext = vm.createContext({
    window: {
        ConfigManager: {
            getAppConfig: () => ({
                mode: "OFFLINE_READ_ONLY",
                offlineBackupURL: "milk_backup_2026-07-31.json"
            }),
            getFirebaseConfig: () => ({
                databaseURL: "https://production-should-not-be-used.firebasedatabase.app"
            })
        },
        FirebaseService: {
            initialize: async () => { firebaseInitializeCount += 1; },
            initializeOffline: async () => { offlineInitializeCount += 1; },
            get: async () => ({ school: "Offline Test School" })
        },
        FirebaseAuthService: {
            initialize: () => { firebaseAuthInitializeCount += 1; },
            restoreAuth: async () => { firebaseAuthRestoreCount += 1; }
        },
        AuthService: { startOfflinePreview() {} },
        App: { start: async () => { appStartCount += 1; } },
        addEventListener() {}
    },
    document: {
        body: {
            setAttribute() {},
            querySelectorAll: () => []
        },
        getElementById: id => id === "offline-read-only-banner" ? banner : null,
        querySelectorAll: () => [],
        addEventListener() {}
    },
    console,
    String,
    Boolean,
    Object,
    Error,
    Promise
});
new vm.Script(bootstrapSource, { filename: "bootstrap.js" }).runInContext(bootstrapContext);
await bootstrapContext.window.Bootstrap.start();
assert.equal(offlineInitializeCount, 1);
assert.equal(firebaseInitializeCount, 0, "offline bootstrap must not initialize Firebase even when a production URL exists");
assert.equal(firebaseAuthInitializeCount, 0, "offline bootstrap must not initialize Firebase Authentication");
assert.equal(firebaseAuthRestoreCount, 0, "offline bootstrap must not restore Firebase Authentication");
assert.equal(appStartCount, 1);
assert.equal(banner.hidden, false);

console.log("Offline read-only backup loading, session bypass, Firebase isolation, write blocking, and UI guard checks passed.");
