import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const stockSource = fs.readFileSync("modules/services/stockService.js", "utf8");
const receiptSource = fs.readFileSync("modules/admin/adminReceiptService.js", "utf8");
const repositorySource = fs.readFileSync("modules/repositories/stockRepository.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const marker of [
    'data-admin-menu="receipt-history"',
    'data-admin-section="receipt-history"',
    'id="admin-receipt-year"',
    'id="admin-receipt-photos"',
    'id="admin-receipt-receiver-signature"',
    'id="admin-receipt-sender-signature"',
    'id="admin-receipt-history-body"',
    'data-receipt-action'
]) {
    const inRuntime = marker === "data-receipt-action"
        ? fs.readFileSync("modules/admin/adminReceiptView.js", "utf8").includes(marker)
        : html.includes(marker);
    assert.ok(inRuntime, `Receipt CRUD UI is missing ${marker}`);
}
for (const method of [
    "loadReceiptWithEtag", "loadReceiptLockVersioned", "setReceiptLockIfMatch",
    "releaseReceiptLock", "applyReceiptUpdate"
]) {
    assert.ok(repositorySource.includes(method), `StockRepository is missing ${method}`);
}

const context = vm.createContext({ console, Date, Math, Set, window: {} });
new vm.Script(stockSource).runInContext(context);
const StockService = context.window.StockService.constructor;

let mainStock = 100;
let receipt = {
    id: "r1",
    date: "2026-07-31",
    crates: 1,
    extra: 0,
    perCrate: 36,
    total: 36,
    createdAt: "2026-07-31T01:00:00.000Z"
};
let receiptEtag = "receipt-1";
const writes = [];
const repository = {
    async loadReceiptLockVersioned() { return { value: null, etag: "lock-1" }; },
    async setReceiptLockIfMatch() { return { status: "ok" }; },
    async releaseReceiptLock() { return { status: "ok" }; },
    async loadReceiptWithEtag() { return { value: structuredClone(receipt), etag: receiptEtag }; },
    async loadMainStock() { return mainStock; },
    async applyReceiptUpdate(update) {
        writes.push(structuredClone(update));
        mainStock = update.stock;
        receipt = update["receives/r1"];
        receiptEtag = "receipt-2";
    }
};
let id = 0;
const stock = new StockService(repository, {
    clock: () => new Date("2026-08-01T03:00:00.000Z"),
    idFactory: () => `ledger-${++id}`
});
const edited = await stock.adjustReceiptGuarded({
    action: "edit",
    operationId: "edit-1",
    referenceId: "r1",
    expectedEtag: "receipt-1",
    record: {
        date: "2026-08-01",
        crates: 2,
        extra: 2,
        perCrate: 36,
        total: 74,
        year: "2569"
    }
});
assert.equal(edited.delta, 38);
assert.equal(edited.stockBefore, 100);
assert.equal(edited.stockAfter, 138);
assert.equal(writes[0].stock, 138);
assert.equal(writes[0]["receives/r1"].createdAt, "2026-07-31T01:00:00.000Z");
assert.equal(writes[0]["receives/r1"].year, "2569");
assert.equal(writes[0]["stockTransactions/ledger-1"].type, "RECEIVE_EDIT");

const deleted = await stock.adjustReceiptGuarded({
    action: "delete",
    operationId: "delete-1",
    referenceId: "r1",
    expectedEtag: "receipt-2"
});
assert.equal(deleted.delta, -74);
assert.equal(deleted.stockAfter, 64);
assert.equal(writes[1]["receives/r1"], null);
assert.equal(writes[1]["stockTransactions/ledger-2"].type, "RECEIVE_DELETE");

receipt = { id: "r2", total: 80 };
receiptEtag = "receipt-3";
mainStock = 20;
await assert.rejects(
    stock.adjustReceiptGuarded({
        action: "delete",
        operationId: "delete-2",
        referenceId: "r2",
        expectedEtag: "receipt-3"
    }),
    error => error.code === "INSUFFICIENT_MAIN_STOCK_FOR_RECEIPT_CHANGE"
);

const stockFacade = {
    calculateReceiveTotal: ({ crates, extra, perCrate }) => Number(crates) * Number(perCrate) + Number(extra),
    async receiveMilk(command) { return command; }
};
const receiptRepository = {
    async loadMainStock() { return 500; },
    async loadReceiptSummaries() { return {}; }
};
const receiptContext = vm.createContext({ console, Date, Math, window: {} });
new vm.Script(receiptSource).runInContext(receiptContext);
const AdminReceiptService = receiptContext.window.AdminReceiptService.constructor;
const service = new AdminReceiptService(stockFacade, receiptRepository);
const normalized = service.preview({ role: "admin", isAdmin: true }, {
    date: "2026-08-01",
    crates: 2,
    extra: 3,
    perCrate: 36,
    year: "2569",
    photos: ["data:image/jpeg;base64,PHOTO"],
    signatures: {
        receiver: { receiverName: "ผู้รับ", dataUrl: "data:image/png;base64,SIGN" }
    }
});
assert.equal(normalized.total, 75);
assert.equal(normalized.year, "2569");
assert.equal(normalized.photos.length, 1);
assert.equal(normalized.signatures.receiver.receiverName, "ผู้รับ");

console.log("Admin receipt evidence, CRUD concurrency and Main Stock delta checks passed.");
