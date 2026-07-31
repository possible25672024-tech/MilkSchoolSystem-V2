import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");
const viewSource = read("modules/admin/adminOperationalReportView.js");
const managerSource = read("modules/admin/adminOperationalReportManager.js");
const appSource = read("modules/core/app.js");
const indexSource = read("index-v2.html");

for (const source of [viewSource, managerSource]) {
    assert.doesNotThrow(() => new vm.Script(source));
}
for (const forbidden of ["FirebaseService", "fetch(", "XMLHttpRequest", "localStorage", "sessionStorage", "stockLog", "Queue"] ) {
    assert.ok(!viewSource.includes(forbidden), `Operational Report View must not own ${forbidden}`);
}
for (const expected of [
    'data-admin-menu="operational-summary"',
    'data-admin-menu="distribution-report"',
    'data-admin-section="operational-summary"',
    'data-admin-section="distribution-report"',
    'value="day"', 'value="week"', 'value="fortnight"', 'value="month"', 'value="semester"',
    'id="admin-operational-print"', 'id="admin-operational-export"',
    'id="admin-distribution-report-print"', 'id="admin-distribution-report-export"'
]) {
    assert.ok(indexSource.includes(expected), `Sprint 5.7 UI must contain ${expected}`);
}
assert.ok(appSource.includes("ensureAdminOperationalReportView"));
assert.ok(appSource.includes("adminOperationalReportView.initialize()"));
assert.ok(viewSource.includes("พิมพ์"));
assert.ok(viewSource.includes("text/csv;charset=utf-8"));
assert.ok(viewSource.includes("\\uFEFF"), "CSV export must include a UTF-8 BOM");

console.log("Operational report Admin UI checks passed.");
