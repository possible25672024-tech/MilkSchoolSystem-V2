class AdminOperationalReportManager {
    constructor(
        service = window.AdminOperationalReportService,
        authService = window.AuthService,
        browserLocalAdapter = window.BrowserLocalReportAdapter
    ) {
        this.service = service;
        this.authService = authService;
        this.browserLocalAdapter = browserLocalAdapter;
        this.current = null;
    }

    ensureDependencies() {
        this.service ||= window.AdminOperationalReportService;
        this.authService ||= window.AuthService;
        this.browserLocalAdapter ||= window.BrowserLocalReportAdapter;
        if (!this.service?.resolvePeriod || !this.service?.ensureRepository || !this.authService?.getSession) {
            throw new Error("Admin Operational Report dependencies are not available.");
        }
    }

    async refresh(periodInput = {}, view = "room") {
        this.ensureDependencies();
        const session = this.authService.getSession();
        this.service.assertAdmin(session);
        const period = this.service.resolvePeriod(periodInput);
        const snapshot = await this.service.ensureRepository().loadPeriodSnapshot(period);
        const localSources = this.browserLocalAdapter?.read?.(snapshot) || {};
        this.current = this.service.build({ ...snapshot, ...localSources }, period, view);
        this.emit("milkapp:operational-report-ready", {
            period: this.current.period,
            view: this.current.view
        });
        return this.current;
    }

    buildExportModel(kind) {
        if (!this.current) throw new Error("กรุณาโหลดรายงานก่อนส่งออก");
        return this.service.buildExportModel(this.current, kind);
    }

    buildPrintModel(kind) {
        if (!this.current) throw new Error("กรุณาโหลดรายงานก่อนพิมพ์");
        return this.service.buildPrintModel(this.current, kind);
    }

    clear() {
        this.current = null;
    }

    emit(name, detail) {
        if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent(name, { detail }));
        }
    }
}

window.AdminOperationalReportManager = new AdminOperationalReportManager();
