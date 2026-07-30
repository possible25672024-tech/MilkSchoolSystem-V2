import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const plan = read("docs/SPRINT_4_9_PLAN.md");
const gate = read("docs/TEACHER_PARITY_CUTOVER_GATE.md");
const rehearsal = read("docs/SPRINT_4_9_CUTOVER_REHEARSAL.md");
const sprint = read("SPRINT_STATUS.md");

for (const expected of [
    "Student Report",
    "Room Stock View",
    "Safe Teacher Settings",
    "Complete Teacher Navigation",
    "milkapp_teacher_preferences_v1",
    "Protected `index.html` and `teacher.html` remain unchanged",
    "No merge to `main` is authorized",
    "Gate E — Full Regression",
    "Chrome Responsive `820 x 1180`"
]) {
    assert.ok(plan.includes(expected), `Sprint 4.9 plan must contain ${expected}`);
}
for (const label of [
    "ภาพรวมการดื่มนม",
    "เช็กดื่มนมรายวัน",
    "ประวัติการเช็ก",
    "สรุปรายงาน",
    "พิมพ์รายงาน A4",
    "นมค้างรายสัปดาห์",
    "จ่ายนมย้อนหลัง",
    "จ่ายนมช่วงปิดเทอม",
    "รายงานนักเรียน",
    "สต็อกนมคงเหลือ",
    "ตั้งค่า",
    "ออกจากระบบ"
]) {
    assert.ok(plan.includes(label), `Sprint 4.9 plan must retain ${label}`);
}
assert.ok(gate.includes("LOCAL BROWSER GATE PENDING"));
assert.ok(gate.includes("index.html   unchanged"));
assert.ok(gate.includes("teacher.html unchanged"));
assert.ok(rehearsal.includes("DOCUMENTED DRY RUN ONLY"));
assert.ok(rehearsal.includes("PRODUCTION REHEARSAL NOT EXECUTED"));
assert.ok(rehearsal.includes("PRODUCTION_ROLLBACK_PLAN.md"));
assert.ok(sprint.includes("Current Branch: `feature/sprint-4.9-teacher-parity-cutover`"));
assert.ok(sprint.includes("Sprint 4.9 — Student Report, Room Stock, Teacher Settings and Navigation Parity"));
assert.ok(sprint.includes("54/54"), "Sprint 4.9 status must record the complete regression count");
assert.ok(sprint.includes("Physical iPad remains deferred"));
assert.ok(sprint.includes("No merge to `main` is authorized"));

console.log("Sprint 4.9 plan checks passed.");
