import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const distributionSource = fs.readFileSync("modules/admin/adminDistributionView.js", "utf8");
const reportSource = fs.readFileSync("modules/admin/adminOperationalReportView.js", "utf8");
const html = fs.readFileSync("index-v2.html", "utf8");

for (const id of [
    "admin-distribution-history-print",
    "admin-distribution-history-export",
    "admin-distribution-report-print",
    "admin-distribution-report-export"
]) {
    assert.ok(html.includes(`id="${id}"`), `${id} is required`);
}
assert.ok(distributionSource.includes("this.chunks(rows, 30)"));
assert.ok(reportSource.includes("index += 30"));
assert.ok(distributionSource.includes("text/csv;charset=utf-8"));
assert.ok(reportSource.includes("text/csv;charset=utf-8"));

const popup = {
    html: "",
    document: {
        write(value) { popup.html += value; },
        close() {}
    }
};
const documentStub = { getElementById() { return null; } };
const windowStub = {
    open() { popup.html = ""; return popup; },
    confirm() { return true; },
    URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }
};
const context = vm.createContext({
    console,
    Date,
    Blob,
    CustomEvent: class {},
    document: documentStub,
    window: windowStub
});
new vm.Script(distributionSource).runInContext(context);
const DistributionView = context.window.AdminDistributionView.constructor;
const distributions = Array.from({ length: 65 }, (_, index) => ({
    id: `d${index + 1}`,
    date: "2026-08-01",
    roomName: `ห้อง ${index + 1}`,
    students: 20,
    days: 1,
    crates: 0,
    boxes: 20,
    total: 20,
    stockBefore: 1000 - index * 20,
    stockAfter: 980 - index * 20,
    note: "—"
}));
const distributionView = new DistributionView(
    { history: { distributions } },
    {},
    windowStub,
    { document: documentStub, window: windowStub }
);
distributionView.printHistory();
assert.equal((popup.html.match(/class="print-page"/g) || []).length, 3);
assert.ok(popup.html.includes("หน้า 3/3"));
assert.ok(popup.html.includes("ห้อง 65"));

const reportPopup = {
    html: "",
    document: {
        write(value) { reportPopup.html += value; },
        close() {}
    }
};
const reportWindow = { ...windowStub, open() { reportPopup.html = ""; return reportPopup; } };
const reportContext = vm.createContext({ console, Date, Blob, document: documentStub, window: reportWindow });
new vm.Script(reportSource).runInContext(reportContext);
const ReportView = reportContext.window.AdminOperationalReportView.constructor;
const reportRows = Array.from({ length: 61 }, (_, index) => ({ "#": index + 1, "ห้อง": `ป.${index + 1}` }));
const reportView = new ReportView(
    { buildPrintModel: () => ({ title: "รายงาน", schoolName: "โรงเรียน", academicYear: "2569", periodLabel: "ทั้งปี", rows: reportRows }) },
    {},
    reportWindow,
    { document: documentStub, window: reportWindow }
);
reportView.report = { distributions: [] };
reportView.print("distribution");
assert.equal((reportPopup.html.match(/class="print-page"/g) || []).length, 3);
assert.ok(reportPopup.html.includes("หน้า 3/3"));

console.log("Admin distribution A4 30-row pagination and UTF-8 CSV controls checks passed.");
