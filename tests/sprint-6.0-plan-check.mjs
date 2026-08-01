import assert from "node:assert/strict";
import fs from "node:fs";

const plan = fs.readFileSync("docs/SPRINT_6_0_PLAN.md", "utf8");
const status = fs.readFileSync("SPRINT_STATUS.md", "utf8");
const service = fs.readFileSync("modules/admin/adminDistributionService.js", "utf8");
const view = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");

for (const marker of [
    "feature/sprint-6.0-production-readiness-release",
    "38 students × 30 days",
    "1140 boxes",
    "Production",
    "explicit product-owner approval"
]) assert.ok(plan.includes(marker), `Sprint 6.0 plan is missing ${marker}`);

assert.ok(status.includes("Sprint 6.0 — Production Readiness and Release"));
assert.match(service, /hasSufficientMainStock: mainStockAfter >= 0/);
assert.match(service, /shortage: Math\.max\(0, -mainStockAfter\)/);
assert.match(view, /ไม่สามารถจ่ายนมได้/);
assert.match(view, /Main Stock ไม่เพียงพอ ขาดอีก/);

console.log("Sprint 6.0 plan and distribution release-safety checks passed.");
