class AdminDashboardManager {
    constructor(
        service = window.AdminDashboardService,
        reportManager = window.ReportManager,
        authService = window.AuthService
    ) {
        this.service = service;
        this.reportManager = reportManager;
        this.authService = authService;
        this.current = null;
    }

    ensureDependencies() {
        this.service ||= window.AdminDashboardService;
        this.reportManager ||= window.ReportManager;
        this.authService ||= window.AuthService;
        if (!this.service?.load || !this.reportManager?.refresh || !this.authService?.getSession) {
            throw new Error("Admin Dashboard dependencies are not available.");
        }
    }

    async refresh(options = {}) {
        this.ensureDependencies();
        let report = options.report || this.reportManager.getCurrentReport?.();
        if (!report || options.forceReport === true) {
            this.reportManager.setView?.("room");
            report = await this.reportManager.refresh();
        }
        if (!report) {
            throw new Error("รายงานโรงเรียนยังโหลดไม่เสร็จ กรุณาลองใหม่");
        }
        this.current = await this.service.load(this.authService.getSession(), report);
        return this.current;
    }

    clear() {
        this.current = null;
    }
}

window.AdminDashboardManager = new AdminDashboardManager();
