class AdminConsumptionManager {
    constructor(
        service = window.AdminConsumptionService,
        authService = window.AuthService
    ) {
        this.service = service;
        this.authService = authService;
        this.overview = null;
        this.history = null;
    }

    session() {
        this.service ||= window.AdminConsumptionService;
        this.authService ||= window.AuthService;
        if (!this.service?.loadOverview || !this.authService?.getSession) {
            throw new Error("Admin consumption dependencies are not available.");
        }
        return this.authService.getSession();
    }

    async loadOverview(date) {
        this.overview = await this.service.loadOverview(this.session(), date);
        return this.overview;
    }

    async loadHistory(filters = {}) {
        this.history = await this.service.loadHistory(this.session(), filters);
        return this.history;
    }

    clear() {
        this.overview = null;
        this.history = null;
    }
}

window.AdminConsumptionManager = new AdminConsumptionManager();
