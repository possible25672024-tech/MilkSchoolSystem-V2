import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const plan = fs.readFileSync(path.join(root, "docs/SPRINT_5_0_PLAN.md"), "utf8");

for (const expected of [
    "Operational Admin Report Integration",
    "storedMilkDB_v1",
    "backdateDistDB_v1",
    "vacationDistDB_v1",
    "deduplicate",
    "photos and signatures",
    "classroom, grade, and whole-school views",
    "`index.html` and `teacher.html` remain unchanged",
    "Main Stock changes only through classroom distribution",
    "does not authorize `main`"
]) {
    assert.ok(plan.includes(expected), `Sprint 5.0 plan must contain ${expected}`);
}

console.log("Sprint 5.0 plan checks passed.");
