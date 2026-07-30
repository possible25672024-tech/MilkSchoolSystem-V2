class TeacherParityManager {
    constructor(
        parityService = window.TeacherParityService,
        preferenceStore = window.TeacherPreferenceStore,
        historyManager = window.AttendanceHistoryManager,
        reportBuilder = window.AttendanceReportBuilder,
        teacherManager = window.TeacherManager,
        authService = window.AuthService,
        loginManager = window.LoginManager,
        options = {}
    ) {
        this.parityService = parityService;
        this.preferenceStore = preferenceStore;
        this.historyManager = historyManager;
        this.reportBuilder = reportBuilder;
        this.teacherManager = teacherManager;
        this.authService = authService;
        this.loginManager = loginManager;
        this.eventTarget = options.eventTarget || window;
        this.currentStudentReport = null;
    }

    ensureDependencies() {
        this.parityService ||= window.TeacherParityService;
        this.preferenceStore ||= window.TeacherPreferenceStore;
        this.historyManager ||= window.AttendanceHistoryManager;
        this.reportBuilder ||= window.AttendanceReportBuilder;
        this.teacherManager ||= window.TeacherManager;
        this.authService ||= window.AuthService;
        this.loginManager ||= window.LoginManager;

        if (!this.parityService?.buildStudentReport || !this.parityService?.buildRoomStock) {
            throw new Error("TeacherParityService is not available.");
        }
        if (!this.preferenceStore?.load || !this.preferenceStore?.save) {
            throw new Error("TeacherPreferenceStore is not available.");
        }
        if (!this.historyManager?.load) {
            throw new Error("AttendanceHistoryManager is not available.");
        }
        if (!this.reportBuilder?.build) {
            throw new Error("AttendanceReportBuilder is not available.");
        }
        if (
            !this.teacherManager?.refresh ||
            !this.teacherManager?.getSnapshot ||
            !this.teacherManager?.updateTeacherProfile
        ) {
            throw new Error("TeacherManager is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
        if (!this.loginManager?.logout) {
            throw new Error("LoginManager is not available.");
        }
    }

    getSession() {
        this.ensureDependencies();
        const session = this.authService.getSession();
        const roomId = String(session?.roomId || session?.classId || "").trim();
        if (session?.role !== "teacher" || !roomId || roomId === "__admin__") {
            throw new Error("Teacher session is required.");
        }
        return { ...session, roomId };
    }

    getContext() {
        const session = this.getSession();
        const snapshot = this.teacherManager.getSnapshot() || {};
        const room = snapshot.room || session.roomSnapshot || {};
        return {
            settings: snapshot.settings || {},
            schoolName: snapshot.session?.schoolName || session.schoolName,
            roomId: session.roomId,
            roomName: snapshot.session?.roomName || session.roomName || room.name,
            teacher: snapshot.session?.teacher || session.teacher || room.teacher,
            room,
            students: snapshot.students || room.students || []
        };
    }

    getOverview() {
        this.ensureDependencies();
        return this.parityService.buildOverview(this.teacherManager.getSnapshot() || {});
    }

    getPreferences() {
        const session = this.getSession();
        return this.parityService.normalizePreferences(
            this.preferenceStore.load(session.roomId)
        );
    }

    savePreferences(input = {}) {
        const session = this.getSession();
        const normalized = this.parityService.normalizePreferences(input);
        const saved = this.preferenceStore.save(session.roomId, normalized);
        this.emit("milkapp:teacher-preferences-saved", {
            roomId: session.roomId,
            defaultReportDays: saved.defaultReportDays,
            compactMode: saved.compactMode,
            rememberLastSection: saved.rememberLastSection
        });
        return { ...saved };
    }

    rememberSection(section) {
        const current = this.getPreferences();
        if (!current.rememberLastSection) {
            return current;
        }
        return this.savePreferences({ ...current, lastSection: section });
    }

    defaultRange(today) {
        const preferences = this.getPreferences();
        return this.parityService.defaultRange(preferences.defaultReportDays, today);
    }

    async loadStudentReport(input = {}) {
        const context = this.getContext();
        const history = await this.historyManager.load({
            startDate: input.startDate,
            endDate: input.endDate
        });
        const roomReport = this.reportBuilder.build(history, context);
        const report = this.parityService.buildStudentReport(
            history,
            roomReport,
            input.studentId
        );
        this.currentStudentReport = report;
        this.emit("milkapp:student-report-built", {
            roomId: report.metadata.roomId,
            studentId: report.metadata.studentId,
            startDate: report.metadata.startDate,
            endDate: report.metadata.endDate,
            recordCount: report.source.recordCount
        });
        return report;
    }

    getStudentReport() {
        return this.currentStudentReport;
    }

    async hydrateStudentReportEvidence() {
        if (!this.currentStudentReport) {
            throw new Error("Student report must be loaded before evidence.");
        }
        const history = await this.historyManager.hydrateCurrentEvidence();
        const roomReport = this.reportBuilder.build(history, this.getContext());
        const report = this.parityService.buildStudentReport(
            history,
            roomReport,
            this.currentStudentReport.metadata?.studentId
        );
        this.currentStudentReport = report;
        this.emit("milkapp:student-report-evidence-hydrated", {
            roomId: report.metadata.roomId,
            studentId: report.metadata.studentId,
            recordCount: report.source.recordCount,
            evidenceRecordCount: report.evidence.length
        });
        return report;
    }

    async refreshRoomStock() {
        this.getSession();
        await this.teacherManager.refresh({
            includeExtras: false,
            reason: "sprint-4.9-room-stock-view"
        });
        const model = this.parityService.buildRoomStock(
            this.teacherManager.getSnapshot() || {}
        );
        this.emit("milkapp:teacher-room-stock-viewed", {
            roomId: model.roomId,
            balance: model.balance,
            updatedAt: model.updatedAt
        });
        return model;
    }

    async saveTeacherProfile(input = {}) {
        const session = this.getSession();
        const saved = await this.teacherManager.updateTeacherProfile({
            roomId: session.roomId,
            teacher: input.teacher
        });
        this.emit("milkapp:teacher-profile-saved", {
            roomId: session.roomId
        });
        return saved;
    }

    logout() {
        this.ensureDependencies();
        this.loginManager.logout();
    }

    clear() {
        this.currentStudentReport = null;
    }

    emit(name, detail) {
        if (typeof this.eventTarget.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }
        this.eventTarget.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

window.TeacherParityManagerClass = TeacherParityManager;
window.TeacherParityManager = new TeacherParityManager();
