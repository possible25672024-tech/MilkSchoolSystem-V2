import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(currentFile), "..");
const read = relativePath => fs.readFileSync(path.join(root, relativePath), "utf8");
const managerCode = read("modules/teacher/teacherParityManager.js");

for (const forbidden of [
    "FirebaseService",
    "Repository",
    "fetch(",
    "XMLHttpRequest",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "mainStock",
    "stockLog",
    "stockTransactions/"
]) {
    assert.ok(!managerCode.includes(forbidden), `TeacherParityManager must not own ${forbidden}`);
}

class FakeCustomEvent {
    constructor(type, options = {}) {
        this.type = type;
        this.detail = options.detail;
    }
}
const events = [];
const eventTarget = {
    dispatchEvent(event) {
        events.push(event);
        return true;
    }
};
const session = {
    role: "teacher",
    roomId: "room-a",
    roomName: "อ.3-6",
    teacher: "ครูทดสอบ",
    schoolName: "โรงเรียนทดสอบ"
};
const snapshot = {
    settings: { year: 2569, term: 1 },
    session,
    room: { id: "room-a", name: "อ.3-6", teacher: "ครูทดสอบ" },
    students: [{ id: "s1", num: "1", name: "นักเรียนหนึ่ง" }],
    roomStock: 99,
    attendance: {},
    updatedAt: { roomStock: { "room-a": "2026-07-30T01:00:00.000Z" } }
};
const preferences = new Map();
const preferenceStore = {
    load(roomId) {
        return preferences.get(roomId) || {};
    },
    save(roomId, value) {
        preferences.set(roomId, { ...value });
        return { ...value };
    }
};
const parityService = {
    normalizePreferences(value = {}) {
        return {
            defaultReportDays: [15, 30, 90].includes(Number(value.defaultReportDays))
                ? Number(value.defaultReportDays)
                : 30,
            compactMode: value.compactMode === true,
            rememberLastSection: value.rememberLastSection !== false,
            lastSection: String(value.lastSection || "overview")
        };
    },
    defaultRange(days, today) {
        return { startDate: "2026-07-01", endDate: today || "2026-07-30", days };
    },
    buildOverview(value) {
        return { roomId: value.session.roomId, roomStock: value.roomStock };
    },
    buildStudentReport(history, report, studentId) {
        const evidence = history.records
            .filter(record => record.evidence?.loaded)
            .map(record => ({
                date: record.date,
                photos: record.photos || [],
                signature: record.signature || ""
            }));
        return {
            metadata: {
                ...report.metadata,
                studentId,
                studentName: "นักเรียนหนึ่ง"
            },
            totals: { schoolDays: history.recordCount, present: 1, absent: 0, unchecked: 0 },
            timeline: history.records,
            evidence,
            source: { recordCount: history.recordCount, evidenceHydrated: evidence.length > 0, readOnly: true }
        };
    },
    buildRoomStock(value) {
        return {
            roomId: value.session.roomId,
            roomName: value.session.roomName,
            balance: value.roomStock,
            updatedAt: value.updatedAt.roomStock[value.session.roomId],
            readOnly: true
        };
    }
};
let historyInput = null;
let currentHistory = null;
const historyManager = {
    async load(input) {
        historyInput = input;
        currentHistory = {
            roomId: "room-a",
            startDate: input.startDate,
            endDate: input.endDate,
            recordCount: 1,
            records: [{ date: input.startDate, status: "present" }]
        };
        return currentHistory;
    },
    async hydrateCurrentEvidence() {
        currentHistory = {
            ...currentHistory,
            records: currentHistory.records.map(record => ({
                ...record,
                photos: ["data:image/jpeg;base64,PHOTO"],
                signature: "data:image/png;base64,SIGNATURE",
                evidence: { loaded: true, photoCount: 1, hasSignature: true }
            }))
        };
        return currentHistory;
    }
};
let reportContext = null;
const reportBuilder = {
    build(history, context) {
        reportContext = context;
        return {
            metadata: {
                schoolName: context.schoolName,
                roomId: context.roomId,
                roomName: context.roomName,
                teacher: context.teacher,
                startDate: history.startDate,
                endDate: history.endDate
            }
        };
    }
};
let refreshInput = null;
const teacherManager = {
    getSnapshot() {
        return snapshot;
    },
    async refresh(input) {
        refreshInput = input;
        snapshot.roomStock = 101;
    },
    async updateTeacherProfile(input) {
        assert.equal(input.roomId, "room-a");
        assert.equal(input.teacher, "ครูชื่อใหม่");
        snapshot.session.teacher = input.teacher;
        snapshot.room.teacher = input.teacher;
        return {
            roomId: "room-a",
            roomName: "อ.3-6",
            teacher: input.teacher
        };
    }
};
let logoutCount = 0;
const authService = { getSession: () => session };
const loginManager = { logout: () => { logoutCount += 1; } };
const windowObject = {
    TeacherParityService: parityService,
    TeacherPreferenceStore: preferenceStore,
    AttendanceHistoryManager: historyManager,
    AttendanceReportBuilder: reportBuilder,
    TeacherManager: teacherManager,
    AuthService: authService,
    LoginManager: loginManager
};
const context = vm.createContext({
    window: windowObject,
    CustomEvent: FakeCustomEvent,
    String,
    Number,
    Object,
    Array,
    Error
});
vm.runInContext(managerCode, context, { filename: "teacherParityManager.js" });
const Manager = windowObject.TeacherParityManagerClass;
const manager = new Manager(
    parityService,
    preferenceStore,
    historyManager,
    reportBuilder,
    teacherManager,
    authService,
    loginManager,
    { eventTarget }
);

const saved = manager.savePreferences({
    defaultReportDays: 15,
    compactMode: true,
    rememberLastSection: true,
    lastSection: "student-report"
});
assert.equal(saved.defaultReportDays, 15);
assert.equal(manager.getPreferences().compactMode, true);
assert.deepEqual(JSON.parse(JSON.stringify(manager.defaultRange("2026-07-30"))), {
    startDate: "2026-07-01",
    endDate: "2026-07-30",
    days: 15
});

const report = await manager.loadStudentReport({
    studentId: "s1",
    startDate: "2026-07-01",
    endDate: "2026-07-30"
});
assert.deepEqual(JSON.parse(JSON.stringify(historyInput)), {
    startDate: "2026-07-01",
    endDate: "2026-07-30"
});
assert.equal(reportContext.roomId, "room-a");
assert.equal(report.metadata.studentId, "s1");
assert.equal(events.find(event => event.type === "milkapp:student-report-built").detail.recordCount, 1);
assert.ok(!JSON.stringify(events).includes("นักเรียนหนึ่ง"), "Manager events must remain metadata-only");

const hydratedReport = await manager.hydrateStudentReportEvidence();
assert.equal(hydratedReport.source.evidenceHydrated, true);
assert.equal(hydratedReport.evidence.length, 1);
const evidenceEvent = events.find(event => event.type === "milkapp:student-report-evidence-hydrated");
assert.equal(evidenceEvent.detail.evidenceRecordCount, 1);
assert.ok(!JSON.stringify(evidenceEvent.detail).includes("data:image"), "Evidence event must remain metadata-only");

const stock = await manager.refreshRoomStock();
assert.deepEqual(JSON.parse(JSON.stringify(refreshInput)), {
    includeExtras: false,
    reason: "sprint-4.9-room-stock-view"
});
assert.equal(stock.balance, 101);
assert.equal(stock.readOnly, true);

const profile = await manager.saveTeacherProfile({ teacher: "ครูชื่อใหม่" });
assert.equal(profile.teacher, "ครูชื่อใหม่");
const profileEvent = events.find(event => event.type === "milkapp:teacher-profile-saved");
assert.deepEqual(JSON.parse(JSON.stringify(profileEvent.detail)), { roomId: "room-a" });
assert.ok(
    !JSON.stringify(profileEvent.detail).includes("ครูชื่อใหม่"),
    "Teacher profile event must not expose the teacher name"
);
manager.logout();
assert.equal(logoutCount, 1);

console.log("Teacher parity manager checks passed.");
