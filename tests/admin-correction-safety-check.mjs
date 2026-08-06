import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const distributionService = fs.readFileSync("modules/admin/adminDistributionService.js", "utf8");
const distributionView = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");
const reportService = fs.readFileSync("modules/admin/adminOperationalReportService.js", "utf8");
const reportView = fs.readFileSync("modules/admin/adminOperationalReportView.js", "utf8");
const systemRepository = fs.readFileSync("modules/repositories/adminSystemRepository.js", "utf8");
const firebaseService = fs.readFileSync("modules/services/firebaseService.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const source of [distributionService, distributionView, reportService, reportView, systemRepository, firebaseService]) {
    assert.doesNotThrow(() => new vm.Script(source));
}
for (const marker of [
    'id="admin-distribution-photos"',
    'id="admin-distribution-receiver-name"',
    'id="admin-distribution-receiver-signature"',
    'id="admin-distribution-sender-name"',
    'id="admin-distribution-sender-signature"'
]) {
    assert.ok(html.includes(marker), `Distribution evidence UI is missing ${marker}`);
}
assert.match(distributionService, /photos: distribution\.photos/);
assert.match(distributionService, /signatures: distribution\.signatures/);
assert.match(reportService, /effectiveStockAfter: expectedStockAfter/);
assert.match(reportService, /"Main Stock หลัง \(คำนวณ\)"/);
assert.match(reportService, /"Main Stock หลัง \(บันทึกเดิม\)"/);
assert.match(reportView, /Main Stock ปัจจุบันอ่านจาก milkApp\/stock เท่านั้น/);
assert.match(systemRepository, /getWithEtag\(this\.appRoot, \{ print: "silent" \}\)/);
assert.match(systemRepository, /loadRootKeys/);
assert.doesNotMatch(systemRepository, /getWithEtag\([^\n]+shallow: true/);

const firebaseContext = vm.createContext({
    console,
    URLSearchParams,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: async () => { throw new Error("not used"); },
    window: {}
});
new vm.Script(firebaseService).runInContext(firebaseContext);
const FirebaseService = firebaseContext.window.FirebaseService.constructor;
const firebase = new FirebaseService();
firebase.databaseURL = "https://example.firebaseio.com";
const markerUrl = new URL(firebase.buildURL("milkApp", { print: "silent" }));
assert.equal(markerUrl.searchParams.get("print"), "silent");
assert.equal(markerUrl.searchParams.get("shallow"), null);

console.log("Admin distribution evidence, stock audit and Firebase backup safety checks passed.");
