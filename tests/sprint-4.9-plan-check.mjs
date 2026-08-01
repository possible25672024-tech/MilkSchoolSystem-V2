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
assert.match(
    gate,
    /LOCAL BROWSER GATE PENDING|PASS — AUTOMATED AND PRODUCT-OWNER BROWSER ACCEPTANCE/,
    "Sprint 4.9 gate must record either pending or accepted browser status"
);
assert.ok(gate.includes("index.html   unchanged"));
assert.ok(gate.includes("teacher.html unchanged"));
assert.ok(rehearsal.includes("DOCUMENTED DRY RUN ONLY"));
assert.ok(rehearsal.includes("PRODUCTION REHEARSAL NOT EXECUTED"));
assert.ok(rehearsal.includes("PRODUCTION_ROLLBACK_PLAN.md"));
assert.match(
    sprint,
    /Current Branch: `feature\/sprint-(?:4\.9-teacher-parity-cutover|5\.0-admin-report-ui|5\.1-attendance-scalability|5\.2-admin-inline-attendance|5\.3-admin-dashboard|5\.4-stock-audit-receipts|5\.5-student-room-management|5\.6-room-distribution|5\.7-operational-reports|5\.7\.1-report-ordering|5\.8-admin-system-tools|5\.9-integration-security-uat|5\.9\.1-admin-parity-corrections|5\.9\.2-receipt-print-backup-fixes|5\.9\.3-a4-distribution-backup-optimization|6\.0-production-readiness-release|6\.1-image-upload-optimization)`/,
    "Sprint status must identify the accepted 4.9 branch or its approved successor"
);
assert.ok(
    sprint.includes("Sprint 4.9 — Student Report, Room Stock, Teacher Settings and Navigation Parity") ||
        (
            sprint.includes("## Sprint 4.9 Goal") &&
            (
                sprint.includes("Sprint 5.0 — Operational Admin Report Integration") ||
                sprint.includes("Sprint 5.1 — Large Attendance Payload Resilience") ||
                sprint.includes("Sprint 5.2 — Admin Inline Attendance Edit") ||
                sprint.includes("Sprint 5.3 — Admin System and Stock Dashboard") ||
                sprint.includes("Sprint 5.4 — Milk Receipt and Receipt History") ||
                sprint.includes("Sprint 5.5 — Student Import, Room Management and Student Report") ||
                sprint.includes("Sprint 5.6 — Classroom Distribution and Distribution History") ||
                sprint.includes("Sprint 5.7 — Operational Summaries and Period Reports") ||
                sprint.includes("Sprint 5.7.1 — Report Ordering Correction") ||
                sprint.includes("Sprint 5.8 — Admin System Tools") ||
                sprint.includes("Sprint 5.9 — Integration, Security and UAT") ||
                sprint.includes("Sprint 5.9.1 — Admin Parity Corrections") ||
                sprint.includes("Sprint 5.9.2 — Receipt, Print and Large Backup Corrections") ||
                sprint.includes("Sprint 5.9.3 — Receipt A4, Distribution Summary and Backup Profiles")
            )
        ),
    "Sprint status must preserve the accepted Sprint 4.9 scope"
);
assert.ok(sprint.includes("54/54"), "Sprint 4.9 status must record the complete regression count");
assert.ok(sprint.includes("Physical iPad remains deferred"));
assert.ok(sprint.includes("No merge to `main` is authorized"));

console.log("Sprint 4.9 plan checks passed.");
