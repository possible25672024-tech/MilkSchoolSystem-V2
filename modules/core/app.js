class MilkSchoolApplication {
    constructor(loginManager = window.LoginManager) {
        this.loginManager = loginManager;
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
        this.started = true;

        console.log("MilkSchoolSystem V2 Started");
    }
}

window.App = new MilkSchoolApplication();
