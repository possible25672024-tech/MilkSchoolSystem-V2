import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const INCIDENT = Object.freeze({
    incidentId: "INC-2026-07-28-MQN0Z13EYX5B",
    roomId: "mqn0z13eyx5b",
    roomName: "อ.3-3",
    date: "2026-07-28",
    attendanceKey: "mqn0z13eyx5b_2026-07-28",
    recordedStockBefore: 1275,
    recordedStockAfter: 1253,
    expectedPresent: 22,
    expectedAbsent: 3
});

const args = process.argv.slice(2);
const valueFor = flag => {
    const index = args.indexOf(flag);
    return index >= 0 ? String(args[index + 1] || "").trim() : "";
};
const backupPath = valueFor("--backup");
const outputPath = valueFor("--output");

if (!backupPath) {
    console.error("Usage: node scripts/audit-room-incident.mjs --backup <firebase-backup.json> [--output <report.json>]");
    process.exit(64);
}

const absoluteBackupPath = path.resolve(backupPath);
const bytes = fs.readFileSync(absoluteBackupPath);
const parsed = JSON.parse(bytes.toString("utf8"));
const envelope = parsed?.format === "MilkSchoolSystemV2Backup" && parsed?.data
    ? parsed
    : null;
const root = envelope?.data || parsed?.milkApp || parsed;

if (!root || typeof root !== "object" || Array.isArray(root)) {
    throw new Error("Backup does not contain a Firebase milkApp root object.");
}

const entries = value => Array.isArray(value)
    ? value.map((record, index) => [String(index), record]).filter(([, record]) => record != null)
    : Object.entries(value || {});
const matching = (collection, predicate) => entries(collection)
    .filter(([, record]) => record && typeof record === "object" && predicate(record))
    .map(([id, record]) => ({ id, ...record }));
const sameRoom = record => String(record.roomId || record.clsId || "") === INCIDENT.roomId;
const sameDate = record => String(record.date || "").slice(0, 10) === INCIDENT.date
    || String(record.savedAt || record.timestamp || "").slice(0, 10) === INCIDENT.date;
const sameReference = record => String(record.referenceId || record.refId || "") === INCIDENT.attendanceKey;

const attendance = root.mcAttendance?.[INCIDENT.attendanceKey]
    || matching(root.mcAttendance, record => sameRoom(record) && sameDate(record))[0]
    || null;
const statuses = Object.values(attendance?.data || {}).map(value => String(value || "").toLowerCase());
const present = Number.isFinite(Number(attendance?.presentCount))
    ? Number(attendance.presentCount)
    : statuses.filter(value => value === "present").length;
const absent = Number.isFinite(Number(attendance?.absentCount))
    ? Number(attendance.absentCount)
    : statuses.filter(value => value === "absent").length;
const roomStock = Number(root.roomStock?.[INCIDENT.roomId]);

const collections = {
    stockTransactions: matching(root.stockTransactions, record => sameRoom(record) && (sameDate(record) || sameReference(record))),
    stockLog: matching(root.stockLog, record => sameRoom(record) && (sameDate(record) || sameReference(record))),
    pendingMilk: matching(root.absentMilk, record => sameRoom(record) && sameDate(record)),
    retroactiveMilk: matching(root.retroMilk, record => sameRoom(record) && sameDate(record)),
    vacationMilk: matching(root.vacationMilk, record => sameRoom(record) && sameDate(record)),
    distributions: matching(root.distributes, record => sameRoom(record) && sameDate(record))
};

const findings = [];
const addFinding = (severity, code, message) => findings.push({ severity, code, message });
if (!root.rooms?.[INCIDENT.roomId]) {
    addFinding("BLOCKER", "ROOM_MISSING", "ไม่พบห้องที่กักกันในไฟล์สำรอง");
}
if (!attendance) {
    addFinding("REVIEW", "ATTENDANCE_MISSING", "ไม่พบ Attendance ของวันที่เกิดเหตุ ต้องยืนยันว่าเคยลบอย่างถูกต้องหรือข้อมูลสำรองไม่ครอบคลุม");
} else {
    if (present !== INCIDENT.expectedPresent || absent !== INCIDENT.expectedAbsent) {
        addFinding("BLOCKER", "ATTENDANCE_COUNTS_CHANGED", `Attendance ปัจจุบันเป็นมา ${present} / ขาด ${absent} ไม่ตรงหลักฐานเดิม 22 / 3`);
    }
    if (String(attendance.clsId || attendance.roomId || "") !== INCIDENT.roomId) {
        addFinding("BLOCKER", "ATTENDANCE_ROOM_MISMATCH", "Attendance key และ roomId ภายในรายการไม่ตรงกัน");
    }
}
if (!Number.isFinite(roomStock)) {
    addFinding("BLOCKER", "ROOM_STOCK_MISSING", "ไม่พบ Room Stock ที่เป็นตัวเลข");
} else if (roomStock !== INCIDENT.recordedStockAfter) {
    addFinding("REVIEW", "ROOM_STOCK_CHANGED_AFTER_INCIDENT", `Room Stock ในไฟล์สำรองเป็น ${roomStock} ไม่ใช่ค่าที่กักกัน 1,253 ต้องกระทบยอดกับรายการหลังเกิดเหตุ`);
}
if (!collections.stockTransactions.length) {
    addFinding("BLOCKER", "LEDGER_EVIDENCE_MISSING", "ไม่พบ stockTransactions ที่อ้างถึงห้อง/วันที่เกิดเหตุ");
}
if (!collections.stockLog.length) {
    addFinding("BLOCKER", "STOCK_LOG_EVIDENCE_MISSING", "ไม่พบ stockLog ที่อ้างถึงห้อง/วันที่เกิดเหตุ");
}
if (collections.pendingMilk.length || collections.retroactiveMilk.length || collections.vacationMilk.length) {
    addFinding("BLOCKER", "DEPENDENT_MILK_RECORDS_EXIST", "พบรายการ Pending/Retroactive/Vacation ที่เกี่ยวข้อง ต้องตรวจผลกระทบก่อนลบ Attendance");
}

const blockers = findings.filter(finding => finding.severity === "BLOCKER");
const report = {
    schema: "MilkSchoolSystemV2IncidentAudit/v1",
    generatedAt: new Date().toISOString(),
    source: {
        fileName: path.basename(absoluteBackupPath),
        sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
        envelopeCreatedAt: envelope?.createdAt || null,
        envelopeChecksum: envelope?.integrity?.checksum || null
    },
    incident: INCIDENT,
    observed: {
        roomExists: Boolean(root.rooms?.[INCIDENT.roomId]),
        roomName: String(root.rooms?.[INCIDENT.roomId]?.name || root.rooms?.[INCIDENT.roomId]?.roomName || ""),
        roomStock: Number.isFinite(roomStock) ? roomStock : null,
        attendanceExists: Boolean(attendance),
        attendancePresent: attendance ? present : null,
        attendanceAbsent: attendance ? absent : null,
        matchingRecordCounts: Object.fromEntries(Object.entries(collections).map(([key, records]) => [key, records.length]))
    },
    evidence: collections,
    findings,
    decision: blockers.length
        ? "BLOCKED_REQUIRES_INVESTIGATION"
        : "READY_FOR_PRODUCT_OWNER_DISPOSITION",
    safeNextAction: attendance
        ? "Product owner must decide whether the test-created Attendance is deleted through the protected Attendance workflow; do not edit Room Stock directly."
        : "Verify the authoritative Production export and prior audit trail before recording closure.",
    productionWritePerformed: false,
    incidentClosed: false
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (outputPath) {
    const absoluteOutputPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
    fs.writeFileSync(absoluteOutputPath, serialized);
    console.log(`Incident audit report written: ${absoluteOutputPath}`);
}
console.log(serialized.trim());
process.exitCode = blockers.length ? 2 : 0;
