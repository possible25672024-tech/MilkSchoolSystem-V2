import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";

const expectedProjectId = "milkschoolsystem-v2-uat";

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
assert.match(teacherRoomId, /^[A-Za-z0-9_-]+$/, "Teacher room ID contains unsafe path characters");
assert.match(otherRoomId, /^[A-Za-z0-9_-]+$/, "Other room ID contains unsafe path characters");
assert.notEqual(teacherRoomId, otherRoomId, "Teacher and other room IDs must differ");

const targetURL = new URL(databaseURL);
const targetHost = targetURL.hostname.toLowerCase();
assert.equal(targetURL.protocol, "https:", "The Firebase test database must use HTTPS");
assert.ok(
    targetHost.includes(expectedProjectId) &&
        (targetHost.endsWith(".firebaseio.com") || targetHost.endsWith(".firebasedatabase.app")),
    `The destructive rehearsal is allowlisted only for ${expectedProjectId}`
);

const productionConfig = fs.readFileSync("config/firebase-config.js", "utf8");
const productionURL = productionConfig
    .match(/databaseURL:\s*["']([^"']+)["']/)?.[1]
    ?.replace(/\/+$/, "") || "";
assert.notEqual(databaseURL, productionURL, "The real-project UAT must refuse the configured Production database");
assert.doesNotMatch(databaseURL, /realtime-database-9fc52/i, "The Production Firebase project is forbidden");

const stableSerialize = value => {
    if (Array.isArray(value)) {
        return `[${value.map(stableSerialize).join(",")}]`;
    }
    if (value && typeof value === "object") {
        return `{${Object.keys(value)
            .sort()
            .map(key => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
};

const dataHash = value => crypto.createHash("sha256").update(stableSerialize(value)).digest("hex");

const tokenClaims = token => {
    const parts = token.split(".");
    assert.equal(parts.length, 3, "Firebase sign-in did not return a JWT");
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
};

const assertTestProjectToken = (token, label) => {
    const claims = tokenClaims(token);
    assert.equal(claims.aud, expectedProjectId, `${label} token audience is not the isolated UAT project`);
    assert.equal(
        claims.iss,
        `https://securetoken.google.com/${expectedProjectId}`,
        `${label} token issuer is not the isolated UAT project`
    );
};

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

const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function restoreBackup({ adminToken, backupData, backupHash, maxAttempts = 3 }) {
    let lastError = new Error("Emergency restore did not run");

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const current = await dbRequest("milkApp", { token: adminToken, etag: "request" });
            if (!current.response.ok || !current.etag) {
                throw new Error(`Emergency restore could not read the current root and ETag (HTTP ${current.response.status})`);
            }

            if (dataHash(current.data) === backupHash) {
                return { attempt, alreadyMatched: true };
            }

            const restored = await dbRequest("milkApp", {
                token: adminToken,
                method: "PUT",
                body: backupData,
                etag: current.etag
            });

            if (!restored.response.ok) {
                throw new Error(`Emergency restore PUT failed (HTTP ${restored.response.status})`);
            }

            const verified = await dbRequest("milkApp", { token: adminToken });
            if (!verified.response.ok) {
                throw new Error(`Emergency restore verification failed (HTTP ${verified.response.status})`);
            }
            if (dataHash(verified.data) !== backupHash) {
                throw new Error("Emergency restore verification hash does not match the pre-UAT backup");
            }

            return { attempt, alreadyMatched: false };
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt < maxAttempts) await pause(attempt * 250);
        }
    }

    throw lastError;
}

let adminToken = "";
let teacherToken = "";
let backupData = null;
let backupHash = "";
let mutationMayHaveOccurred = false;
let primaryError = null;
let cleanupError = null;

try {
    [adminToken, teacherToken] = await Promise.all([
        signIn("MILK_FIREBASE_ADMIN_EMAIL", "MILK_FIREBASE_ADMIN_PASSWORD"),
        signIn("MILK_FIREBASE_TEACHER_EMAIL", "MILK_FIREBASE_TEACHER_PASSWORD")
    ]);
    assertTestProjectToken(adminToken, "Admin");
    assertTestProjectToken(teacherToken, "Teacher");

    const publicDirectory = await dbRequest("milkApp/public/loginDirectory");
    assert.equal(publicDirectory.response.ok, true, "Anonymous users must read only the public login directory");
    const anonymousSettings = await dbRequest("milkApp/settings");
    assert.equal(anonymousSettings.response.ok, false, "Anonymous settings reads must be denied");

    const backup = await dbRequest("milkApp", { token: adminToken, etag: "request" });
    assert.equal(backup.response.ok, true, "Admin must read the isolated root for Backup");
    assert.ok(backup.etag, "Admin root Backup must return an ETag");
    assert.ok(backup.data && typeof backup.data === "object", "The isolated milkApp root must contain backup data");
    assert.equal(backup.data?.settings?.adminPassword, undefined);
    assert.equal(backup.data?.settings?.teacherPassword, undefined);
    assert.equal(backup.data?.settings?.firebaseKey, undefined);
    backupData = backup.data;
    backupHash = dataHash(backupData);

    assert.equal((await dbRequest(`milkApp/rooms/${teacherRoomId}`, { token: teacherToken })).response.ok, true);
    assert.equal((await dbRequest(`milkApp/rooms/${otherRoomId}`, { token: teacherToken })).response.ok, false);
    assert.equal((await dbRequest(`milkApp/roomStock/${teacherRoomId}`, { token: teacherToken })).response.ok, true);
    assert.equal((await dbRequest(`milkApp/roomStock/${otherRoomId}`, { token: teacherToken })).response.ok, false);
    mutationMayHaveOccurred = true;
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
        body: backupData,
        etag: backup.etag
    });
    assert.equal(staleRestore.response.status, 412, "A stale root ETag must reject Restore after the Teacher probe write");

    const changed = await dbRequest("milkApp", { token: adminToken, etag: "request" });
    assert.equal(changed.response.ok, true);
    assert.ok(changed.etag, "Current isolated root must return an ETag before Restore");
    const restored = await dbRequest("milkApp", {
        token: adminToken,
        method: "PUT",
        body: backupData,
        etag: changed.etag
    });
    assert.equal(restored.response.ok, true, "Current ETag must allow isolated Restore");
    const verified = await dbRequest("milkApp", { token: adminToken });
    assert.equal(verified.response.ok, true);
    assert.equal(dataHash(verified.data), backupHash, "Restored isolated root must match the pre-UAT Backup");
    mutationMayHaveOccurred = false;

    console.log(`Real isolated Firebase project UAT passed. Backup SHA-256: ${backupHash}`);
}
catch (error) {
    primaryError = error instanceof Error ? error : new Error(String(error));
}
finally {
    if (mutationMayHaveOccurred && adminToken && backupData && backupHash) {
        try {
            const cleanup = await restoreBackup({ adminToken, backupData, backupHash });
            mutationMayHaveOccurred = false;
            console.error(
                `Emergency isolated-project restore passed on attempt ${cleanup.attempt}` +
                `${cleanup.alreadyMatched ? " (root already matched backup)." : "."}`
            );
        }
        catch (error) {
            cleanupError = error instanceof Error ? error : new Error(String(error));
        }
    }
}

if (primaryError && cleanupError) {
    console.error(`Primary UAT failure: ${primaryError.stack || primaryError.message}`);
    console.error(`Emergency restore failure: ${cleanupError.stack || cleanupError.message}`);
    throw new AggregateError([primaryError, cleanupError], "UAT failed and emergency restore also failed");
}
if (cleanupError) throw cleanupError;
if (primaryError) throw primaryError;
