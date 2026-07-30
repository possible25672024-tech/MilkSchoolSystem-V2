import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const plan = read("docs/SPRINT_5_2_PLAN.md");

for (const expected of [
    "Admin Inline Attendance Edit",
    "ไม่เปลี่ยน session",
    "Room Stock",
    "Main Stock",
    "รูปและลายเซ็น",
    "Sprint 5.3",
    "Sprint 5.8",
    "index.html",
    "teacher.html"
]) {
    assert.ok(plan.includes(expected), `Sprint 5.2 plan must contain ${expected}`);
}

console.log("Sprint 5.2 plan checks passed.");
