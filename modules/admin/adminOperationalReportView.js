class AdminOperationalReportView {
    constructor(
        manager = window.AdminOperationalReportManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.window = options.window || window;
        this.document = options.document || document;
        this.report = null;
        this.bound = false;
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        this.setDefaults("admin-operational");
        this.setDefaults("admin-distribution-report");
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelector?.('[data-admin-menu="operational-summary"]')
            ?.addEventListener("click", () => this.load("summary"));
        this.document.querySelector?.('[data-admin-menu="distribution-report"]')
            ?.addEventListener("click", () => this.load("distribution"));
        this.element("admin-operational-refresh")?.addEventListener("click", () => this.load("summary"));
        this.element("admin-distribution-report-refresh")?.addEventListener("click", () => this.load("distribution"));
        this.element("admin-operational-period")?.addEventListener("change", () => this.toggleSemester("admin-operational"));
        this.element("admin-distribution-report-period")?.addEventListener("change", () => this.toggleSemester("admin-distribution-report"));
        this.element("admin-operational-view")?.addEventListener("change", () => this.load("summary"));
        this.element("admin-operational-print")?.addEventListener("click", () => this.print("summary"));
        this.element("admin-operational-export")?.addEventListener("click", () => this.exportCsv("summary"));
        this.element("admin-distribution-report-print")?.addEventListener("click", () => this.print("distribution"));
        this.element("admin-distribution-report-export")?.addEventListener("click", () => this.exportCsv("distribution"));
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    localToday() {
        const now = new Date();
        return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
            .toISOString().slice(0, 10);
    }

    setDefaults(prefix) {
        const anchor = this.element(`${prefix}-anchor`);
        if (anchor && !anchor.value) anchor.value = this.localToday();
        this.toggleSemester(prefix);
    }

    toggleSemester(prefix) {
        const semester = this.element(`${prefix}-period`)?.value === "semester";
        this.document.querySelectorAll?.(`[data-period-range="${prefix}"]`)?.forEach(field => {
            field.hidden = !semester;
        });
    }

    periodInput(prefix) {
        return {
            type: this.element(`${prefix}-period`)?.value,
            anchorDate: this.element(`${prefix}-anchor`)?.value,
            startDate: this.element(`${prefix}-start`)?.value,
            endDate: this.element(`${prefix}-end`)?.value
        };
    }

    prefix(kind) {
        return kind === "distribution" ? "admin-distribution-report" : "admin-operational";
    }

    async load(kind = "summary") {
        const prefix = this.prefix(kind);
        this.setBusy(prefix, true);
        this.showError(prefix, "");
        this.setText(`${prefix}-status`, "กำลังโหลดข้อมูลสรุปแบบไม่ดึงรูปและลายเซ็น...");
        try {
            const view = kind === "summary"
                ? this.element("admin-operational-view")?.value || "room"
                : "room";
            this.report = await this.manager.refresh(this.periodInput(prefix), view);
            if (kind === "distribution") this.renderDistribution(this.report);
            else this.renderSummary(this.report);
            this.setText(`${prefix}-status`, `โหลดสำเร็จ · ${this.periodText(this.report.period)}`);
            return this.report;
        } catch (error) {
            this.showError(prefix, error?.message || "โหลดรายงานไม่สำเร็จ");
            this.setText(`${prefix}-status`, "");
            return null;
        } finally {
            this.setBusy(prefix, false);
        }
    }

    periodText(period = {}) {
        return `${period.label || "ช่วงที่เลือก"} ${period.startDate || "—"} ถึง ${period.endDate || "—"}`;
    }

    renderSummary(report) {
        const total = report.schoolTotal || {};
        this.setText("admin-operational-school", report.schoolName);
        this.setText("admin-operational-year", report.academicYear || "ไม่ระบุ");
        this.setText("admin-operational-semester", report.semester || "ไม่ระบุ");
        this.setText("admin-operational-period-label", this.periodText(report.period));
        this.setText("admin-operational-received", `${total.received || 0} กล่อง`);
        this.setText("admin-operational-distributed", `${total.distributed || 0} กล่อง`);
        this.setText("admin-operational-used", `${total.used || 0} กล่อง`);
        this.setText("admin-operational-net", `${this.signed(total.netMovement)} กล่อง`);
        this.setText("admin-operational-main-stock", `${report.currentStock?.main || 0} กล่อง`);
        this.setText("admin-operational-room-stock", `${report.currentStock?.rooms || 0} กล่อง`);
        const body = this.element("admin-operational-body");
        if (!body) return;
        body.replaceChildren(...(report.rows || []).map(row => {
            const label = report.view === "school"
                ? report.schoolName
                : report.view === "grade" ? row.grade : row.roomName;
            return this.row([
                label, row.students, row.distributed, row.attendance, row.pending,
                row.retro, row.vacation, row.used, this.signed(row.netMovement)
            ]);
        }));
        this.renderEmpty(body, report.rows, 9, "ไม่พบรายการเคลื่อนไหวในช่วงที่เลือก");
        this.renderDiagnostics("admin-operational-source", report.sourceDiagnostics);
    }

    renderDistribution(report) {
        const records = report.distributions || [];
        this.setText("admin-distribution-report-school", report.schoolName);
        this.setText("admin-distribution-report-year", report.academicYear || "ไม่ระบุ");
        const total = records.reduce((sum, record) => sum + Number(record.total || 0), 0);
        const rooms = new Set(records.map(record => record.roomId).filter(Boolean)).size;
        this.setText("admin-distribution-report-period-label", this.periodText(report.period));
        this.setText("admin-distribution-report-count", `${records.length} รายการ`);
        this.setText("admin-distribution-report-total", `${total} กล่อง`);
        this.setText("admin-distribution-report-rooms", `${rooms} ห้อง`);
        this.setText("admin-distribution-report-main-stock", `${report.currentStock?.main || 0} กล่อง`);
        const anomalies = records.filter(record => record.stockValid === false);
        const stockCheck = this.element("admin-distribution-report-stock-check");
        if (stockCheck) {
            stockCheck.textContent = anomalies.length
                ? `⚠️ พบ ${anomalies.length} รายการที่ยอดบันทึกเดิมผิดสูตร ตารางใช้ยอดคำนวณ “ก่อน − จ่าย” เป็นค่าตรวจสอบ และคงยอดเดิมไว้เป็นหลักฐาน โดย Main Stock ปัจจุบันอ่านจาก milkApp/stock เท่านั้น`
                : "ตรวจสูตร Main Stock ของทุกรายการแล้ว · Main Stock ปัจจุบันอ่านจาก milkApp/stock เท่านั้น";
            stockCheck.dataset.state = anomalies.length ? "error" : "ok";
        }
        const body = this.element("admin-distribution-report-body");
        if (!body) return;
        body.replaceChildren(...records.map((record, index) => this.row([
            index + 1,
            record.date || "—",
            record.roomName,
            record.students,
            `${record.days} วัน`,
            `${record.crates} ลัง + ${record.boxes} กล่อง`,
            record.total,
            record.stockValid === false
                ? `⚠ ${record.stockBefore} → ${record.effectiveStockAfter} (บันทึกเดิม ${record.stockAfter})`
                : `${record.stockBefore} → ${record.stockAfter}`,
            record.note || "—"
        ])));
        this.renderEmpty(body, records, 9, "ไม่พบรายการจ่ายนมในช่วงที่เลือก");
    }

    row(values) {
        const row = this.document.createElement("tr");
        values.forEach(value => {
            const cell = this.document.createElement("td");
            cell.textContent = String(value ?? "");
            row.appendChild(cell);
        });
        return row;
    }

    renderEmpty(body, rows, colSpan, text) {
        if (rows?.length) return;
        const row = this.document.createElement("tr");
        const cell = this.document.createElement("td");
        cell.colSpan = colSpan;
        cell.textContent = text;
        row.appendChild(cell);
        body.appendChild(row);
    }

    renderDiagnostics(id, diagnostics = {}) {
        const counts = diagnostics.counts || {};
        const invalid = diagnostics.invalid?.length || 0;
        this.setText(id, [
            `ข้อมูลในเครื่อง: นมค้าง ${counts.pending || 0}`,
            `ย้อนหลัง ${counts.retro || 0}`,
            `ปิดเทอม ${counts.vacation || 0}`,
            invalid ? `ข้ามข้อมูลเสีย ${invalid} แหล่ง` : "ข้อมูลอ่านได้ปกติ"
        ].join(" · "));
    }

    signed(value) {
        const number = Number(value) || 0;
        return number > 0 ? `+${number}` : String(number);
    }

    escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    print(kind) {
        if (!this.report) return;
        const model = this.manager.buildPrintModel(kind);
        const columns = Object.keys(model.rows[0] || {});
        const popup = this.window.open("", "_blank");
        if (!popup) {
            this.showError(this.prefix(kind), "เบราว์เซอร์บล็อกหน้าพิมพ์ กรุณาอนุญาต Pop-up");
            return;
        }
        popup.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${this.escape(model.title)}</title>
<style>@page{size:A4 landscape;margin:9mm}body{font-family:Sarabun,sans-serif;color:#111}h1,p{text-align:center;margin:4px}table{width:100%;border-collapse:collapse;margin-top:12px;font-size:8.5pt}th,td{border:1px solid #555;padding:4px;text-align:center}th{background:#e8f1f7}</style></head><body>
<h1>${this.escape(model.title)}</h1><p>${this.escape(model.schoolName)}</p><p>ปีการศึกษา ${this.escape(model.academicYear || "ไม่ระบุ")} · ${this.escape(model.periodLabel)}</p>
<table><thead><tr>${columns.map(column => `<th>${this.escape(column)}</th>`).join("")}</tr></thead>
<tbody>${model.rows.map(row => `<tr>${columns.map(column => `<td>${this.escape(row[column])}</td>`).join("")}</tr>`).join("")}</tbody></table>
<script>window.addEventListener("load",()=>window.print())<\/script></body></html>`);
        popup.document.close();
    }

    csvCell(value) {
        return `"${String(value ?? "").replaceAll('"', '""')}"`;
    }

    exportCsv(kind) {
        if (!this.report) return;
        const model = this.manager.buildExportModel(kind);
        const columns = Object.keys(model.rows[0] || {});
        const lines = [
            columns.map(column => this.csvCell(column)).join(","),
            ...model.rows.map(row => columns.map(column => this.csvCell(row[column])).join(","))
        ];
        const blob = new Blob([`\uFEFF${lines.join("\r\n")}`], { type: "text/csv;charset=utf-8" });
        const url = this.window.URL.createObjectURL(blob);
        const anchor = this.document.createElement("a");
        anchor.href = url;
        anchor.download = model.filename;
        anchor.click();
        this.window.URL.revokeObjectURL(url);
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    showError(prefix, message) {
        const element = this.element(`${prefix}-error`);
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(prefix, busy) {
        this.document.querySelectorAll?.(`[data-report-controls="${prefix}"] input, [data-report-controls="${prefix}"] select, [data-report-controls="${prefix}"] button`)
            ?.forEach(element => { element.disabled = Boolean(busy); });
    }

    reset() {
        this.manager?.clear?.();
        this.report = null;
        ["admin-operational", "admin-distribution-report"].forEach(prefix => {
            this.setText(`${prefix}-status`, "");
            this.showError(prefix, "");
            this.element(`${prefix}-body`)?.replaceChildren?.();
        });
    }
}

window.AdminOperationalReportView = new AdminOperationalReportView();
