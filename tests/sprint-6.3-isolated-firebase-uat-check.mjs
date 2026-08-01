import assert from "node:assert/strict";
import crypto, { createHash } from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import vm from "node:vm";

const clone = value => structuredClone(value);
const initialRoot = {
    public: {
        loginDirectory: { schoolName: "โรงเรียนทดสอบ Sprint 6.3", accounts: {} },
        appSettings: { school: "โรงเรียนทดสอบ Sprint 6.3", year: "2569", semester: "1", perCrate: 36 }
    },
    accessControl: { users: { "uid-uat-admin": { role: "admin", enabled: true } } },
    settings: {
        school: "โรงเรียนทดสอบ Sprint 6.3",
        year: "2569",
        semester: "1",
        perCrate: 36
    },
    stock: 720,
    rooms: {
        r1: {
            id: "r1",
            name: "ป.1/1",
            teacher: "ครูทดสอบ",
            students: [{ id: "s1", name: "นักเรียนทดสอบ" }]
        }
    },
    roomStock: { r1: 36 },
    receives: { receive1: { id: "receive1", total: 756 } },
    distributes: { distribute1: { id: "distribute1", roomId: "r1", total: 36 } },
    mcAttendance: { r1_2026_08_01: { roomId: "r1", presentCount: 1 } },
    absentMilk: {},
    retroMilk: {},
    vacationMilk: {},
    documents: { d1: { id: "d1", title: "เอกสารทดสอบ" } },
    documentFiles: { d1: "data:application/pdf;base64,JVBERi0xLjQ=" }
};

let database = { milkApp: clone(initialRoot) };
const requestLog = [];

function etag(value) {
    return `"${createHash("sha256").update(JSON.stringify(value ?? null)).digest("hex")}"`;
}

function segmentsFrom(url) {
    const path = new URL(url, "http://127.0.0.1").pathname
        .replace(/^\/+/, "")
        .replace(/\.json$/, "");
    return path ? path.split("/").map(decodeURIComponent) : [];
}

function readAt(segments) {
    return segments.reduce((value, key) => value?.[key], database);
}

function writeAt(segments, value) {
    if (!segments.length) {
        database = value;
        return;
    }
    let parent = database;
    for (const key of segments.slice(0, -1)) {
        parent[key] ||= {};
        parent = parent[key];
    }
    parent[segments.at(-1)] = value;
}

function shallow(value) {
    if (!value || typeof value !== "object") return value;
    return Object.fromEntries(Object.keys(value).map(key => [key, true]));
}

function jsonResponse(response, status, value, headers = {}) {
    const body = status === 204 ? "" : JSON.stringify(value);
    response.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        ...headers
    });
    response.end(body);
}

const server = http.createServer((request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    const segments = segmentsFrom(request.url);
    const current = readAt(segments);
    requestLog.push({ method: request.method, path: url.pathname, query: url.search });

    if (request.method === "GET") {
        const currentEtag = etag(current);
        if (url.searchParams.get("print") === "silent") {
            jsonResponse(response, 204, null, { ETag: currentEtag });
            return;
        }
        const value = url.searchParams.get("shallow") === "true" ? shallow(current) : current ?? null;
        jsonResponse(response, 200, value, { ETag: currentEtag });
        return;
    }

    if (request.method === "PUT") {
        let body = "";
        request.setEncoding("utf8");
        request.on("data", chunk => { body += chunk; });
        request.on("end", () => {
            const currentEtag = etag(readAt(segments));
            const expected = String(request.headers["if-match"] || "");
            if (expected && expected !== currentEtag) {
                jsonResponse(response, 412, readAt(segments), { ETag: currentEtag });
                return;
            }
            const next = JSON.parse(body || "null");
            writeAt(segments, next);
            jsonResponse(response, 200, next, { ETag: etag(next) });
        });
        return;
    }

    jsonResponse(response, 405, { error: "method not allowed" });
});

await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
});

try {
    const address = server.address();
    const databaseURL = `http://127.0.0.1:${address.port}`;
    const windowObject = {
        ConfigManager: {
            getFirebaseConfig: () => ({ databaseURL, authToken: "", requestTimeoutMs: 5000 }),
            getDatabaseURL: () => databaseURL,
            getAuthToken: () => ""
        }
    };
    const context = vm.createContext({
        window: windowObject,
        console,
        fetch,
        URL,
        URLSearchParams,
        AbortController,
        setTimeout,
        clearTimeout,
        structuredClone,
        TextEncoder,
        Uint8Array,
        crypto: crypto.webcrypto,
        Date,
        Math,
        Promise,
        JSON,
        String,
        Number,
        Boolean,
        Object,
        Array,
        Map,
        Set,
        Error
    });

    for (const file of [
        "modules/services/firebaseService.js",
        "modules/repositories/baseRepository.js",
        "modules/repositories/adminSystemRepository.js",
        "modules/admin/adminSystemService.js"
    ]) {
        new vm.Script(fs.readFileSync(file, "utf8"), { filename: file }).runInContext(context);
    }

    const FirebaseService = context.window.FirebaseService.constructor;
    const firebaseService = new FirebaseService().initialize({
        databaseURL,
        authToken: "",
        requestTimeoutMs: 5000
    });
    const Repository = context.window.AdminSystemRepository.constructor;
    const repository = new Repository(firebaseService);
    const Service = context.window.AdminSystemService.constructor;
    const service = new Service(repository, {
        clock: () => new Date("2026-08-01T08:00:00.000+07:00")
    });
    const admin = { role: "admin", isAdmin: true, username: "uat-admin", firebaseUid: "uid-uat-admin" };

    const backup = await service.createBackup(admin, "sprint-6.3-isolated-uat", "full");
    assert.equal(backup.envelope.profile, "full");
    assert.equal(backup.envelope.restoreScope, "full-root");
    assert.equal(backup.summary.mainStock, 720);
    assert.equal(backup.summary.rooms, 1);
    assert.equal(backup.summary.documents, 1);
    assert.deepEqual(backup.envelope.data, initialRoot, "Full backup must preserve the isolated source");

    const changedRoot = clone(initialRoot);
    changedRoot.stock = 999;
    changedRoot.settings.school = "ข้อมูลก่อนกู้คืน";
    const current = await firebaseService.getWithEtag("milkApp");
    assert.equal((await firebaseService.setIfMatch("milkApp", changedRoot, current.etag)).status, "ok");

    const preview = await service.validateBackup(admin, backup.envelope);
    assert.equal(preview.valid, true);
    assert.equal(preview.currentSummary.mainStock, 999);
    await assert.rejects(
        service.restoreBackup(admin, preview, {
            confirmation: "กู้คืนข้อมูล",
            safetyBackupReady: false
        }),
        error => error.code === "RESTORE_SAFETY_BACKUP_REQUIRED"
    );

    const restored = await service.restoreBackup(admin, preview, {
        confirmation: "กู้คืนข้อมูล",
        safetyBackupReady: true
    });
    assert.equal(restored.restored, true);
    assert.equal(database.milkApp.stock, initialRoot.stock);
    assert.equal(database.milkApp.settings.school, initialRoot.settings.school);
    assert.deepEqual(database.milkApp.rooms, initialRoot.rooms);
    assert.deepEqual(database.milkApp.documentFiles, initialRoot.documentFiles);
    assert.ok(database.milkApp.systemAudit.restores[restored.restoreId]);

    const stalePreview = await service.validateBackup(admin, backup.envelope);
    const latest = await firebaseService.getWithEtag("milkApp");
    const concurrentRoot = clone(database.milkApp);
    concurrentRoot.stock = 721;
    assert.equal((await firebaseService.setIfMatch("milkApp", concurrentRoot, latest.etag)).status, "ok");
    await assert.rejects(
        service.restoreBackup(admin, stalePreview, {
            confirmation: "กู้คืนข้อมูล",
            safetyBackupReady: true
        }),
        error => error.code === "RESTORE_CONFLICT"
    );
    assert.equal(database.milkApp.stock, 721, "A stale Restore must not overwrite a concurrent write");

    assert.ok(requestLog.some(entry => entry.query.includes("print=silent")));
    assert.ok(requestLog.some(entry => entry.query.includes("shallow=true")));
    assert.ok(requestLog.some(entry => entry.method === "PUT"));
    assert.equal(
        requestLog.some(entry => /firebaseio|firebasedatabase/i.test(entry.path)),
        false,
        "The isolated rehearsal must not contact Production Firebase"
    );
} finally {
    await new Promise(resolve => server.close(resolve));
}

console.log("Sprint 6.3 isolated Firebase-compatible Backup/Restore and stale-ETag UAT passed.");
