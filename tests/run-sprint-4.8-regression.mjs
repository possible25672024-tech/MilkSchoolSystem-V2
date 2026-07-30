import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const testsDirectory = path.dirname(currentFile);
const minimumExpectedChecks = 48;
const requiredSprint48Checks = [
    "attendance-history-query-check.mjs",
    "attendance-print-model-check.mjs",
    "attendance-report-builder-check.mjs",
    "attendance-report-print-ui-check.mjs",
    "sprint-4.8-plan-check.mjs"
];

const checkFiles = fs.readdirSync(testsDirectory, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith("-check.mjs"))
    .map(entry => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

assert.ok(
    checkFiles.length >= minimumExpectedChecks,
    `Expected at least ${minimumExpectedChecks} regression checks, but found ${checkFiles.length}.`
);

for (const required of requiredSprint48Checks) {
    assert.ok(checkFiles.includes(required), `Required Sprint 4.8 check is missing: ${required}`);
}

console.log(`Discovered ${checkFiles.length} regression checks.`);

const startedAt = Date.now();
let passedCount = 0;

for (const [index, fileName] of checkFiles.entries()) {
    const absolutePath = path.join(testsDirectory, fileName);
    const label = `[${String(index + 1).padStart(2, "0")}/${checkFiles.length}] ${fileName}`;
    console.log(`\n=== ${label} ===`);

    const result = spawnSync(process.execPath, [absolutePath], {
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
assert.equal(passedCount, checkFiles.length, "Every discovered regression check must pass.");
console.log(`\nALL ${passedCount} REGRESSION CHECKS PASSED (${elapsedSeconds}s)`);
