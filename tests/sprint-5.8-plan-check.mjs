import assert from "node:assert/strict";
import fs from "node:fs";

const plan = fs.readFileSync("docs/SPRINT_5_8_PLAN.md", "utf8");
for (const expected of [
    "Admin System Tools", "เอกสารที่เกี่ยวข้อง", "ตั้งค่าระบบ", "สำรอง/กู้คืน",
    "Google Drive", "SHA-256", "ETag", "กู้คืนข้อมูล", "index.html", "teacher.html", "78/78"
]) assert.ok(plan.includes(expected), `Sprint 5.8 plan must contain ${expected}`);

console.log("Sprint 5.8 plan checks passed.");
