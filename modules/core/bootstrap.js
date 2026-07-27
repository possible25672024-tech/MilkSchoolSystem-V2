class Bootstrap {
    constructor() {
        this.startPromise = null;
    }

    start() {
        if (!this.startPromise) {
            this.startPromise = this.run();
        }

        return this.startPromise;
    }

    async run() {
        try {
            const firebaseConfig = window.ConfigManager?.getFirebaseConfig?.() || {};

            if (firebaseConfig.databaseURL) {
                window.FirebaseService.initialize(firebaseConfig);
            }

            if (!window.App?.start) {
                throw new Error("Application start method is not available.");
            }

            await window.App.start();
        } catch (error) {
            console.error("MilkSchoolSystem V2 bootstrap failed.", error);
            this.renderFatalError(error);
            throw error;
        }
    }

    renderFatalError(error) {
        const errorElement = document.getElementById("bootstrap-error");
        if (!errorElement) {
            return;
        }

        errorElement.textContent = `เริ่มระบบไม่สำเร็จ: ${error.message}`;
        errorElement.hidden = false;
    }
}

window.Bootstrap = new Bootstrap();

window.addEventListener("DOMContentLoaded", () => {
    window.Bootstrap.start().catch(() => {});
}, { once: true });
