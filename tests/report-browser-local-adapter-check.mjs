import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const source = read("modules/report/browserLocalReportAdapter.js");
const managerSource = read("modules/report/reportManager.js");
const indexSource = read("index-v2.html");
const toPlain = value => JSON.parse(JSON.stringify(value));

assert.doesNotThrow(() => new vm.Script(source), "Browser-local Report adapter must contain valid JavaScript");
for (const forbidden of [
    "FirebaseService",
    "fetch(",
    "XMLHttpRequest",
    "sessionStorage",
    "indexedDB",
    "setItem(",
    "removeItem(",
    "roomStock",
    "mainStock",
    "stockLog",
    "ledger",
    "Queue"
]) {
    assert.ok(!source.includes(forbidden), `Browser-local Report adapter must not own ${forbidden}`);
}

assert.ok(
    indexSource.indexOf("modules/report/browserLocalReportAdapter.js")
        < indexSource.indexOf("modules/report/reportManager.js"),
    "Browser-local Report adapter must load before ReportManager"
);
assert.ok(managerSource.includes("adapter.read(snapshot)"), "ReportManager must inject local sources");
assert.ok(managerSource.includes("...extraSources"), "Explicit report sources must retain final precedence");

const values = new Map([
    ["storedMilkDB_v1", JSON.stringify({
        stored: [{ ignored: true }],
        dispensed: [
            {
                id: "p-local-duplicate",
                classId: "r1",
                studentId: "s1",
                absentDate: "2026-07-21",
                boxes: 1,
                photos: ["data:image/png;base64,large"],
                sig: "data:image/png;base64,large"
            },
            {
                id: "p-local-only",
                classId: "r1",
                studentId: "s2",
                absentDate: "2026-07-22",
                boxes: 1
            }
        ]
    })],
    ["backdateDistDB_v1", JSON.stringify({
        records: [
            {
                id: "r-local-duplicate",
                classId: "r1",
                year: "2569",
                term: "1",
                fromDate: "2026-06-01",
                toDate: "2026-06-05",
                total: 10
            },
            {
                id: "r-local-only",
                classId: "r2",
                year: "2569",
                term: "1",
                fromDate: "2026-06-08",
                toDate: "2026-06-12",
                total: 15,
                photos: ["data:image/png;base64,large"],
                signatures: [{ sig: "data:image/png;base64,large" }]
            }
        ]
    })],
    ["vacationDistDB_v1", JSON.stringify({
        records: [
            {
                id: "v-local-duplicate",
                classId: "r1",
                year: "2569",
                term: "1",
                date: "2026-07-01",
                days: 30,
                total: 60
            },
            {
                id: "v-local-only",
                classId: "r2",
                year: "2569",
                term: "2",
                date: "2026-10-01",
                days: 20,
                total: 40
            }
        ]
    })]
]);
const reads = [];
const storage = {
    getItem(key) {
        reads.push(key);
        return values.get(key) ?? null;
    }
};
const context = {
    window: { localStorage: storage },
    JSON,
    Object,
    Array,
    Number,
    String,
    Set,
    Error
};
vm.runInNewContext(source, context);
const Adapter = context.window.BrowserLocalReportAdapter.constructor;
const adapter = new Adapter(storage);
const cloudSnapshot = {
    absentMilk: {
        a1: {
            roomId: "r1",
            students: { s1: { days: ["2026-07-21"] } },
            totalBoxes: 1
        }
    },
    retroMilk: {
        r1: {
            roomId: "r1",
            academicYear: "2569",
            semester: "1",
            retroStart: "2026-06-01",
            retroEnd: "2026-06-05",
            totalBoxes: 10
        }
    },
    vacationMilk: {
        v1: {
            roomId: "r1",
            academicYear: "2569",
            semester: "1",
            date: "2026-07-01",
            days: 30,
            totalBoxes: 60
        }
    }
};
const before = JSON.stringify(cloudSnapshot);
const result = toPlain(adapter.read(cloudSnapshot));

assert.equal(JSON.stringify(cloudSnapshot), before, "Adapter must not mutate Firebase snapshot data");
assert.deepEqual(reads, [
    "storedMilkDB_v1",
    "backdateDistDB_v1",
    "vacationDistDB_v1"
], "Adapter must read only the three approved legacy-local keys");
assert.deepEqual(result.reportLocalDiagnostics.counts, {
    pending: 1,
    retro: 1,
    vacation: 1
});
assert.equal(result.localPending[0].id, "p-local-only");
assert.equal(result.localRetro[0].id, "r-local-only");
assert.equal(result.localVacation[0].id, "v-local-only");
assert.ok(!JSON.stringify(result).includes("data:image"), "Adapter output must omit photo/signature payloads");

values.set("backdateDistDB_v1", "{broken");
const malformed = toPlain(adapter.read({}));
assert.deepEqual(malformed.localRetro, [], "Invalid legacy JSON must fail safely as an empty source");
assert.deepEqual(malformed.reportLocalDiagnostics.invalid, ["backdateDistDB_v1"]);

console.log("Browser-local Report adapter checks passed.");
