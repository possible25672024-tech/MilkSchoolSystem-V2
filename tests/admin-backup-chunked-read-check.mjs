import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const calls = [];
const rootKeys = {
    settings: true,
    stock: true,
    rooms: true,
    documentFiles: true
};
const service = {
    async getWithEtag(path, query = {}) {
        calls.push({ method: "etag", path, query });
        assert.equal(path, "milkApp");
        assert.equal(query.print, "silent", "Root ETag reads must suppress the oversized body");
        assert.equal(query.shallow, undefined, "Firebase forbids mixing shallow and ETag reads");
        return { value: null, etag: "root-etag-stable", status: 204 };
    },
    async get(path, query = {}) {
        calls.push({ method: "get", path, query });
        const values = {
            "milkApp/settings": { school: "โรงเรียนทดสอบ" },
            "milkApp/stock": 500,
            "milkApp/rooms": [
                { id: "r1", students: [{ id: "s1", name: "นักเรียนหนึ่ง" }] },
                { id: "r2", students: [] }
            ],
            "milkApp/documentFiles/d1": "data:application/pdf;base64,AA==",
            "milkApp/documentFiles/d2": "data:image/png;base64,BB=="
        };
        if (path === "milkApp" && query.shallow) return structuredClone(rootKeys);
        if (path === "milkApp/documentFiles" && !query.shallow) {
            throw new Error('Firebase request failed (413): {"error":"Payload is too large"}');
        }
        if (path === "milkApp/documentFiles" && query.shallow) {
            return { d1: true, d2: true };
        }
        return structuredClone(values[path] ?? null);
    },
    async setIfMatch() { return { status: "ok" }; }
};

class BaseRepository {
    constructor(firebaseService) { this.firebaseService = firebaseService; }
    ensureService() { return this.firebaseService; }
    get(path, query = {}) { return this.firebaseService.get(path, query); }
    update() {}
}

const context = vm.createContext({
    console,
    Object,
    Array,
    Number,
    String,
    Error,
    Math,
    structuredClone,
    BaseRepository,
    window: { FirebaseService: service }
});
new vm.Script(source).runInContext(context);
const Repository = context.window.AdminSystemRepository.constructor;
const repository = new Repository(service);
const snapshot = await repository.loadRootWithEtag();

assert.equal(snapshot.etag, "root-etag-stable");
assert.equal(snapshot.value.stock, 500);
assert.equal(snapshot.value.rooms[0].students[0].name, "นักเรียนหนึ่ง");
assert.equal(snapshot.value.documentFiles.d2, "data:image/png;base64,BB==");
assert.equal(
    calls.filter(call => call.method === "etag").length,
    2,
    "A chunked backup must verify the root ETag before and after reading"
);
assert.ok(
    calls.some(call => call.method === "get" && call.path === "milkApp" && call.query.shallow === true),
    "Root key discovery must use a separate shallow GET"
);
assert.ok(
    calls.some(call => call.path === "milkApp/documentFiles" && call.query.shallow === true),
    "A 413 collection must fall back to shallow child discovery"
);
assert.ok(
    calls.some(call => call.path === "milkApp/documentFiles/d1"),
    "Large collections must hydrate one child at a time"
);

console.log("Admin backup chunking and consistent root ETag checks passed.");
