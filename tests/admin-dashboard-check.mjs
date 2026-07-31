import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const serviceSource = fs.readFileSync("modules/admin/adminDashboardService.js", "utf8");
const managerSource = fs.readFileSync("modules/admin/adminDashboardManager.js", "utf8");
const viewSource = fs.readFileSync("modules/admin/adminDashboardView.js", "utf8");
const appSource = fs.readFileSync("modules/core/app.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const forbidden of ["fetch(", "FirebaseService", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Admin Dashboard View must not own ${forbidden}`);
}
assert.ok(appSource.includes("ensureAdminDashboardView"), "App must initialize Admin Dashboard View");
for (const id of [
    "admin-dashboard-main-stock",
    "admin-dashboard-room-stock",
    "admin-dashboard-system-stock",
    "admin-dashboard-rooms",
    "admin-dashboard-students",
    "admin-dashboard-used",
    "admin-dashboard-ready",
    "admin-dashboard-empty",
    "admin-dashboard-mismatch",
    "admin-dashboard-negative",
    "admin-dashboard-room-body"
]) {
    assert.ok(html.includes(`id="${id}"`), `Admin Dashboard element ${id} is required`);
}
assert.ok(
    html.includes('data-admin-menu="system-dashboard"'),
    "Admin navigation must expose the system overview"
);

const context = vm.createContext({
    console,
    Date,
    window: {}
});
new vm.Script(serviceSource).runInContext(context);
const AdminDashboardService = context.window.AdminDashboardService.constructor;

let mainReads = 0;
let roomReads = 0;
const repository = {
    async loadMainStock() {
        mainReads += 1;
        return 500;
    },
    async loadRoomStocks() {
        roomReads += 1;
        return {
            r1: 20,
            r2: 7,
            r3: -2,
            r4: 0
        };
    }
};
const service = new AdminDashboardService(repository, {
    clock: () => new Date("2026-07-31T02:00:00.000Z")
});
const report = {
    schoolName: "โรงเรียนทดสอบ",
    academicYear: "2569",
    schoolTotal: {
        roomCount: 4,
        students: 80,
        distTotal: 200,
        remaining: 35
    },
    roomSummary: [
        { roomId: "r1", roomName: "อ.3-1", students: 20, remaining: 20 },
        { roomId: "r2", roomName: "อ.3-2", students: 20, remaining: 10 },
        { roomId: "r3", roomName: "ป.1-1", students: 20, remaining: -2 },
        { roomId: "r4", roomName: "ป.1-2", students: 20, remaining: 0 }
    ]
};
const model = await service.load(
    { role: "admin", isAdmin: true },
    report
);
assert.equal(mainReads, 1);
assert.equal(roomReads, 1);
assert.equal(model.totals.mainStock, 500);
assert.equal(model.totals.roomStock, 25);
assert.equal(model.totals.systemStock, 525);
assert.equal(model.totals.rooms, 4);
assert.equal(model.totals.students, 80);
assert.equal(model.totals.used, 165);
assert.deepEqual(
    JSON.parse(JSON.stringify(model.counts)),
    { ready: 1, empty: 1, mismatch: 1, negative: 1 }
);
assert.equal(model.healthy, false);
assert.equal(model.rooms[0].state, "negative");
assert.equal(model.rooms[1].state, "mismatch");
assert.equal(model.rooms[1].difference, -3);
assert.equal(model.generatedAt, "2026-07-31T02:00:00.000Z");

await assert.rejects(
    service.load({ role: "teacher", isAdmin: false }, report),
    error => error.code === "ADMIN_SESSION_REQUIRED"
);

new vm.Script(managerSource).runInContext(context);
const AdminDashboardManager = context.window.AdminDashboardManager.constructor;
let reportRefreshes = 0;
const manager = new AdminDashboardManager(
    { load: async (session, selectedReport) => ({ session, selectedReport }) },
    {
        getCurrentReport: () => report,
        refresh: async () => {
            reportRefreshes += 1;
            return report;
        },
        setView: () => "room"
    },
    { getSession: () => ({ role: "admin", isAdmin: true }) }
);
const cached = await manager.refresh();
assert.equal(cached.selectedReport, report);
assert.equal(reportRefreshes, 0, "Cached report must avoid a duplicate oversized refresh");
await manager.refresh({ forceReport: true });
assert.equal(reportRefreshes, 1);

console.log("Admin system Dashboard checks passed.");
