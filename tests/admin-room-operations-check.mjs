import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const serviceSource = read("modules/admin/adminRoomService.js");
const managerSource = read("modules/admin/adminRoomManager.js");
const viewSource = read("modules/admin/adminRoomView.js");
const appSource = read("modules/core/app.js");
const indexSource = read("index-v2.html");

for (const source of [serviceSource, managerSource, viewSource]) {
    assert.doesNotThrow(() => new vm.Script(source));
}

for (const forbidden of ["FirebaseService", "fetch(", "localStorage", "sessionStorage"]) {
    assert.ok(!viewSource.includes(forbidden), `Admin Room View must not own ${forbidden}`);
}

for (const expected of [
    'id="admin-room-select"',
    'id="admin-enter-room"',
    'id="admin-return-button"',
    'id="admin-attendance-body"',
    'id="admin-pending-body"',
    'id="admin-retroactive-body"',
    'id="admin-vacation-body"',
    'data-admin-record-action="edit"',
    'data-admin-record-action="delete"'
]) {
    assert.ok(
        indexSource.includes(expected) || viewSource.includes(expected),
        `Admin operations UI must contain ${expected}`
    );
}

assert.ok(appSource.includes("ensureAdminRoomView"), "App must initialize Admin Room View");
assert.ok(managerSource.includes("saveParentAdminSession"), "Admin must preserve its parent session");
assert.ok(managerSource.includes("queueRoomStockAdjustment"), "Admin deletes must preserve stock recovery");
assert.ok(managerSource.includes("queueAttendanceAudit"), "Admin deletes must preserve audit recovery");
assert.ok(serviceSource.includes("buildDelegatedSession"), "Admin access must use an explicit delegated room context");
assert.ok(serviceSource.includes("ADMIN_ROOM_QUARANTINED"), "Known quarantined room must block delegated edit mode");
assert.ok(serviceSource.includes("mainStockDelta: 0"), "Admin metadata edits must not change Main Stock");

const context = vm.createContext({
    console,
    Date,
    window: {}
});
new vm.Script(serviceSource).runInContext(context);
const AdminRoomService = context.window.AdminRoomService.constructor;

const calls = [];
const room = {
    id: "room-1",
    name: "อ.3-1",
    teacher: "ครูหนึ่ง",
    students: [{ id: "s1", name: "นักเรียนหนึ่ง" }]
};
const attendanceService = {
    deleteAttendance: async (session, input) => {
        calls.push(["attendance-delete", session, input]);
        return { roomId: input.roomId, mainStockDelta: 0, audit: { ok: true } };
    }
};
const pendingService = {
    remove: async (session, input) => {
        calls.push(["pending-delete", session, input]);
        return { roomId: input.roomId, mainStockDelta: 0, audit: { ok: true } };
    }
};
const retroService = {
    remove: async () => ({ mainStockDelta: 0, audit: { ok: true } })
};
const vacationService = {
    remove: async () => ({ mainStockDelta: 0, audit: { ok: true } })
};
const pendingRepo = {
    loadPendingRecord: async () => ({ roomId: "room-1", note: "เดิม" }),
    updatePendingRecord: async (id, changes) => calls.push(["pending-update", id, changes])
};
const service = new AdminRoomService(
    { loadLoginOptions: async () => ({ rooms: [room] }) },
    {
        loadTeacherView: async session => ({
            snapshot: {
                attendance: {
                    "room-1_2026-07-30": {
                        clsId: "room-1",
                        date: "2026-07-30",
                        data: { s1: "present" }
                    }
                },
                absentMilk: { p1: { roomId: "room-1", date: "2026-07-30", totalBoxes: 1 } },
                retroMilk: {},
                vacationMilk: {}
            },
            dashboard: {
                students: 1,
                actualRoomStock: 9,
                attendanceDays: 1,
                usedTotal: 1,
                delegatedRoomId: session.roomId
            }
        })
    },
    attendanceService,
    pendingService,
    retroService,
    vacationService,
    { pending: pendingRepo, retroactive: {}, vacation: {} }
);

const admin = {
    role: "admin",
    isAdmin: true,
    schoolName: "โรงเรียนทดสอบ"
};
const dashboard = await service.loadRoomDashboard(admin, "room-1");
assert.equal(dashboard.delegatedSession.role, "teacher");
assert.equal(dashboard.delegatedSession.adminOverride, true);
assert.equal(dashboard.delegatedSession.delegatedByAdmin, true);
assert.equal(dashboard.records.attendance[0].present, 1);
assert.equal(dashboard.records.pending[0].totalBoxes, 1);
assert.equal(dashboard.dashboard.delegatedRoomId, "room-1");

await service.deleteRecord(admin, "room-1", "attendance", { date: "2026-07-30" });
assert.equal(calls[0][1].roomId, "room-1");
assert.equal(calls[0][1].role, "teacher");
assert.equal(calls[0][2].date, "2026-07-30");

const updated = await service.updateRecordNote(admin, "room-1", "pending", {
    recordId: "p1",
    note: "ตรวจแล้ว"
});
assert.equal(updated.mainStockDelta, 0);
assert.equal(calls.at(-1)[2].note, "ตรวจแล้ว");
assert.equal(calls.at(-1)[2].updatedBy, "admin");

await assert.rejects(
    () => service.loadRoomDashboard({ role: "teacher", isAdmin: false }, "room-1"),
    /ผู้ดูแลระบบ/
);
await assert.rejects(
    () => service.loadRoomDashboard(admin, "missing-room"),
    /ไม่พบห้องเรียน/
);

console.log("Admin room operations checks passed.");
