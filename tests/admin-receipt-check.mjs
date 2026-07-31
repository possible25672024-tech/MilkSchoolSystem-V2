import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const repositorySource = fs.readFileSync("modules/repositories/stockRepository.js", "utf8");
const serviceSource = fs.readFileSync("modules/admin/adminReceiptService.js", "utf8");
const managerSource = fs.readFileSync("modules/admin/adminReceiptManager.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminReceiptView.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");
const plan = fs.readFileSync("docs/SPRINT_5_4_PLAN.md", "utf8");

for (const forbidden of ["fetch(", "FirebaseService", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Admin Receipt View must not own ${forbidden}`);
}
assert.ok(
    repositorySource.includes("loadReceiptSummaries"),
    "StockRepository must expose media-free receipt summaries"
);
assert.ok(
    repositorySource.includes("{ shallow: true }"),
    "Receipt history must discover keys without downloading full records"
);
assert.ok(appSource.includes("ensureAdminReceiptView"), "App must initialize Admin Receipt View");
for (const id of [
    "admin-receipt-main-stock",
    "admin-receipt-preview",
    "admin-receipt-form",
    "admin-receipt-date",
    "admin-receipt-crates",
    "admin-receipt-extra",
    "admin-receipt-per-crate",
    "admin-receipt-year",
    "admin-receipt-note",
    "admin-receipt-photos",
    "admin-receipt-receiver-signature",
    "admin-receipt-sender-signature",
    "admin-receipt-history-body"
]) {
    assert.ok(html.includes(`id="${id}"`), `Admin Receipt element ${id} is required`);
}
assert.ok(html.includes('data-admin-menu="receipts"'));
assert.ok(html.includes('data-admin-menu="receipt-history"'));
for (const boundary of [
    "Main Stock",
    "Room Stock",
    "one Admin writer",
    "Multi-admin concurrency remains blocked",
    "rebuildAndPersist"
]) {
    assert.ok(plan.includes(boundary), `Sprint 5.4 plan must preserve ${boundary}`);
}

const context = vm.createContext({
    console,
    Date,
    window: {}
});
new vm.Script(serviceSource).runInContext(context);
const AdminReceiptService = context.window.AdminReceiptService.constructor;
const writes = [];
const stockService = {
    calculateReceiveTotal({ crates, extra, perCrate }) {
        const normalizedCrates = Number(crates);
        const normalizedExtra = Number(extra);
        const normalizedPerCrate = Number(perCrate);
        if (!Number.isInteger(normalizedCrates) || normalizedCrates < 1) {
            const error = new Error("invalid crates");
            error.code = "INVALID_QUANTITY";
            throw error;
        }
        if (!Number.isInteger(normalizedExtra) || normalizedExtra < 0) {
            const error = new Error("invalid extra");
            error.code = "INVALID_QUANTITY";
            throw error;
        }
        return normalizedCrates * normalizedPerCrate + normalizedExtra;
    },
    async receiveMilk(command) {
        writes.push(command);
        return {
            stockBefore: 100,
            stockAfter: 176,
            total: 76,
            record: command.record,
            ledger: { type: "RECEIVE" }
        };
    }
};
const repository = {
    loadMainStock: async () => 100,
    loadReceiptSummaries: async () => ({
        newer: {
            date: "2026-07-31",
            createdAt: "2026-07-31T09:00:00.000Z",
            crates: 2,
            extra: 4,
            perCrate: 36,
            total: 76,
            note: "เอกสาร 2",
            supplier: "อบต."
        },
        older: {
            date: "2026-07-30",
            createdAt: "2026-07-30T09:00:00.000Z",
            crates: 1,
            extra: 0,
            perCrate: 36,
            total: 36
        }
    })
};
const service = new AdminReceiptService(stockService, repository);
const admin = { role: "admin", isAdmin: true };
const preview = service.preview(admin, {
    date: "2026-07-31",
    crates: 2,
    extra: 4,
    perCrate: 36,
    note: "เอกสาร 2"
});
assert.equal(preview.total, 76);
const model = await service.load(admin);
assert.equal(model.mainStock, 100);
assert.equal(model.receipts.length, 2);
assert.equal(model.receipts[0].id, "newer");
const received = await service.receive(admin, preview);
assert.equal(received.stockAfter, 176);
assert.equal(writes.length, 1);
assert.equal(writes[0].record.total, 76);
assert.equal(writes[0].source, "admin");
await assert.rejects(
    service.load({ role: "teacher", isAdmin: false }),
    error => error.code === "ADMIN_SESSION_REQUIRED"
);

new vm.Script(managerSource).runInContext(context);
const AdminReceiptManager = context.window.AdminReceiptManager.constructor;
let refreshes = 0;
const manager = new AdminReceiptManager(
    {
        preview: () => preview,
        load: async () => {
            refreshes += 1;
            return model;
        },
        receive: async () => received
    },
    { getSession: () => admin }
);
assert.equal(manager.preview({}).total, 76);
await manager.refresh();
await manager.receive({});
assert.equal(refreshes, 2, "Successful receipt must refresh Main Stock and history");

console.log("Admin milk receipt checks passed.");
