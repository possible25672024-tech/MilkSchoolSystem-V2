class MilkSchoolApplication {
    constructor(
        loginManager = window.LoginManager,
        teacherView = window.TeacherView,
        attendanceView = window.AttendanceView
    ) {
        this.loginManager = loginManager;
        this.teacherView = teacherView;
        this.attendanceView = attendanceView;
        this.started = false;
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

        this.started = true;
        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
