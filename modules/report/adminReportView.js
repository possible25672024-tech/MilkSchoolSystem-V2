class AdminReportView {
    constructor(
        reportManager = window.ReportManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.reportManager = reportManager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.window = options.window || window;
        this.document = options.document || document;
        this.view = "room";
        this.report = null;
        this.bound = false;
        this.handleLoginSuccess = event => this.handleSession(event?.detail?.session);
        this.handleLogout = () => this.reset();
    }

    element(id) {
        return this.document.getElementById(id);
    }

    ensureManager() {
        if (!this.reportManager) this.reportManager = this.window.ReportManager;
        const required = ["setView", "refresh", "buildPrintModel", "buildExportModel"];
        const missing = required.find(method => !this.reportManager?.[method]);
        if (missing) throw new Error(`ReportManager method ${missing} is not available.`);
        return this.reportManager;
    }

    initialize() {
        this.bindEvents();
        this.handleSession(this.authService?.getSession?.());
    }

    bindEvents() {
        if (this.bound) return;
        this.element("admin-report-refresh")?.addEventListener("click", () => this.load());
        this.element("admin-report-print")?.addEventListener("click", () => this.print());
        this.element("admin-report-export")?.addEventListener("click", () => this.exportCsv());
        this.document.querySelectorAll?.("[data-admin-report-view]")?.forEach(button => {
            button.addEventListener("click", () => this.selectView(button.dataset.adminReportView));
        });
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.bound = true;
    }

    handleSession(session) {
        const panel = this.element("admin-report-panel");
        if (session?.role !== "admin") {
            panel?.setAttribute("hidden", "");
            return;
        }
        panel?.removeAttribute("hidden");
        this.load();
    }

    async selectView(view) {
        this.view = this.ensureManager().setView(view);
        this.updateActiveView();
        if (this.reportManager.getCurrentReport?.()) {
            this.report = this.reportManager.getCurrentReport();
            this.render();
            return this.report;
        }
        return this.load();
    }

    async load() {
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลดรายงาน...");
        try {
            const manager = this.ensureManager();
            manager.setView(this.view);
            this.report = await manager.refresh();
            this.render();
            this.setStatus(`โหลดรายงานสำเร็จ ${this.report.rows.length} รายการ`);
            return this.report;
        } catch (error) {
            this.showError(error?.message || "โหลดรายงานไม่สำเร็จ");
            this.setStatus("");
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    updateActiveView() {
        this.document.querySelectorAll?.("[data-admin-report-view]")?.forEach(button => {
            const active = button.dataset.adminReportView === this.view;
            button.dataset.active = active ? "true" : "false";
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    rowLabel(row) {
        if (this.view === "grade") return row.grade;
        if (this.view === "school") return this.report?.schoolName || "ทั้งโรงเรียน";
        return row.roomName;
    }

    render() {
        const report = this.report;
        const body = this.element("admin-report-body");
        if (!report || !body) return;
        this.updateActiveView();
        body.replaceChildren(...report.rows.map(row => {
            const tr = this.document.createElement("tr");
            [
                this.rowLabel(row),
                row.students,
                row.distTotal,
                row.usedChk,
                row.usedPending,
                row.usedRetro,
                row.usedVacation,
                row.remaining,
                `${row.usedPercent}%`
            ].forEach(value => {
                const td = this.document.createElement("td");
                td.textContent = String(value ?? "");
                tr.appendChild(td);
            });
            return tr;
        }));

        const total = report.schoolTotal;
        this.setText("admin-report-school", report.schoolName);
        this.setText("admin-report-year", report.academicYear || "ไม่ระบุ");
        this.setText("admin-report-total-rooms", `${total.roomCount} ห้อง`);
        this.setText("admin-report-total-distributed", `${total.distTotal} กล่อง`);
        this.setText("admin-report-total-used", `${total.distTotal - total.remaining} กล่อง`);
        this.setText("admin-report-total-remaining", `${total.remaining} กล่อง`);
        this.renderDiagnostics(report.sourceDiagnostics);
    }

    renderDiagnostics(diagnostics = {}) {
        const counts = diagnostics.counts || {};
        const invalid = Array.isArray(diagnostics.invalid) ? diagnostics.invalid : [];
        const text = [
            `ข้อมูลในเครื่อง: นมค้าง ${counts.pending || 0}`,
            `ย้อนหลัง ${counts.retro || 0}`,
            `ปิดเทอม ${counts.vacation || 0}`
        ].join(" · ");
        this.setText(
            "admin-report-source-status",
            invalid.length ? `${text} · ข้ามข้อมูลเสีย ${invalid.length} แหล่ง` : text
        );
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setBusy(busy) {
        for (const id of ["admin-report-refresh", "admin-report-print", "admin-report-export"]) {
            const element = this.element(id);
            if (element) element.disabled = Boolean(busy);
        }
    }

    setStatus(message) {
        this.setText("admin-report-status", message);
    }

    showError(message) {
        const element = this.element("admin-report-error");
        if (!element) return;
        element.textContent = message || "";
        element.hidden = !message;
    }

    escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    print() {
        if (!this.report) return;
        const model = this.ensureManager().buildPrintModel();
        const columns = Object.keys(model.rows[0] || {});
        const popup = this.window.open("", "_blank");
        if (!popup) {
            this.showError("เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาต Pop-up");
            return;
        }
        popup.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${this.escape(model.title)}</title>
<style>@page{size:A4 landscape;margin:10mm}body{font-family:Sarabun,sans-serif;color:#111}h1,p{text-align:center;margin:4px}table{width:100%;border-collapse:collapse;margin-top:14px;font-size:9pt}th,td{border:1px solid #555;padding:5px;text-align:center}th{background:#e8f1f7}</style></head>
<body><h1>${this.escape(model.title)}</h1><p>${this.escape(model.schoolName)}</p><p>ปีการศึกษา ${this.escape(model.academicYear || "ไม่ระบุ")}</p>
<table><thead><tr>${columns.map(column => `<th>${this.escape(column)}</th>`).join("")}</tr></thead>
<tbody>${model.rows.map(row => `<tr>${columns.map(column => `<td>${this.escape(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.addEventListener("load",()=>window.print())<\/script></body></html>`);
        popup.document.close();
    }

    csvCell(value) {
        const text = String(value ?? "");
        return `"${text.replaceAll('"', '""')}"`;
    }

    exportCsv() {
        if (!this.report) return;
        const model = this.ensureManager().buildExportModel();
        const columns = Object.keys(model.rows[0] || {});
        const lines = [
            columns.map(column => this.csvCell(column)).join(","),
            ...model.rows.map(row => columns.map(column => this.csvCell(row[column])).join(","))
        ];
        const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], {
            type: "text/csv;charset=utf-8"
        });
        const url = this.window.URL.createObjectURL(blob);
        const anchor = this.document.createElement("a");
        anchor.href = url;
        anchor.download = model.filename.replace(/\.xlsx$/i, ".csv");
        anchor.click();
        this.window.URL.revokeObjectURL(url);
    }

    reset() {
        this.report = null;
        this.element("admin-report-panel")?.setAttribute("hidden", "");
        this.element("admin-report-body")?.replaceChildren();
        this.setStatus("");
        this.showError("");
    }
}

window.AdminReportView = new AdminReportView();
