import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("modules/services/stockService.js", "utf8");
const context = vm.createContext({ console, Date, window: {} });
new vm.Script(source).runInContext(context);
const StockService = context.window.StockService.constructor;

const state = {
    mainStock: 500,
    roomStock: { r1: 50 },
    lock: null,
    lockVersion: 0,
    commands: {},
    patches: []
};
const repository = {
    loadMainStock: async () => state.mainStock,
    loadRoomStock: async roomId => state.roomStock[roomId] || 0,
    async loadDistributionLockVersioned() {
        return { value: state.lock, etag: `"lock-${state.lockVersion}"` };
    },
    async setDistributionLockIfMatch(lock, etag) {
        if (etag !== `"lock-${state.lockVersion}"`) return { status: "conflict" };
        state.lock = lock;
        state.lockVersion += 1;
        return { status: "ok", value: lock };
    },
    async releaseDistributionLock(owner) {
        if (state.lock?.owner === owner) {
            state.lock = null;
            state.lockVersion += 1;
        }
        return { status: "ok" };
    },
    async loadDistributionCommand(operationId) {
        return state.commands[operationId] || null;
    },
    async applyDistributionUpdate(updates, operationId, commandRecord) {
        state.patches.push({ updates: structuredClone(updates), operationId });
        state.mainStock = updates.stock;
        state.roomStock.r1 = updates["roomStock/r1"];
        state.commands[operationId] = structuredClone(commandRecord);
    }
};
let id = 0;
const service = new StockService(repository, {
    clock: () => new Date("2026-07-31T10:00:00.000Z"),
    idFactory: () => `id-${++id}`,
    distributionLockTtlMs: 30_000
});
const command = {
    operationId: "op-1",
    roomId: "r1",
    roomName: "ป.1-1",
    students: 20,
    days: 5,
    perCrate: 36,
    record: { date: "2026-07-31", note: "รอบแรก" }
};
const first = await service.distributeToRoomGuarded(command);
assert.equal(first.mainStockAfter, 400);
assert.equal(first.roomStockAfter, 150);
assert.equal(first.idempotent, false);
assert.equal(state.patches.length, 1, "One distribution must use one atomic stock patch");
const updateKeys = Object.keys(state.patches[0].updates);
assert.ok(updateKeys.includes("stock"));
assert.ok(updateKeys.includes("roomStock/r1"));
assert.ok(updateKeys.some(key => key.startsWith("distributes/")));
assert.ok(updateKeys.some(key => key.startsWith("stockTransactions/")));

const repeated = await service.distributeToRoomGuarded(command);
assert.equal(repeated.idempotent, true, "Repeated operation id must return the completed result");
assert.equal(state.patches.length, 1, "Repeated operation id must not deduct Main Stock again");
assert.equal(state.mainStock, 400);

await assert.rejects(
    service.distributeToRoomGuarded({ ...command, days: 6 }),
    error => error.code === "DISTRIBUTION_OPERATION_MISMATCH",
    "An operation id cannot be reused for a different quantity"
);
assert.equal(state.patches.length, 1);

state.lock = {
    owner: "another-admin",
    acquiredAt: "2026-07-31T09:59:55.000Z",
    expiresAt: "2026-07-31T10:00:30.000Z"
};
state.lockVersion += 1;
await assert.rejects(
    service.distributeToRoomGuarded({ ...command, operationId: "op-2" }),
    error => error.code === "DISTRIBUTION_LOCKED",
    "A live Admin lock must block a second stock deduction"
);
assert.equal(state.patches.length, 1);

console.log("Classroom distribution concurrency and idempotency checks passed.");
