class MilkSchoolApplication {
    constructor(
        loginManager = window.LoginManager,
        teacherView = window.TeacherView,
        attendanceView = window.AttendanceView,
        syncView = window.SyncView,
        pendingMilkView = window.PendingMilkView,
        retroactiveMilkView = window.RetroactiveMilkView,
        vacationMilkView = window.VacationMilkView,
        attendanceEvidenceView = window.AttendanceEvidenceView
    ) {
        this.loginManager = loginManager;
        this.teacherView = teacherView;
        this.attendanceView = attendanceView;
        this.syncView = syncView;
        this.pendingMilkView = pendingMilkView;
        this.retroactiveMilkView = retroactiveMilkView;
        this.vacationMilkView = vacationMilkView;
        this.attendanceEvidenceView = attendanceEvidenceView;
        this.attendanceEvidenceAdapter = window.AttendanceEvidenceAdapter;
        this.retroactiveSyncAdapter = window.RetroactiveSyncAdapter;
        this.vacationSyncAdapter = window.VacationSyncAdapter;
        this.started = false;
    }

    async ensureAttendanceEvidenceView() {
        if (!window.MediaPolicy) await import("../media/mediaPolicy.js");
        if (!window.MediaProcessor) await import("../media/mediaProcessor.js");
        if (!window.MediaStore) await import("../media/mediaStore.js");
        if (!window.MediaEnvelope) await import("../media/mediaEnvelope.js");
        if (!window.SignaturePadClass) await import("../signature/signaturePad.js");
        if (!window.AttendanceEvidenceManager) await import("../media/attendanceEvidenceManager.js");
        if (!this.attendanceEvidenceAdapter) {
            await import("../media/attendanceEvidenceAdapter.js");
            this.attendanceEvidenceAdapter = window.AttendanceEvidenceAdapter;
        }
        this.attendanceEvidenceAdapter?.install?.();
        if (!this.attendanceEvidenceView) {
            await import("../media/attendanceEvidenceView.js");
            this.attendanceEvidenceView = window.AttendanceEvidenceView;
        }
        return this.attendanceEvidenceView;
    }

    async ensureRetroactiveSyncAdapter() {
        if (!this.retroactiveSyncAdapter) {
            await import("../sync/retroactiveSyncAdapter.js");
            this.retroactiveSyncAdapter = window.RetroactiveSyncAdapter;
        }
        this.retroactiveSyncAdapter?.install?.();
        return this.retroactiveSyncAdapter;
    }

    async ensureVacationSyncAdapter() {
        if (!this.vacationSyncAdapter) {
            await import("../sync/vacationSyncAdapter.js");
            this.vacationSyncAdapter = window.VacationSyncAdapter;
        }
        this.vacationSyncAdapter?.install?.();
        return this.vacationSyncAdapter;
    }

    async ensureSyncView() {
        if (!this.syncView) {
            await import("../sync/syncView.js");
            this.syncView = window.SyncView;
        }
        return this.syncView;
    }

    async ensurePendingMilkView() {
        if (!window.PendingMilkRepository) await import("../repositories/pendingMilkRepository.js");
        if (!window.PendingMilkService) await import("../services/pendingMilkService.js");
        if (!window.PendingMilkManager) await import("../pending/pendingMilkManager.js");
        if (!this.pendingMilkView) {
            await import("../pending/pendingMilkView.js");
            this.pendingMilkView = window.PendingMilkView;
        }
        return this.pendingMilkView;
    }

    async ensureRetroactiveMilkView() {
        if (!window.RetroactiveMilkRepository) await import("../repositories/retroactiveMilkRepository.js");
        if (!window.RetroactiveMilkService) await import("../services/retroactiveMilkService.js");
        if (!window.RetroactiveMilkManager) await import("../retroactive/retroactiveMilkManager.js");
        if (!this.retroactiveMilkView) {
            await import("../retroactive/retroactiveMilkView.js");
            this.retroactiveMilkView = window.RetroactiveMilkView;
        }
        return this.retroactiveMilkView;
    }

    async ensureVacationMilkView() {
        if (!window.VacationMilkRepository) await import("../repositories/vacationMilkRepository.js");
        if (!window.VacationMilkService) await import("../services/vacationMilkService.js");
        if (!window.VacationMilkManager) await import("../vacation/vacationMilkManager.js");
        if (!this.vacationMilkView) {
            await import("../vacation/vacationMilkView.js");
            this.vacationMilkView = window.VacationMilkView;
        }
        return this.vacationMilkView;
    }

    async start() {
        if (this.started) return;
        if (!this.loginManager) throw new Error("LoginManager is not available.");

        await this.loginManager.initialize();
        if (this.teacherView?.initialize) await this.teacherView.initialize();

        const attendanceEvidenceView = await this.ensureAttendanceEvidenceView();
        if (this.attendanceView?.initialize) await this.attendanceView.initialize();
        if (attendanceEvidenceView?.initialize) await attendanceEvidenceView.initialize();

        const retroactiveSyncAdapter = await this.ensureRetroactiveSyncAdapter();
        const vacationSyncAdapter = await this.ensureVacationSyncAdapter();
        const syncView = await this.ensureSyncView();
        this.attendanceEvidenceAdapter?.install?.();
        retroactiveSyncAdapter?.install?.();
        vacationSyncAdapter?.install?.();
        if (syncView?.initialize) await syncView.initialize();

        const pendingMilkView = await this.ensurePendingMilkView();
        if (pendingMilkView?.initialize) await pendingMilkView.initialize();

        const retroactiveMilkView = await this.ensureRetroactiveMilkView();
        if (retroactiveMilkView?.initialize) await retroactiveMilkView.initialize();

        const vacationMilkView = await this.ensureVacationMilkView();
        if (vacationMilkView?.initialize) await vacationMilkView.initialize();

        this.started = true;
        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
