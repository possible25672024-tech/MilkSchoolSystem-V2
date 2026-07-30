class MilkSchoolApplication {
    constructor(
        loginManager = window.LoginManager,
        teacherView = window.TeacherView,
        attendanceView = window.AttendanceView,
        syncView = window.SyncView,
        pendingMilkView = window.PendingMilkView,
        retroactiveMilkView = window.RetroactiveMilkView,
        vacationMilkView = window.VacationMilkView,
        attendanceEvidenceView = window.AttendanceEvidenceView,
        pendingEvidenceView = window.PendingEvidenceView,
        retroactiveEvidenceView = window.RetroactiveEvidenceView,
        vacationEvidenceView = window.VacationEvidenceView,
        attendancePrintView = window.AttendancePrintView,
        teacherParityView = window.TeacherParityView,
        adminReportView = window.AdminReportView,
        adminRoomView = window.AdminRoomView
    ) {
        this.loginManager = loginManager;
        this.teacherView = teacherView;
        this.attendanceView = attendanceView;
        this.syncView = syncView;
        this.pendingMilkView = pendingMilkView;
        this.retroactiveMilkView = retroactiveMilkView;
        this.vacationMilkView = vacationMilkView;
        this.attendanceEvidenceView = attendanceEvidenceView;
        this.pendingEvidenceView = pendingEvidenceView;
        this.retroactiveEvidenceView = retroactiveEvidenceView;
        this.vacationEvidenceView = vacationEvidenceView;
        this.attendancePrintView = attendancePrintView;
        this.teacherParityView = teacherParityView;
        this.adminReportView = adminReportView;
        this.adminRoomView = adminRoomView;
        this.attendanceEvidenceAdapter = window.AttendanceEvidenceAdapter;
        this.pendingEvidenceAdapter = window.PendingEvidenceAdapter;
        this.retroactiveEvidenceAdapter = window.RetroactiveEvidenceAdapter;
        this.vacationEvidenceAdapter = window.VacationEvidenceAdapter;
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

    async ensurePendingEvidenceView() {
        if (!window.MediaPolicy) await import("../media/mediaPolicy.js");
        if (!window.MediaProcessor) await import("../media/mediaProcessor.js");
        if (!window.MediaStore) await import("../media/mediaStore.js");
        if (!window.SignaturePadClass) await import("../signature/signaturePad.js");
        if (!window.PendingEvidenceManager) await import("../media/pendingEvidenceManager.js");
        if (!this.pendingEvidenceAdapter) {
            await import("../media/pendingEvidenceAdapter.js");
            this.pendingEvidenceAdapter = window.PendingEvidenceAdapter;
        }
        this.pendingEvidenceAdapter?.install?.();
        if (!this.pendingEvidenceView) {
            await import("../media/pendingEvidenceView.js");
            this.pendingEvidenceView = window.PendingEvidenceView;
        }
        return this.pendingEvidenceView;
    }

    async ensureRetroactiveEvidenceView() {
        if (!window.MediaPolicy) await import("../media/mediaPolicy.js");
        if (!window.MediaProcessor) await import("../media/mediaProcessor.js");
        if (!window.MediaStore) await import("../media/mediaStore.js");
        if (!window.SignaturePadClass) await import("../signature/signaturePad.js");
        if (!window.RetroactiveEvidenceManager) await import("../media/retroactiveEvidenceManager.js");
        if (!this.retroactiveEvidenceAdapter) {
            await import("../media/retroactiveEvidenceAdapter.js");
            this.retroactiveEvidenceAdapter = window.RetroactiveEvidenceAdapter;
        }
        this.retroactiveEvidenceAdapter?.install?.();
        if (!this.retroactiveEvidenceView) {
            await import("../media/retroactiveEvidenceView.js");
            this.retroactiveEvidenceView = window.RetroactiveEvidenceView;
        }
        return this.retroactiveEvidenceView;
    }

    async ensureVacationEvidenceView() {
        if (!window.MediaPolicy) await import("../media/mediaPolicy.js");
        if (!window.MediaProcessor) await import("../media/mediaProcessor.js");
        if (!window.MediaStore) await import("../media/mediaStore.js");
        if (!window.SignaturePadClass) await import("../signature/signaturePad.js");
        if (!window.VacationEvidenceManager) await import("../media/vacationEvidenceManager.js");
        if (!this.vacationEvidenceAdapter) {
            await import("../media/vacationEvidenceAdapter.js");
            this.vacationEvidenceAdapter = window.VacationEvidenceAdapter;
        }
        this.vacationEvidenceAdapter?.install?.();
        if (!this.vacationEvidenceView) {
            await import("../media/vacationEvidenceView.js");
            this.vacationEvidenceView = window.VacationEvidenceView;
        }
        return this.vacationEvidenceView;
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
        if (!window.MilkOperationPrintView) await import("../reports/milkOperationPrintView.js");
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
        if (!window.MilkOperationPrintView) await import("../reports/milkOperationPrintView.js");
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
        if (!window.MilkOperationPrintView) await import("../reports/milkOperationPrintView.js");
        if (!this.vacationMilkView) {
            await import("../vacation/vacationMilkView.js");
            this.vacationMilkView = window.VacationMilkView;
        }
        return this.vacationMilkView;
    }

    async ensureAttendancePrintView() {
        if (!window.AttendanceHistoryService) await import("../reports/attendanceHistoryService.js");
        if (!window.AttendanceHistoryManager) await import("../reports/attendanceHistoryManager.js");
        if (!window.AttendanceReportBuilder) await import("../reports/attendanceReportBuilder.js");
        if (!window.AttendancePrintModel) await import("../reports/attendancePrintModel.js");
        if (!this.attendancePrintView) {
            await import("../reports/attendancePrintView.js");
            this.attendancePrintView = window.AttendancePrintView;
        }
        return this.attendancePrintView;
    }

    async ensureTeacherParityView() {
        if (!window.TeacherParityService) await import("../services/teacherParityService.js");
        if (!window.TeacherPreferenceStore) await import("../storage/teacherPreferenceStore.js");
        if (!window.TeacherParityManager) await import("../teacher/teacherParityManager.js");
        if (!this.teacherParityView) {
            await import("../teacher/teacherParityView.js");
            this.teacherParityView = window.TeacherParityView;
        }
        return this.teacherParityView;
    }

    async ensureAdminReportView() {
        if (!window.BrowserLocalReportAdapter) {
            await import("../report/browserLocalReportAdapter.js");
        }
        if (!this.adminReportView) {
            await import("../report/adminReportView.js");
            this.adminReportView = window.AdminReportView;
        }
        return this.adminReportView;
    }

    async ensureAdminRoomView() {
        if (!window.AdminRoomService) await import("../admin/adminRoomService.js");
        if (!window.AdminRoomManager) await import("../admin/adminRoomManager.js");
        if (!this.adminRoomView) {
            await import("../admin/adminRoomView.js");
            this.adminRoomView = window.AdminRoomView;
        }
        return this.adminRoomView;
    }

    async start() {
        if (this.started) return;
        if (!this.loginManager) throw new Error("LoginManager is not available.");

        await this.loginManager.initialize();
        const adminReportView = await this.ensureAdminReportView();
        if (adminReportView?.initialize) adminReportView.initialize();
        if (this.teacherView?.initialize) await this.teacherView.initialize();

        const attendanceEvidenceView = await this.ensureAttendanceEvidenceView();
        if (this.attendanceView?.initialize) await this.attendanceView.initialize();
        if (attendanceEvidenceView?.initialize) await attendanceEvidenceView.initialize();
        const attendancePrintView = await this.ensureAttendancePrintView();
        if (attendancePrintView?.initialize) await attendancePrintView.initialize();

        const retroactiveSyncAdapter = await this.ensureRetroactiveSyncAdapter();
        const vacationSyncAdapter = await this.ensureVacationSyncAdapter();
        const syncView = await this.ensureSyncView();
        this.attendanceEvidenceAdapter?.install?.();
        retroactiveSyncAdapter?.install?.();
        vacationSyncAdapter?.install?.();
        if (syncView?.initialize) await syncView.initialize();

        const pendingMilkView = await this.ensurePendingMilkView();
        if (pendingMilkView?.initialize) await pendingMilkView.initialize();
        const pendingEvidenceView = await this.ensurePendingEvidenceView();
        if (pendingEvidenceView?.initialize) await pendingEvidenceView.initialize();

        const retroactiveMilkView = await this.ensureRetroactiveMilkView();
        if (retroactiveMilkView?.initialize) await retroactiveMilkView.initialize();
        const retroactiveEvidenceView = await this.ensureRetroactiveEvidenceView();
        if (retroactiveEvidenceView?.initialize) await retroactiveEvidenceView.initialize();

        const vacationMilkView = await this.ensureVacationMilkView();
        if (vacationMilkView?.initialize) await vacationMilkView.initialize();
        const vacationEvidenceView = await this.ensureVacationEvidenceView();
        if (vacationEvidenceView?.initialize) await vacationEvidenceView.initialize();
        vacationMilkView?.handlePreviewChange?.();

        const teacherParityView = await this.ensureTeacherParityView();
        if (teacherParityView?.initialize) await teacherParityView.initialize();

        const adminRoomView = await this.ensureAdminRoomView();
        if (adminRoomView?.initialize) adminRoomView.initialize();

        this.started = true;
        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
