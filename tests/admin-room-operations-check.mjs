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
    'id="admin-attendance-editor"',
    'id="admin-attendance-editor-form"',
    'id="admin-attendance-editor-list"',
    'id="admin-record-detail"',
    'id="admin-record-detail-students"',
    'id="admin-record-detail-photos"',
    'id="admin-record-detail-signatures"',
    'id="admin-pending-body"',
    'id="admin-retroactive-body"',
    'id="admin-vacation-body"',
    'data-admin-record-action="edit"',
    'data-admin-record-action="delete"',
    'class="admin-record-actions"',
    'cell.dataset.label = labels[index] || ""',
    'className = "admin-operation-empty"'
]) {
    assert.ok(
        indexSource.includes(expected) || viewSource.includes(expected),
        `Admin operations UI must contain ${expected}`
    );
}

for (const expected of [
    "table-layout: fixed",
    ".admin-operation-panel .admin-report-table-wrap",
    ".admin-record-actions",
    "content: attr(data-label)",
    "body:has(#app-panel:not([hidden]) #admin-shell:not([hidden]))",
    "#app-panel:has(#admin-shell:not([hidden]))",
    "grid-template-columns: 286px minmax(0, 1fr)",
    "max-width: none",
    "@media (max-width: 900px)"
]) {
    assert.ok(indexSource.includes(expected), `Admin operation tables must include responsive rule ${expected}`);
}

assert.ok(appSource.includes("ensureAdminRoomView"), "App must initialize Admin Room View");
assert.ok(managerSource.includes("saveParentAdminSession"), "Admin must preserve its parent session");
assert.ok(managerSource.includes("queueRoomStockAdjustment"), "Admin deletes must preserve stock recovery");
assert.ok(managerSource.includes("queueAttendanceAudit"), "Admin deletes must preserve audit recovery");
assert.ok(managerSource.includes("saveAttendanceEditor"), "Admin must save Attendance edits without role navigation");
assert.ok(viewSource.includes("openAttendanceEditor"), "Admin Attendance edit must open an inline editor");
assert.ok(
    !viewSource.includes("enterSelectedRoom({ attendanceDate"),
    "Admin Attendance edit must not switch into the Teacher shell"
);
assert.ok(serviceSource.includes("buildDelegatedSession"), "Admin access must use an explicit delegated room context");
assert.ok(serviceSource.includes("ADMIN_ROOM_QUARANTINED"), "Known quarantined room must block delegated edit mode");
assert.ok(serviceSource.includes("assertAttendanceMutationAllowed"), "Quarantine must protect Admin Attendance edit and delete");
assert.ok(serviceSource.includes("loadAttendanceEditor"), "Admin must explicitly hydrate one full Attendance record for editing");
assert.ok(serviceSource.includes("loadRecordDetail"), "Admin View actions must hydrate only the selected full record");
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
    saveAttendance: async (session, input) => {
        calls.push(["attendance-save", session, input]);
        return {
            key: `${input.roomId}_${input.date}`,
            roomId: input.roomId,
            record: input,
            mainStockDelta: 0,
            audit: { ok: true }
        };
    },
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
    loadRoomPendingRecords: async () => ({
        p1: { roomId: "room-1", date: "2026-07-30", totalBoxes: 1 }
    }),
    loadPendingRecord: async () => ({ roomId: "room-1", note: "เดิม" }),
    updatePendingRecord: async (id, changes) => calls.push(["pending-update", id, changes])
};
const attendanceRecord = {
    clsId: "room-1",
    roomName: "อ.3-1",
    date: "2026-07-30",
    year: "2569",
    term: "1",
    teacher: "ครูหนึ่ง",
    data: { s1: "present" },
    notes: { s1: "เดิม" },
    photos: ["photo-a"],
    signature: "signature-a",
    savedAt: "2026-07-30T08:00:00.000Z"
};
const attendanceRepo = {
    loadRoomAttendanceSummaries: async () => ({
        "room-1_2026-07-30": {
            clsId: "room-1",
            date: "2026-07-30",
            data: { s1: "present" }
        }
    }),
    loadAttendanceRecord: async (roomId, date) => (
        roomId === "room-1" && date === "2026-07-30"
            ? { ...attendanceRecord, clsId: roomId, date }
            : null
    )
};
const retroRepo = {
    loadRoomRecords: async () => ({}),
    loadRecord: async recordId => ({
        roomId: "room-1",
        date: "2026-07-31",
        retroStart: "2026-07-01",
        retroEnd: "2026-07-03",
        totalBoxes: 3,
        id: recordId
    })
};
const vacationRepo = {
    loadRoomRecords: async () => ({}),
    loadRecord: async recordId => ({
        roomId: "room-1",
        date: "2026-07-31",
        academicYear: "2569",
        semester: "1",
        totalBoxes: 30,
        id: recordId
    })
};
const service = new AdminRoomService(
    { loadLoginOptions: async () => ({ rooms: [room] }) },
    {
        loadTeacherView: async (session, options) => {
            calls.push(["teacher-view", session, options]);
            return {
            snapshot: {
                attendance: {},
                absentMilk: {},
                retroMilk: {},
                vacationMilk: {},
                students: room.students,
                room,
                session,
                roomStock: 9,
                distributes: [],
                stockTransactions: []
            },
            dashboard: {
                delegatedRoomId: session.roomId
            }
        };
        },
        buildDashboard: snapshot => ({
            students: snapshot.students.length,
            actualRoomStock: snapshot.roomStock,
            attendanceDays: Object.keys(snapshot.attendance).length,
            usedTotal: 2,
            delegatedRoomId: snapshot.session.roomId
        }),
        normalizeStudents: students => students.map((student, index) => ({
            ...student,
            id: String(student["รหัสประจำตัว"] || student.id || `student_${index + 1}`),
            num: String(student["เลขที่"] || student.num || index + 1),
            name: String(student["ชื่อ-นามสกุล"] || student.name || `นักเรียนคนที่ ${index + 1}`)
        }))
    },
    attendanceService,
    pendingService,
    retroService,
    vacationService,
    {
        attendance: attendanceRepo,
        pending: pendingRepo,
        retroactive: retroRepo,
        vacation: vacationRepo
    }
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
assert.equal(calls[0][2].includeExtras, false);
assert.equal(calls[0][2].attendanceMode, "none");

const editor = await service.loadAttendanceEditor(admin, "room-1", "2026-07-30");
assert.equal(editor.date, "2026-07-30");
assert.equal(editor.students.length, 1);
assert.equal(editor.record.photos[0], "photo-a");

const attendanceDetail = await service.loadRecordDetail(
    admin,
    "room-1",
    "attendance",
    { date: "2026-07-30" }
);
assert.equal(attendanceDetail.type, "attendance");
assert.equal(attendanceDetail.record.photos[0], "photo-a");
assert.equal(attendanceDetail.record.signature, "signature-a");
assert.equal(attendanceDetail.students[0].name, "นักเรียนหนึ่ง");

room.students = [
    { "รหัสประจำตัว": "8710", "เลขที่": "1", "ชื่อ-นามสกุล": "นักเรียนจริง หนึ่ง" },
    { "รหัสประจำตัว": "8711", "เลขที่": "2", "ชื่อ-นามสกุล": "นักเรียนจริง สอง" },
    {}
];
attendanceRecord.data = {
    student_1: "present",
    student_2: "present",
    "8710": "present",
    "8711": "absent"
};
const normalizedRosterDetail = await service.loadRecordDetail(
    admin,
    "room-1",
    "attendance",
    { date: "2026-07-30" }
);
assert.deepEqual(
    normalizedRosterDetail.students.map(student => student.id),
    ["8710", "8711"],
    "Admin history must normalize Thai roster fields and must not invent placeholder students"
);
assert.deepEqual(
    normalizedRosterDetail.students.map(student => student.name),
    ["นักเรียนจริง หนึ่ง", "นักเรียนจริง สอง"]
);
room.students = [{ id: "s1", num: 1, name: "นักเรียนหนึ่ง" }];
attendanceRecord.data = { s1: "present" };

const pendingDetail = await service.loadRecordDetail(
    admin,
    "room-1",
    "pending",
    { recordId: "p1" }
);
assert.equal(pendingDetail.type, "pending");
assert.equal(pendingDetail.record.roomId, "room-1");

await service.saveAttendanceEditor(admin, "room-1", {
    date: "2026-07-30",
    data: { s1: "absent" },
    notes: { s1: "แก้ไขโดยผู้ดูแล" },
    photos: ["must-not-replace"],
    signature: "must-not-replace"
});
const attendanceSave = calls.find(call => call[0] === "attendance-save");
assert.equal(attendanceSave[1].role, "teacher");
assert.equal(attendanceSave[1].adminOverride, true);
assert.equal(JSON.stringify(attendanceSave[2].data), JSON.stringify({ s1: "absent" }));
assert.equal(JSON.stringify(attendanceSave[2].photos), JSON.stringify(["photo-a"]));
assert.equal(attendanceSave[2].signature, "signature-a");
assert.equal(attendanceSave[2].savedAt, "2026-07-30T08:00:00.000Z");

await service.deleteRecord(admin, "room-1", "attendance", { date: "2026-07-30" });
const attendanceDelete = calls.find(call => call[0] === "attendance-delete");
assert.equal(attendanceDelete[1].roomId, "room-1");
assert.equal(attendanceDelete[1].role, "teacher");
assert.equal(attendanceDelete[2].date, "2026-07-30");

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
