class MilkSchoolApplication {
    constructor(
        loginManager = window.LoginManager,
        teacherView = window.TeacherView,
        attendanceView = window.AttendanceView,
        syncView = window.SyncView,
        pendingMilkView = window.PendingMilkView
    ) {
        this.loginManager = loginManager;
        this.teacherView = teacherView;
        this.attendanceView = attendanceView;
        this.syncView = syncView;
        this.pendingMilkView = pendingMilkView;
        this.started = false;
    }

    async ensureSyncView() {
        if (!this.syncView) {
            await import("../sync/syncView.js");
            this.syncView = window.SyncView;
        }

        return this.syncView;
    }

    async ensurePendingMilkView() {
        if (!window.PendingMilkRepository) {
            await import("../repositories/pendingMilkRepository.js");
        }
        if (!window.PendingMilkService) {
            await import("../services/pendingMilkService.js");
        }
        if (!window.PendingMilkManager) {
            await import("../pending/pendingMilkManager.js");
        }
        if (!this.pendingMilkView) {
            await import("../pending/pendingMilkView.js");
            this.pendingMilkView = window.PendingMilkView;
        }

        return this.pendingMilkView;
    }

    async start() {
        if (this.started) {
            return;
        }

        if (!this.loginManager) {
            throw new Error("LoginManager is not available.");
        }

        await this.loginManager.initialize();

        if (this.teacherView?.initialize) {
            await this.teacherView.initialize();
        }

        if (this.attendanceView?.initialize) {
            await this.attendanceView.initialize();
        }

        const syncView = await this.ensureSyncView();
        if (syncView?.initialize) {
            await syncView.initialize();
        }

        const pendingMilkView = await this.ensurePendingMilkView();
        if (pendingMilkView?.initialize) {
            await pendingMilkView.initialize();
        }

        this.started = true;
        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
