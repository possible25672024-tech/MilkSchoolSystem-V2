class MilkSchoolApplication {
    constructor(
        loginManager = window.LoginManager,
        teacherView = window.TeacherView,
        attendanceView = window.AttendanceView,
        syncView = window.SyncView
    ) {
        this.loginManager = loginManager;
        this.teacherView = teacherView;
        this.attendanceView = attendanceView;
        this.syncView = syncView;
        this.started = false;
    }

    async ensureSyncView() {
        if (!this.syncView) {
            await import("../sync/syncView.js");
            this.syncView = window.SyncView;
        }

        return this.syncView;
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

        this.started = true;
        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
