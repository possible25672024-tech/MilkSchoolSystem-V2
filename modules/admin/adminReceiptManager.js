class AdminReceiptManager {
    constructor(
        service = window.AdminReceiptService,
        authService = window.AuthService
    ) {
        this.service = service;
        this.authService = authService;
        this.current = null;
    }

    ensureDependencies() {
        this.service ||= window.AdminReceiptService;
        this.authService ||= window.AuthService;
        if (!this.service?.load || !this.service?.receive || !this.authService?.getSession) {
            throw new Error("Admin Receipt dependencies are not available.");
        }
    }

    getSession() {
        this.ensureDependencies();
        return this.authService.getSession();
    }

    preview(input = {}) {
        return this.service.preview(this.getSession(), input);
    }

    async refresh() {
        this.current = await this.service.load(this.getSession());
        return this.current;
    }

    async receive(input = {}) {
        const result = await this.service.receive(this.getSession(), input);
        await this.refresh();
        return result;
    }

    clear() {
        this.current = null;
    }
}

window.AdminReceiptManager = new AdminReceiptManager();
