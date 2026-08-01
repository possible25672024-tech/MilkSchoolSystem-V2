import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const serviceSource = fs.readFileSync("modules/admin/adminDistributionService.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");

assert.match(viewSource, /renderSelectedRoom\(\)/);
assert.match(viewSource, /preview\.hasSufficientMainStock === false/);
assert.match(viewSource, /preview\.shortage/);

const context = vm.createContext({ console, Date, Math, window: {} });
new vm.Script(serviceSource).runInContext(context);
const Service = context.window.AdminDistributionService.constructor;

const stockService = {
    calculateDistributionTotal({ students, days, perCrate }) {
        const normalizedStudents = Number(students);
        const normalizedDays = Number(days);
        const normalizedPerCrate = Number(perCrate);
        const total = normalizedStudents * normalizedDays;
        return {
            students: normalizedStudents,
            days: normalizedDays,
            perCrate: normalizedPerCrate,
            total,
            crates: Math.floor(total / normalizedPerCrate),
            boxes: total % normalizedPerCrate
        };
    },
    async distributeToRoomGuarded() {}
};
const repository = {
    async loadMainStock() { return 0; },
    async loadRoomStocks() { return { room38: 2280 }; },
    async loadRooms() { return {}; },
    async loadDistributionSummaries() { return {}; }
};
const service = new Service(stockService, repository);
const admin = { role: "admin", isAdmin: true };
const model = {
    mainStock: 0,
    rooms: [{
        id: "room38",
        name: "ป.2-1",
        students: 38,
        roomStock: 2280,
        teacher: "ครูประจำชั้น"
    }]
};

const preview = service.preview(admin, model, {
    date: "2026-08-01",
    roomId: "room38",
    days: 30,
    perCrate: 36
});

assert.equal(preview.students, 38, "Selecting the room must retain its student count");
assert.equal(preview.days, 30, "Manually entered days must be reflected immediately");
assert.equal(preview.total, 1140, "Total boxes must equal students × days");
assert.equal(preview.crates, 31);
assert.equal(preview.boxes, 24);
assert.equal(preview.mainStockBefore, 0);
assert.equal(preview.mainStockAfter, -1140, "The preview must show the real projected balance");
assert.equal(preview.roomStockBefore, 2280);
assert.equal(preview.roomStockAfter, 3420);
assert.equal(preview.hasSufficientMainStock, false);
assert.equal(preview.shortage, 1140);

console.log("Admin classroom selection and live distribution calculation checks passed.");
