import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const code = fs.readFileSync(path.join(root, "modules/storage/teacherPreferenceStore.js"), "utf8");
const memory = new Map();
const storage = {
    getItem(key) {
        return memory.has(key) ? memory.get(key) : null;
    },
    setItem(key, value) {
        memory.set(key, String(value));
    }
};
const windowObject = { localStorage: storage };
const context = vm.createContext({ window: windowObject, JSON, Number, String, Object, Array, Error });
vm.runInContext(code, context, { filename: "teacherPreferenceStore.js" });

const Store = windowObject.TeacherPreferenceStoreClass;
const store = new Store(storage);
assert.deepEqual(JSON.parse(JSON.stringify(store.load("room-a"))), {});

const saved = store.save("room-a", {
    defaultReportDays: 15,
    compactMode: true,
    rememberLastSection: true,
    lastSection: "student-report",
    studentName: "must-not-persist",
    signature: "must-not-persist"
});
assert.deepEqual(JSON.parse(JSON.stringify(saved)), {
    defaultReportDays: 15,
    compactMode: true,
    rememberLastSection: true,
    lastSection: "student-report"
});
assert.deepEqual(
    JSON.parse(JSON.stringify(store.load("room-a"))),
    JSON.parse(JSON.stringify(saved))
);
assert.ok(!memory.get(store.key).includes("studentName"));
assert.ok(!memory.get(store.key).includes("signature"));

store.save("room-b", {
    defaultReportDays: 30,
    compactMode: false,
    rememberLastSection: false,
    lastSection: "overview"
});
assert.equal(store.load("room-a").compactMode, true, "Room preferences must remain isolated");
assert.equal(store.load("room-b").compactMode, false);

memory.set(store.key, "{corrupt");
assert.deepEqual(JSON.parse(JSON.stringify(store.load("room-a"))), {}, "Corrupt preferences must fail closed");
assert.throws(() => store.load("__admin__"), /room id/i);

console.log("Teacher preference store checks passed.");
