class ReportManager {
    constructor(
        service = window.ReportService,
        browserLocalAdapter = window.BrowserLocalReportAdapter
    ) {
        this.service = service;
        this.browserLocalAdapter = browserLocalAdapter;
        this.view = "room";
        this.currentReport = null;
        this.loading = false;
    }

    ensureService() {
        if (!this.service) {
            this.service = window.ReportService;
        }

        if (!this.service?.generate) {
            throw new Error("ReportService is not available.");
        }

        return this.service;
    }

    ensureBrowserLocalAdapter() {
        if (!this.browserLocalAdapter) {
            this.browserLocalAdapter = window.BrowserLocalReportAdapter;
        }
        return this.browserLocalAdapter?.read ? this.browserLocalAdapter : null;
    }

    setView(view) {
        this.view = this.ensureService().normalizeView(view);

        if (this.currentReport) {
            const rows = this.view === "grade"
                ? this.currentReport.gradeSummary
                : this.view === "school"
                    ? [this.currentReport.schoolTotal]
                    : this.currentReport.roomSummary;

            this.currentReport = {
                ...this.currentReport,
                view: this.view,
                rows
            };
        }

        this.emit("milkapp:report-view-change", {
            view: this.view,
            report: this.currentReport
        });

        return this.view;
    }

    async refresh(extraSources = {}) {
        if (this.loading) {
            return this.currentReport;
        }

        this.loading = true;
        this.emit("milkapp:report-loading", { view: this.view });

        try {
            const service = this.ensureService();
            const adapter = this.ensureBrowserLocalAdapter();
            if (adapter && service.loadSnapshot && service.buildReport) {
                const snapshot = await service.loadSnapshot();
                const localSources = adapter.read(snapshot);
                this.currentReport = service.buildReport({
                    ...snapshot,
                    ...localSources,
                    ...extraSources
                }, this.view);
            } else {
                this.currentReport = await service.generate(this.view, extraSources);
            }

            this.emit("milkapp:report-ready", {
                view: this.view,
                report: this.currentReport
            });

            return this.currentReport;
        } catch (error) {
            this.emit("milkapp:report-error", {
                view: this.view,
                error
            });
            throw error;
        } finally {
            this.loading = false;
        }
    }

    getCurrentReport() {
        return this.currentReport;
    }

    getRows() {
        return this.currentReport?.rows || [];
    }

    getSchoolTotal() {
        return this.currentReport?.schoolTotal || null;
    }

    buildExportModel() {
        if (!this.currentReport) {
            throw new Error("Generate a report before exporting.");
        }

        return this.ensureService().buildExportModel(this.currentReport);
    }

    buildPrintModel() {
        if (!this.currentReport) {
            throw new Error("Generate a report before printing.");
        }

        return this.ensureService().buildPrintModel(this.currentReport);
    }

    emit(eventName, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }

        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

window.ReportManager = new ReportManager();
