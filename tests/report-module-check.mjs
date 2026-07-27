import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const toPlainData = value => JSON.parse(JSON.stringify(value));

const indexCode = read("index-v2.html");
const repositoryCode = read("modules/repositories/reportRepository.js");
const serviceCode = read("modules/services/reportService.js");
const managerCode = read("modules/report/reportManager.js");

for (const [name, source] of [
    ["reportRepository.js", repositoryCode],
    ["reportService.js", serviceCode],
    ["reportManager.js", managerCode]
]) {
    assert.doesNotThrow(
        () => new vm.Script(source),
        `${name} must contain valid JavaScript`
    );
}

const loadOrder = [
    "modules/services/firebaseService.js",
    "modules/repositories/baseRepository.js",
    "modules/repositories/stockRepository.js",
    "modules/repositories/reportRepository.js",
    "modules/services/stockService.js",
    "modules/services/reportService.js",
    "modules/stock/stockManager.js",
    "modules/report/reportManager.js",
    "modules/core/app.js"
];

for (let position = 0; position < loadOrder.length - 1; position += 1) {
    assert.ok(
        indexCode.indexOf(loadOrder[position]) < indexCode.indexOf(loadOrder[position + 1]),
        `${loadOrder[position]} must load before ${loadOrder[position + 1]}`
    );
}

assert.ok(repositoryCode.includes("extends BaseRepository"), "ReportRepository must use BaseRepository");
assert.ok(repositoryCode.includes('this.appRoot = "milkApp"'), "ReportRepository must preserve the milkApp root");
assert.ok(repositoryCode.includes('this.path("settings")'), "ReportRepository must read settings");
assert.ok(repositoryCode.includes("loadStockSnapshot"), "ReportRepository must compose the stock report snapshot");
assert.ok(!repositoryCode.includes(".set("), "ReportRepository must remain read-only");
assert.ok(!repositoryCode.includes(".update("), "ReportRepository must not update Firebase");
assert.ok(!repositoryCode.includes(".push("), "ReportRepository must not push Firebase records");
assert.ok(!repositoryCode.includes(".reduce("), "ReportRepository must not aggregate report values");

assert.ok(!serviceCode.includes("document."), "ReportService must not contain DOM logic");
assert.ok(!serviceCode.includes("localStorage"), "ReportService must not own local storage");
assert.ok(!serviceCode.includes("sessionStorage"), "ReportService must not own sessions");
assert.ok(!serviceCode.includes("fetch("), "ReportService must not fetch directly");
assert.ok(!managerCode.includes("FirebaseService"), "ReportManager must not access Firebase directly");
assert.ok(!managerCode.includes("fetch("), "ReportManager must not fetch directly");

const serviceContext = {
    window: { ReportRepository: null },
    console,
    Date,
    Math,
    Set,
    Object,
    Array,
    Number,
    String,
    Error
};
vm.runInNewContext(serviceCode, serviceContext);
const ReportService = serviceContext.window.ReportService.constructor;
const service = new ReportService(null, {
    clock: () => new Date("2026-07-27T12:00:00.000Z")
});

assert.equal(service.parseGrade("อ2-8แม่โขะ"), "อ.2", "Grade parser must support names without a dot");
assert.equal(service.parseGrade("อ.2-7เกร๊ะคี"), "อ.2", "Grade parser must support names with a dot");
assert.equal(service.parseGrade("ป2-2"), "ป.2", "Primary grade parser must normalize the grade");
assert.equal(service.parseGrade("ห้องพิเศษ"), "ไม่ระบุชั้น", "Unknown room formats must remain unclassified");

const snapshot = {
    settings: { school: "โรงเรียนทดสอบ", year: "2569" },
    rooms: [
        { id: "r1", name: "อ2-8แม่โขะ", count: 2 },
        { id: "r2", name: "อ.2-7เกร๊ะคี", count: 3 },
        { id: "r3", name: "ป.2-1", level: "ป.2", count: 2 },
        { id: "r4", name: "ป2-2", count: 1 }
    ],
    distributes: [
        { id: "d1", roomId: "r1", total: 10 },
        { id: "d2", roomId: "r2", total: 20 },
        { id: "d3", roomId: "r3", total: 15 },
        { id: "d4", roomId: "r4", total: 5 }
    ],
    attendance: {
        "r1_2026-07-21": { data: { s1: "present", s2: "present" } },
        "r2_2026-07-21": { data: { s1: "present", s2: "absent" } },
        "r3_2026-07-21": { data: { s1: "present", s2: "present" } },
        "r4_2026-07-21": { data: { s1: "present" } }
    },
    absentMilk: {
        a1: { roomId: "r1", totalBoxes: 2 }
    },
    retroMilk: {
        rt1: { roomId: "r2", totalBoxes: 3 }
    },
    vacationMilk: {
        v1: { roomId: "r3", totalBoxes: 4 }
    },
    localPending: [
        { id: "lp1", classId: "r2" }
    ],
    localRetro: [
        { id: "lr1", classId: "r4", total: 2 }
    ],
    localVacation: [
        { id: "lv1", classId: "r1", total: 1 }
    ]
};

const snapshotBefore = JSON.stringify(snapshot);
const roomReport = service.buildReport(snapshot, "room");
assert.equal(JSON.stringify(snapshot), snapshotBefore, "Report calculations must not mutate the source snapshot");
assert.equal(roomReport.roomSummary.length, 4, "Room report must contain every configured room");

const roomById = Object.fromEntries(roomReport.roomSummary.map(room => [room.roomId, room]));
assert.equal(roomById.r1.remaining, 5, "Room r1 remaining stock must include attendance, pending, and vacation use");
assert.equal(roomById.r2.remaining, 15, "Room r2 remaining stock must include local pending and cloud retro use");
assert.equal(roomById.r3.remaining, 9, "Room r3 remaining stock must include vacation use");
assert.equal(roomById.r4.remaining, 2, "Room r4 remaining stock must include local retro use");

const gradeReport = service.buildReport(snapshot, "grade");
assert.deepEqual(
    toPlainData(gradeReport.gradeSummary.map(group => group.grade)),
    ["อ.2", "ป.2"],
    "Grade report must normalize and naturally sort grade groups"
);
assert.equal(gradeReport.gradeSummary[0].roomCount, 2, "Kindergarten grade group must contain two rooms");
assert.equal(gradeReport.gradeSummary[0].distTotal, 30, "Kindergarten grade total must aggregate distributions");
assert.equal(gradeReport.gradeSummary[0].remaining, 20, "Kindergarten grade remaining stock must aggregate room balances");

const schoolReport = service.buildReport(snapshot, "school");
assert.deepEqual(
    toPlainData(schoolReport.schoolTotal),
    {
        roomCount: 4,
        students: 8,
        distTotal: 50,
        usedChk: 6,
        usedPending: 3,
        usedRetro: 5,
        usedVacation: 5,
        remaining: 31,
        usedPercent: 38
    },
    "Whole-school totals must preserve the legacy report formula"
);
assert.equal(schoolReport.rows.length, 1, "School view must expose one total row");

const roomExport = service.buildExportModel(roomReport);
assert.equal(roomExport.sheetName, "รายงานการจ่ายนม", "Excel sheet name must remain compatible");
assert.equal(roomExport.rows.length, 4, "Room export must contain four rows");
assert.equal(roomExport.rows[0]["ห้องเรียน"], "อ2-8แม่โขะ", "Room export must retain the room name");

const repositorySnapshot = structuredClone(snapshot);
const generatedService = new ReportService({
    loadReportSnapshot: async () => repositorySnapshot
}, {
    clock: () => new Date("2026-07-27T12:00:00.000Z")
});
const generated = await generatedService.generate("grade");
assert.equal(generated.view, "grade", "Generated report must use the requested view");
assert.equal(generated.generatedAt, "2026-07-27T12:00:00.000Z", "Generated timestamp must use the injected clock");

const managerContext = {
    window: {
        ReportService: generatedService,
        dispatchEvent: () => {}
    },
    CustomEvent: class CustomEvent {
        constructor(name, options) {
            this.name = name;
            this.detail = options?.detail;
        }
    },
    console,
    Error
};
vm.runInNewContext(managerCode, managerContext);
const ReportManager = managerContext.window.ReportManager.constructor;
const manager = new ReportManager(generatedService);
await manager.refresh();
assert.equal(manager.getRows().length, 4, "Manager room view must expose classroom rows");
manager.setView("grade");
assert.equal(manager.getRows().length, 2, "Manager must switch to cached grade rows without a new Firebase read");
manager.setView("school");
assert.equal(manager.getRows().length, 1, "Manager must switch to the cached school total");
assert.equal(manager.buildPrintModel().title, "รายงานการจ่ายนม (ทั้งโรงเรียน)", "Print model must reflect the active view");

console.log("Report module checks passed.");
