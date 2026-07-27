import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");

const index = read("index-v2.html");
const repositoryCode = read("modules/repositories/stockRepository.js");
const serviceCode = read("modules/services/stockService.js");
const managerCode = read("modules/stock/stockManager.js");

for (const [name, source] of [
    ["stockRepository.js", repositoryCode],
    ["stockService.js", serviceCode],
    ["stockManager.js", managerCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

const loadOrder = [
    "modules/services/firebaseService.js",
    "modules/repositories/baseRepository.js",
    "modules/repositories/stockRepository.js",
    "modules/services/stockService.js",
    "modules/stock/stockManager.js",
    "modules/core/app.js"
];

for (let position = 0; position < loadOrder.length - 1; position += 1) {
    assert.ok(
        index.indexOf(loadOrder[position]) < index.indexOf(loadOrder[position + 1]),
        `${loadOrder[position]} must load before ${loadOrder[position + 1]}`
    );
}

assert.ok(repositoryCode.includes('this.appRoot = "milkApp"'), "StockRepository must preserve the milkApp root");
assert.ok(repositoryCode.includes('this.path("roomStock")'), "StockRepository must use milkApp/roomStock");
assert.ok(repositoryCode.includes('this.path("stockTransactions")'), "StockRepository must use the shared stock ledger");
assert.ok(!managerCode.includes("FirebaseService"), "StockManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "StockManager must not use fetch directly");
assert.ok(!serviceCode.includes("document."), "StockService must not contain UI logic");
assert.ok(!serviceCode.includes("localStorage"), "StockService must not own storage concerns");

const context = {
    window: { StockRepository: null },
    console,
    Date,
    Math,
    Set,
    Object,
    Array,
    Number,
    String,
    Error
};
vm.runInNewContext(serviceCode, context);
const StockService = context.window.StockService.constructor;

let idCounter = 0;
const makeService = repository => new StockService(repository, {
    clock: () => new Date("2026-07-27T12:00:00.000Z"),
    idFactory: () => `test-${++idCounter}`
});

const calculationService = makeService({});
assert.equal(
    calculationService.calculateReceiveTotal({ crates: 2, extra: 4, perCrate: 36 }),
    76,
    "Receive total must equal crates × perCrate + extra"
);
assert.deepEqual(
    calculationService.calculateDistributionTotal({ students: 20, days: 5, perCrate: 36 }),
    { students: 20, days: 5, total: 100, crates: 2, boxes: 28, perCrate: 36 },
    "Classroom distribution calculation must preserve the legacy formula"
);

const snapshot = {
    stock: 130,
    roomStock: { r1: 91, r2: 40 },
    rooms: [{ id: "r1" }, { id: "r2" }],
    receives: [{ total: 200 }, { total: 80 }],
    distributes: [
        { roomId: "r1", total: 100 },
        { roomId: "r2", total: 50 }
    ],
    attendance: {
        "r1_2026-07-21": { data: { s1: "present", s2: "absent", s3: "present" } }
    },
    absentMilk: {
        a1: { roomId: "r1", totalBoxes: 3 }
    },
    retroMilk: {
        rt1: { roomId: "r1", totalBoxes: 4 }
    },
    vacationMilk: {
        v1: { roomId: "r2", totalBoxes: 10 }
    }
};

assert.deepEqual(
    calculationService.calculateMainStock(snapshot),
    { received: 280, distributed: 150, expected: 130 },
    "Main Stock must equal receives minus classroom distributions only"
);

const roomResult = calculationService.calculateRoomStock(snapshot);
assert.equal(roomResult.r1.expected, 91, "Room r1 must subtract attendance, pending, and retro milk");
assert.equal(roomResult.r2.expected, 40, "Room r2 must subtract vacation milk");
assert.equal(calculationService.validateSnapshot(snapshot).valid, true, "Matching stock snapshot must validate");

let capturedUpdates = null;
const distributionRepository = {
    loadMainStock: async () => 500,
    loadRoomStock: async () => 50,
    applyMultiLocationUpdate: async updates => {
        capturedUpdates = updates;
        return updates;
    }
};
const distributionService = makeService(distributionRepository);
const distribution = await distributionService.distributeToRoom({
    roomId: "r1",
    roomName: "อ.3-1",
    students: 20,
    days: 5,
    perCrate: 36,
    user: "admin"
});

assert.equal(distribution.mainStockAfter, 400, "Classroom distribution must reduce Main Stock");
assert.equal(distribution.roomStockAfter, 150, "Classroom distribution must increase Room Stock");
assert.equal(capturedUpdates.stock, 400, "Main Stock update must be included in the same patch");
assert.equal(capturedUpdates["roomStock/r1"], 150, "Room Stock update must be included in the same patch");
assert.equal(distribution.ledger.type, "DISTRIBUTE", "Distribution must create a DISTRIBUTE ledger entry");

capturedUpdates = null;
const consumptionRepository = {
    loadRoomStock: async () => 30,
    applyMultiLocationUpdate: async updates => {
        capturedUpdates = updates;
        return updates;
    }
};
const consumptionService = makeService(consumptionRepository);
const consumption = await consumptionService.consumeRoomStock({
    roomId: "r1",
    quantity: 7,
    type: "ATTENDANCE",
    referenceId: "r1_2026-07-27",
    source: "teacher"
});

assert.equal(consumption.roomStockAfter, 23, "Teacher attendance must reduce Room Stock");
assert.equal(capturedUpdates["roomStock/r1"], 23, "Room Stock consumption must be persisted");
assert.equal(Object.hasOwn(capturedUpdates, "stock"), false, "Teacher operations must never change Main Stock");
assert.equal(consumption.ledger.quantity, -7, "Room Stock consumption ledger quantity must be negative");

capturedUpdates = null;
const rollback = await consumptionService.rollbackRoomStock({
    roomId: "r1",
    quantity: 7,
    referenceId: "r1_2026-07-27",
    recordPath: "mcAttendance/r1_2026-07-27"
});
assert.equal(rollback.roomStockAfter, 37, "Rollback must restore the same Room Stock layer");
assert.equal(capturedUpdates["mcAttendance/r1_2026-07-27"], null, "Rollback may delete its source record atomically");
assert.equal(Object.hasOwn(capturedUpdates, "stock"), false, "Room rollback must not change Main Stock");

const insufficientService = makeService({
    loadMainStock: async () => 20,
    loadRoomStock: async () => 0,
    applyMultiLocationUpdate: async () => {
        throw new Error("Must not write when Main Stock is insufficient");
    }
});
await assert.rejects(
    insufficientService.distributeToRoom({ roomId: "r1", students: 10, days: 3 }),
    error => error.code === "INSUFFICIENT_MAIN_STOCK",
    "Distribution must reject quantities greater than Main Stock"
);

console.log("Stock module checks passed.");
