import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const loadService = (relativePath, globalName) => {
    const source = fs.readFileSync(path.join(root, relativePath), "utf8");
    const context = vm.createContext({
        console, Date, Math, Set, Map, Object, Array, Number, String, Error,
        window: {}
    });
    new vm.Script(source).runInContext(context);
    return context.window[globalName].constructor;
};

const ReportService = loadService("modules/services/reportService.js", "ReportService");
const reportService = new ReportService(null, {
    clock: () => new Date("2026-07-31T12:00:00Z")
});
const report = reportService.buildReport({
    rooms: {
        p62: { name: "ป.6-2", count: 1 },
        a210: { name: "อ2-10ธรรมศาสตร์", count: 1 },
        p11: { name: "ป.1-1", count: 1 },
        a31: { name: "อ.3-1", count: 1 },
        a22: { name: "อ.2-2", count: 1 },
        p61: { name: "ป.6-1", count: 1 }
    }
}, "room");

assert.deepEqual(
    JSON.parse(JSON.stringify(report.roomSummary.map(row => row.roomName))),
    ["อ.2-2", "อ2-10ธรรมศาสตร์", "อ.3-1", "ป.1-1", "ป.6-1", "ป.6-2"],
    "Room reports must run from the lowest Thai grade and naturally sort room numbers"
);

const OperationalService = loadService(
    "modules/admin/adminOperationalReportService.js",
    "AdminOperationalReportService"
);
const operationalService = new OperationalService(null, {
    clock: () => new Date("2026-07-31T12:00:00Z")
});

const chronological = operationalService.normalizeDistributions({
    distributes: {
        third: {
            date: "2026-06-12", createdAt: "2026-06-12T09:03:00Z",
            roomName: "ป.1-3", stockBefore: 110, stockAfter: 100, total: 10
        },
        first: {
            date: "2026-06-12", createdAt: "2026-06-12T09:01:00Z",
            roomName: "ป.1-1", stockBefore: 130, stockAfter: 120, total: 10
        },
        second: {
            date: "2026-06-12", createdAt: "2026-06-12T09:02:00Z",
            roomName: "ป.1-2", stockBefore: 120, stockAfter: 110, total: 10
        },
        nextDay: {
            date: "2026-06-13", createdAt: "2026-06-13T08:00:00Z",
            roomName: "อ.2-1", stockBefore: 100, stockAfter: 90, total: 10
        }
    }
});
assert.deepEqual(
    JSON.parse(JSON.stringify(chronological.map(row => row.id))),
    ["first", "second", "third", "nextDay"],
    "Distribution reports must show the oldest deduction first"
);
for (let index = 1; index < chronological.length; index += 1) {
    assert.equal(
        chronological[index - 1].stockAfter,
        chronological[index].stockBefore,
        "Each stock deduction must continue from the previous resulting balance"
    );
}

const legacyChain = operationalService.normalizeDistributions({
    distributes: {
        middle: { date: "2026-06-12", stockBefore: 420, stockAfter: 410, total: 10 },
        newest: { date: "2026-06-12", stockBefore: 410, stockAfter: 400, total: 10 },
        oldest: { date: "2026-06-12", stockBefore: 430, stockAfter: 420, total: 10 }
    }
});
assert.deepEqual(
    JSON.parse(JSON.stringify(legacyChain.map(row => row.id))),
    ["oldest", "middle", "newest"],
    "Legacy records without createdAt must follow their stock-before/stock-after chain"
);

const anomalous = operationalService.normalizeDistributions({
    distributes: {
        valid: { date: "2026-06-12", stockBefore: 110180, stockAfter: 109310, total: 870 },
        invalid: { date: "2026-06-12", stockBefore: 109310, stockAfter: 5560, total: 780 }
    }
});
assert.equal(anomalous[0].stockValid, true);
assert.equal(anomalous[1].stockValid, false);
assert.equal(anomalous[1].expectedStockAfter, 108530);
assert.equal(anomalous[1].stockDifference, -102970);
assert.match(
    operationalService.distributionExportRows({ distributions: anomalous })[1]["ตรวจยอด"],
    /108530/,
    "Anomalous legacy Main Stock must be visible in exports without auto-repair"
);

console.log("Thai grade and Main Stock chronology report ordering checks passed.");
