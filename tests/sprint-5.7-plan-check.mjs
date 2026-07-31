import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plan = fs.readFileSync(path.join(root, "docs/SPRINT_5_7_PLAN.md"), "utf8");

for (const expected of [
    "Operational Summaries and Period Reports",
    "รายวัน", "รายสัปดาห์", "15 วัน", "รายเดือน", "ภาคเรียน",
    "Attendance + Pending + Retroactive + Vacation",
    "shallow=true", "UTF-8 BOM", "read-only",
    "index.html", "teacher.html", "73/73"
]) {
    assert.ok(plan.includes(expected), `Sprint 5.7 plan must contain ${expected}`);
}

console.log("Sprint 5.7 plan checks passed.");
