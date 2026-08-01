import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const required = name => {
    const value = String(process.env[name] || "").trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
};
const databaseURL = required("MILK_FIREBASE_TEST_DATABASE_URL").replace(/\/+$/, "");
const apiKey = required("MILK_FIREBASE_TEST_API_KEY");
const teacherRoomId = required("MILK_FIREBASE_TEACHER_ROOM_ID");
const otherRoomId = required("MILK_FIREBASE_OTHER_ROOM_ID");
assert.equal(
    required("MILK_FIREBASE_TEST_PROJECT_CONFIRM"),
    "ISOLATED_TEST_PROJECT",
    "The destructive rehearsal requires explicit isolated-project confirmation"
);
const productionConfig = fs.readFileSync("config/firebase-config.js", "utf8");
const productionURL = productionConfig.match(/databaseURL:\s*"([^"]+)"/)?.[1]?.replace(/\/+$/, "") || "";
assert.notEqual(databaseURL, productionURL, "The real-project UAT must refuse the configured Production database");
assert.doesNotMatch(databaseURL, /realtime-database-9fc52/i, "The Production Firebase project is forbidden");

async function signIn(emailName, passwordName) {
    const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(apiKey)}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: required(emailName),
                password: required(passwordName),
                returnSecureToken: true
            })
        }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(`Test-project Firebase sign-in failed: ${data?.error?.message || response.status}`);
    return data.idToken;
}

async function dbRequest(path, { token = "", method = "GET", body, etag = "", query = "" } = {}) {
    const auth = token ? `${query ? "&" : "?"}auth=${encodeURIComponent(token)}` : "";
    const response = await fetch(`${databaseURL}/${path.replace(/^\/+/, "")}.json${query}${auth}`, {
        method,
        headers: {
            ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
            ...(method === "GET" && etag === "request" ? { "X-Firebase-ETag": "true" } : {}),
            ...(etag && etag !== "request" ? { "If-Match": etag } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { response, data, text, etag: response.headers.get("etag") || "" };
}

const [adminToken, teacherToken] = await Promise.all([
    signIn("MILK_FIREBASE_ADMIN_EMAIL", "MILK_FIREBASE_ADMIN_PASSWORD"),
    signIn("MILK_FIREBASE_TEACHER_EMAIL", "MILK_FIREBASE_TEACHER_PASSWORD")
]);

const publicDirectory = await dbRequest("milkApp/public/loginDirectory");
assert.equal(publicDirectory.response.ok, true, "Anonymous users must read only the public login directory");
const anonymousSettings = await dbRequest("milkApp/settings");
assert.equal(anonymousSettings.response.ok, false, "Anonymous settings reads must be denied");

const backup = await dbRequest("milkApp", { token: adminToken, etag: "request" });
assert.equal(backup.response.ok, true, "Admin must read the isolated root for Backup");
assert.ok(backup.etag, "Admin root Backup must return an ETag");
assert.equal(backup.data?.settings?.adminPassword, undefined);
assert.equal(backup.data?.settings?.teacherPassword, undefined);
assert.equal(backup.data?.settings?.firebaseKey, undefined);
const backupHash = crypto.createHash("sha256").update(JSON.stringify(backup.data)).digest("hex");

assert.equal((await dbRequest(`milkApp/rooms/${teacherRoomId}`, { token: teacherToken })).response.ok, true);
assert.equal((await dbRequest(`milkApp/rooms/${otherRoomId}`, { token: teacherToken })).response.ok, false);
assert.equal((await dbRequest(`milkApp/roomStock/${teacherRoomId}`, { token: teacherToken })).response.ok, true);
assert.equal((await dbRequest(`milkApp/roomStock/${otherRoomId}`, { token: teacherToken })).response.ok, false);
assert.equal((await dbRequest("milkApp/settings/adminPassword", {
    token: adminToken,
    method: "PUT",
    body: "must-never-return"
})).response.ok, false, "Rules must reject legacy password fields even for Admin");

const probeKey = `${teacherRoomId}_2099-12-31`;
const crossRoomProbeKey = `${otherRoomId}_2099-12-31`;
assert.equal((await dbRequest(`milkApp/mcAttendance/${probeKey}`, {
    token: teacherToken,
    method: "PUT",
    body: { roomId: teacherRoomId, date: "2099-12-31", data: { uat: "present" } }
})).response.ok, true, "Teacher must write the authenticated room probe");
assert.equal((await dbRequest(`milkApp/mcAttendance/${crossRoomProbeKey}`, {
    token: teacherToken,
    method: "PUT",
    body: { roomId: otherRoomId, date: "2099-12-31", data: { uat: "present" } }
})).response.ok, false, "Teacher cross-room writes must be denied");

const staleRestore = await dbRequest("milkApp", {
    token: adminToken,
    method: "PUT",
    body: backup.data,
    etag: backup.etag
});
assert.equal(staleRestore.response.status, 412, "A stale root ETag must reject Restore after the Teacher probe write");

const changed = await dbRequest("milkApp", { token: adminToken, etag: "request" });
assert.equal(changed.response.ok, true);
const restored = await dbRequest("milkApp", {
    token: adminToken,
    method: "PUT",
    body: backup.data,
    etag: changed.etag
});
assert.equal(restored.response.ok, true, "Current ETag must allow isolated Restore");
const verified = await dbRequest("milkApp", { token: adminToken });
assert.equal(verified.response.ok, true);
assert.equal(
    crypto.createHash("sha256").update(JSON.stringify(verified.data)).digest("hex"),
    backupHash,
    "Restored isolated root must match the pre-UAT Backup"
);

console.log(`Real isolated Firebase project UAT passed. Backup SHA-256: ${backupHash}`);
