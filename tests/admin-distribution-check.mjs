import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const repositorySource = fs.readFileSync("modules/repositories/stockRepository.js", "utf8");
const serviceSource = fs.readFileSync("modules/admin/adminDistributionService.js", "utf8");
const managerSource = fs.readFileSync("modules/admin/adminDistributionManager.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const [name, source] of [
    ["adminDistributionService.js", serviceSource],
    ["adminDistributionManager.js", managerSource],
    ["adminDistributionView.js", viewSource]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}
for (const forbidden of ["fetch(", "FirebaseService", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Distribution View must not own ${forbidden}`);
}
assert.match(repositorySource, /loadDistributionSummaries/, "Repository must expose summary history");
assert.match(repositorySource, /distributes.*shallow: true/s, "History must discover shallow keys");
assert.match(appSource, /ensureAdminDistributionView/, "App must initialize Distribution UI");
for (const marker of [
    'data-admin-menu="distribution"',
    'data-admin-menu="distribution-history"',
    'id="admin-distribution-form"',
    'id="admin-distribution-room"',
    'id="admin-distribution-days"',
    'id="admin-distribution-total"',
    'id="admin-distribution-history-body"'
]) {
    assert.ok(html.includes(marker), `Admin V2 is missing ${marker}`);
}

const context = vm.createContext({ console, Date, window: {} });
new vm.Script(serviceSource).runInContext(context);
const AdminDistributionService = context.window.AdminDistributionService.constructor;
const calls = [];
const stockService = {
    calculateDistributionTotal({ students, days, perCrate }) {
        const total = Number(students) * Number(days);
        return {
            students: Number(students),
            days: Number(days),
            perCrate: Number(perCrate),
            total,
            crates: Math.floor(total / Number(perCrate)),
            boxes: total % Number(perCrate)
        };
    },
    async distributeToRoomGuarded(command) {
        calls.push(command);
        return {
            record: { ...command.record, roomId: command.roomId, total: 68 },
            mainStockBefore: 500,
            mainStockAfter: 432,
            roomStockBefore: 12,
            roomStockAfter: 80,
            idempotent: false
        };
    }
};
const repository = {
    loadMainStock: async () => 500,
    loadRoomStocks: async () => ({ r1: 12 }),
    loadRooms: async () => ([{
        id: "r1",
        name: "ป.1-1",
        level: "ป.1",
        count: 34,
        students: [
            { id: "001", name: "หนึ่ง" },
            { id: "002", name: "สอง" },
            { id: "student_3", name: "fallback" }
        ]
    }]),
    loadDistributionSummaries: async () => ({
        d1: {
            date: "2026-07-31",
            createdAt: "2026-07-31T10:00:00.000Z",
            roomId: "r1",
            roomName: "ป.1-1",
            students: 2,
            days: 2,
            crates: 0,
            boxes: 4,
            total: 4,
            stockBefore: 500,
            stockAfter: 496
        }
    })
};
const service = new AdminDistributionService(stockService, repository);
const admin = { role: "admin", isAdmin: true };
const model = await service.load(admin);
assert.equal(model.rooms[0].students, 2, "Real roster rows must determine distribution quantity");
assert.equal(model.rooms[0].roomStock, 12);
const preview = service.preview(admin, model, {
    date: "2026-07-31",
    roomId: "r1",
    days: 2,
    perCrate: 36,
    photos: ["data:image/jpeg;base64,PHOTO"],
    signatures: {
        receiver: {
            receiverName: "ครูผู้รับ",
            dataUrl: "data:image/png;base64,SIGNATURE"
        }
    }
});
assert.equal(preview.total, 4, "Distribution formula must be students × days");
assert.equal(preview.mainStockAfter, 496);
assert.equal(preview.roomStockAfter, 16);
assert.equal(preview.photos.length, 1);
assert.equal(preview.signatures.receiver.receiverName, "ครูผู้รับ");
const history = await service.loadHistory(admin);
assert.equal(history.distributions.length, 1);
assert.equal(history.totalBoxes, 4);
await service.distribute(admin, {
    date: "2026-07-31",
    roomId: "r1",
    days: 34,
    perCrate: 36,
    year: "2569",
    photos: ["data:image/jpeg;base64,PHOTO"],
    signatures: {
        receiver: {
            receiverName: "ครูผู้รับ",
            dataUrl: "data:image/png;base64,SIGNATURE"
        }
    }
}, "operation-1");
assert.equal(calls.length, 1);
assert.equal(calls[0].operationId, "operation-1");
assert.equal(calls[0].students, 2);
assert.equal(calls[0].source, "admin");
assert.equal(calls[0].record.date, "2026-07-31");
assert.equal(calls[0].record.photos.length, 1);
assert.equal(calls[0].record.signatures.receiver.receiverName, "ครูผู้รับ");
await assert.rejects(
    service.load({ role: "teacher", isAdmin: false }),
    error => error.code === "ADMIN_SESSION_REQUIRED"
);

new vm.Script(managerSource).runInContext(context);
const AdminDistributionManager = context.window.AdminDistributionManager.constructor;
const refreshFailureManager = new AdminDistributionManager(
    {
        async distribute() {
            return {
                record: { roomId: "r1", total: 4 },
                mainStockBefore: 500,
                mainStockAfter: 496,
                idempotent: false
            };
        },
        async load() { throw new Error("refresh unavailable"); },
        async loadHistory() { throw new Error("history unavailable"); }
    },
    { getSession: () => admin }
);
const committedWithRefreshFailure = await refreshFailureManager.distribute({ roomId: "r1" });
assert.equal(
    committedWithRefreshFailure.refreshWarning,
    true,
    "A post-commit refresh failure must not report the stock write itself as failed"
);

console.log("Admin classroom distribution checks passed.");
