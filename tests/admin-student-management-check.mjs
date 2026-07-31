import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");
const serviceCode = read("modules/admin/adminStudentService.js");
const managerCode = read("modules/admin/adminStudentManager.js");
const viewCode = read("modules/admin/adminStudentView.js");
const appCode = read("modules/core/app.js");
const indexCode = read("index-v2.html");

for (const [name, source] of [
    ["adminStudentService.js", serviceCode],
    ["adminStudentManager.js", managerCode],
    ["adminStudentView.js", viewCode]
]) {
    assert.doesNotThrow(() => new vm.Script(source), `${name} must contain valid JavaScript`);
}

assert.ok(!serviceCode.includes("document."), "AdminStudentService must not contain DOM logic");
assert.ok(!serviceCode.includes("fetch("), "AdminStudentService must not access Firebase directly");
assert.ok(!managerCode.includes("document."), "AdminStudentManager must remain UI-framework neutral");
assert.ok(!viewCode.includes("FirebaseService"), "AdminStudentView must not access Firebase");
assert.ok(!viewCode.includes("fetch("), "AdminStudentView must not fetch directly");
assert.ok(!viewCode.includes("localStorage"), "AdminStudentView must not own browser storage");
assert.match(appCode, /ensureAdminStudentView/, "App must initialize the Sprint 5.5 Admin path");

for (const marker of [
    'data-admin-menu="student-import"',
    'data-admin-menu="room-management"',
    'data-admin-menu="student-report"',
    'id="admin-student-file"',
    'id="admin-student-import-confirm"',
    'id="admin-room-create-form"',
    'id="admin-student-report-panel"',
    'id="admin-student-report-export"'
]) {
    assert.ok(indexCode.includes(marker), `Admin V2 is missing ${marker}`);
}

const context = {
    window: { RoomService: null },
    Date,
    Object,
    Array,
    Number,
    String,
    Error,
    console
};
vm.runInNewContext(serviceCode, context);
const AdminStudentService = context.window.AdminStudentService.constructor;
const roomService = {
    async loadRooms() { return []; },
    async createRoom() {},
    async updateRoom() {},
    async deleteRoom() {},
    async prepareImportSnapshot() {},
    async confirmImportSnapshot() {}
};
const service = new AdminStudentService(roomService);
const admin = { role: "admin", isAdmin: true };
assert.throws(
    () => service.assertAdmin({ role: "teacher", isAdmin: false }),
    error => error.code === "ADMIN_SESSION_REQUIRED",
    "Student and room administration must require Admin"
);
assert.doesNotThrow(() => service.assertAdmin(admin));

const report = service.buildReport([
    {
        id: "r1",
        name: "ป.1-1",
        level: "ป.1",
        teacher: "ครูหนึ่ง",
        count: 3,
        students: [
            { id: "001", "เลขที่": 1, "ชื่อ": "เด็กชาย", "นามสกุล": "หนึ่ง", "เพศ": "ชาย" },
            { id: "002", "เลขที่": 2, "ชื่อ": "เด็กหญิง", "นามสกุล": "สอง", "เพศ": "ด.ญ." },
            { id: "student_3", name: "นักเรียนคนที่ 3", gender: "" }
        ]
    },
    {
        id: "r2",
        name: "ป.1-2",
        count: 4,
        students: []
    }
]);
assert.deepEqual(
    JSON.parse(JSON.stringify(report.totals)),
    { rooms: 2, students: 6, male: 1, female: 1, unknown: 4 },
    "Report totals must count real students and configured no-roster totals without generated duplicates"
);
assert.equal(report.rooms[0].students.length, 2, "Generated student_* fallback rows must be excluded");
assert.equal(report.rooms[0].students[0].name, "เด็กชาย หนึ่ง");
assert.equal(report.rooms[0].male, 1);
assert.equal(report.rooms[0].female, 1);

const csv = service.buildCsv(report);
assert.ok(csv.startsWith("\uFEFF"), "Thai CSV must include a UTF-8 BOM");
assert.match(csv, /"ป\.1-1"/);
assert.doesNotMatch(csv, /student_3/, "CSV must not contain generated fallback students");

console.log("Admin student management and report checks passed.");
