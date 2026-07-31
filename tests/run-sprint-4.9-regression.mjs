import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const testsDirectory = path.dirname(currentFile);
const minimumExpectedChecks = 73;
const requiredSprint49Checks = [
    "operational-report-period-check.mjs",
    "operational-report-query-check.mjs",
    "operational-report-ui-check.mjs",
    "sprint-5.7-plan-check.mjs",
    "milk-operation-print-ui-check.mjs",
    "admin-distribution-check.mjs",
    "distribution-concurrency-check.mjs",
    "admin-student-management-check.mjs",
    "room-import-concurrency-check.mjs",
    "student-import-parser-check.mjs",
    "sprint-4.9-plan-check.mjs",
    "teacher-parity-manager-check.mjs",
    "teacher-parity-service-check.mjs",
    "teacher-parity-ui-check.mjs",
    "teacher-preference-store-check.mjs"
];
const checkFiles = fs.readdirSync(testsDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith("-check.mjs"))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

assert.ok(
    checkFiles.length >= minimumExpectedChecks,
    `Expected at least ${minimumExpectedChecks} regression checks, but found ${checkFiles.length}.`
);
requiredSprint49Checks.forEach(required => {
    assert.ok(checkFiles.includes(required), `Required Sprint 4.9 check is missing: ${required}`);
});

console.log(`Discovered ${checkFiles.length} regression checks.`);
const startedAt = Date.now();
let passedCount = 0;

for (const [index, fileName] of checkFiles.entries()) {
    const label = `[${String(index + 1).padStart(2, "0")}/${checkFiles.length}] ${fileName}`;
    console.log(`\n=== ${label} ===`);
    const result = spawnSync(process.execPath, [path.join(testsDirectory, fileName)], {
        cwd: path.resolve(testsDirectory, ".."),
        encoding: "utf8",
        stdio: "pipe",
        timeout: 120_000,
        windowsHide: true
    });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    if (result.status !== 0 || result.error) {
        const reason = result.error?.message || `exit code ${String(result.status)}`;
        console.error(`\nFULL REGRESSION FAILED: ${fileName} (${reason})`);
        process.exit(result.status || 1);
    }
    passedCount += 1;
}

const elapsedSeconds = ((Date.now() - startedAt) / 1000).toFixed(1);
assert.equal(passedCount, checkFiles.length);
console.log(`\nALL ${passedCount} REGRESSION CHECKS PASSED (${elapsedSeconds}s)`);
