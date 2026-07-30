class AttendancePrintView {
    constructor(
        historyManager = window.AttendanceHistoryManager,
        reportBuilder = window.AttendanceReportBuilder,
        printModel = window.AttendancePrintModel,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        options = {}
    ) {
        this.historyManager = historyManager;
        this.reportBuilder = reportBuilder;
        this.printModel = printModel;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.openWindow = options.openWindow || ((...args) => window.open(...args));
        this.schedule = options.schedule || (callback => window.setTimeout(callback, 250));
        this.now = options.now || (() => new Date().toISOString());
        this.confirm = options.confirm || (message => window.confirm(message));
        this.attendanceManager = options.attendanceManager || window.AttendanceManager;
        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.currentHistory = null;
        this.currentReport = null;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleLoad = this.handleLoad.bind(this);
        this.handlePrint = this.handlePrint.bind(this);
        this.handleDailyAction = this.handleDailyAction.bind(this);
        this.handleAttendanceDeleted = this.handleAttendanceDeleted.bind(this);
    }

    ensureDependencies() {
        this.historyManager ||= window.AttendanceHistoryManager;
        this.reportBuilder ||= window.AttendanceReportBuilder;
        this.printModel ||= window.AttendancePrintModel;
        this.authService ||= window.AuthService;
        this.teacherManager ||= window.TeacherManager;
        this.attendanceManager ||= window.AttendanceManager;

        if (
            !this.historyManager?.load ||
            !this.historyManager?.hydrateCurrentEvidence ||
            !this.historyManager?.clear
        ) {
            throw new Error("AttendanceHistoryManager is not available.");
        }
        if (!this.reportBuilder?.build) {
            throw new Error("AttendanceReportBuilder is not available.");
        }
        if (!this.printModel?.build) {
            throw new Error("AttendancePrintModel is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
        if (!this.teacherManager?.getSnapshot) {
            throw new Error("TeacherManager is not available.");
        }
        if (!this.attendanceManager?.remove) {
            throw new Error("AttendanceManager is not available.");
        }
    }

    async initialize() {
        if (this.initialized) {
            return this.getState();
        }

        this.ensureDependencies();
        this.ensureStyles();
        this.ensureStructure();
        this.bindEvents();
        this.initialized = true;

        const session = this.authService.getSession();
        if (session?.role === "teacher") {
            this.activate(session);
        } else {
            this.clear();
        }
        return this.getState();
    }

    ensureStyles() {
        if (this.document.getElementById("attendance-report-view-style")) {
            return;
        }

        const style = this.document.createElement("style");
        style.id = "attendance-report-view-style";
        style.textContent = `
            .attendance-report-panel{margin-top:28px;padding-top:26px;border-top:1px solid #dbe5ef}
            .attendance-report-intro{margin:6px 0 0;color:#64748b;font-size:.9rem}
            .attendance-report-toolbar{display:grid;grid-template-columns:repeat(2,minmax(160px,1fr)) auto;align-items:end;gap:12px;margin-top:18px}
            .attendance-report-toolbar label{margin:0 0 6px}
            .attendance-report-toolbar button{width:auto;min-width:150px;margin:0}
            .attendance-report-identity{margin-top:14px;padding:12px;border-radius:10px;background:#eff6ff;color:#1e3a5f;font-weight:700}
            .attendance-report-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin-top:18px}
            .attendance-report-summary-card{margin:0;border-radius:10px;padding:12px;text-align:center;background:#f1f5f9}
            .attendance-report-summary-card dt{color:#64748b;font-size:.78rem;font-weight:700}
            .attendance-report-summary-card dd{margin:5px 0 0;color:#1a5276;font-size:1.15rem;font-weight:800}
            .attendance-report-section{margin-top:22px}
            .attendance-report-table-wrap{margin-top:10px;overflow:auto;border:1px solid #dbe5ef;border-radius:12px}
            .attendance-report-table{width:100%;border-collapse:collapse;min-width:680px}
            .attendance-report-table th,.attendance-report-table td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:.86rem}
            .attendance-report-table th{position:sticky;top:0;background:#eaf2f8;color:#1e3a5f;font-weight:800}
            .attendance-report-table td.name{text-align:left;font-weight:700}
            .attendance-report-row-actions{display:flex;justify-content:center;gap:7px;white-space:nowrap}
            .attendance-report-row-actions button{width:auto;min-width:0;margin:0;padding:6px 10px;font-size:.78rem}
            .attendance-report-row-actions .delete{background:#dc4c45}
            .attendance-report-empty{margin:12px 0 0;border-radius:10px;padding:16px;color:#64748b;background:#f8fafc}
            .attendance-report-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}
            .attendance-report-actions button{width:min(240px,100%)}
            #attendance-report-status[data-state=success]{color:#166534}
            #attendance-report-status[data-state=error]{color:#991b1b}
            @media(max-width:820px){.attendance-report-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
            @media(max-width:600px){.attendance-report-toolbar,.attendance-report-summary{grid-template-columns:1fr}.attendance-report-toolbar button,.attendance-report-actions button{width:100%}.attendance-report-actions{flex-direction:column}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("attendance-report-panel")) {
            return;
        }

        const teacherShell = this.document.getElementById("teacher-shell");
        if (!teacherShell) {
            throw new Error("Teacher shell is not available for Attendance Report UI.");
        }

        const panel = this.document.createElement("section");
        panel.id = "attendance-report-panel";
        panel.className = "attendance-report-panel";
        panel.setAttribute("aria-labelledby", "attendance-report-title");
        panel.setAttribute("aria-busy", "false");
        panel.hidden = true;
        panel.innerHTML = `
            <h3 id="attendance-report-title">ประวัติการเช็กและสรุปรายงาน</h3>
            <p class="attendance-report-intro">โหลดเฉพาะห้องที่เข้าสู่ระบบและช่วงวันที่ที่เลือก โดยไม่ดาวน์โหลดรูปหรือข้อมูลลายเซ็นย้อนหลัง</p>
            <div class="attendance-report-toolbar">
                <div>
                    <label for="attendance-report-start-date">วันที่เริ่มต้น</label>
                    <input id="attendance-report-start-date" type="date" required>
                </div>
                <div>
                    <label for="attendance-report-end-date">วันที่สิ้นสุด</label>
                    <input id="attendance-report-end-date" type="date" required>
                </div>
                <button id="attendance-report-load-button" type="button">โหลดรายงาน</button>
            </div>
            <p id="attendance-report-identity" class="attendance-report-identity"></p>
            <dl class="attendance-report-summary" aria-label="สรุปรายงานการดื่มนม">
                <div class="attendance-report-summary-card"><dt>วันที่มีข้อมูล</dt><dd id="attendance-report-school-days">0</dd></div>
                <div class="attendance-report-summary-card"><dt>นักเรียน</dt><dd id="attendance-report-students">0</dd></div>
                <div class="attendance-report-summary-card"><dt>ดื่มนม</dt><dd id="attendance-report-present">0</dd></div>
                <div class="attendance-report-summary-card"><dt>ไม่ดื่มนม</dt><dd id="attendance-report-absent">0</dd></div>
                <div class="attendance-report-summary-card"><dt>ยังไม่ตรวจ</dt><dd id="attendance-report-unchecked">0</dd></div>
            </dl>
            <p id="attendance-report-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="attendance-report-error" class="error" role="alert" hidden></p>
            <section class="attendance-report-section" aria-labelledby="attendance-report-daily-title">
                <h4 id="attendance-report-daily-title">ประวัติรายวัน</h4>
                <div id="attendance-report-daily"></div>
            </section>
            <section class="attendance-report-section" aria-labelledby="attendance-report-student-title">
                <h4 id="attendance-report-student-title">สรุปรายบุคคล</h4>
                <div id="attendance-report-student-list"></div>
            </section>
            <div class="attendance-report-actions">
                <button id="attendance-report-print-button" type="button" disabled>พิมพ์รายงาน A4</button>
            </div>
        `;

        const actions = this.document.getElementById("teacher-logout-button")?.parentElement;
        if (actions && typeof teacherShell.insertBefore === "function") {
            teacherShell.insertBefore(panel, actions);
        } else {
            teacherShell.appendChild(panel);
        }
    }

    bindEvents() {
        if (this.bound) {
            return;
        }

        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:attendance-deleted", this.handleAttendanceDeleted);
        this.element("attendance-report-load-button")?.addEventListener?.("click", this.handleLoad);
        this.element("attendance-report-print-button")?.addEventListener?.("click", this.handlePrint);
        this.element("attendance-report-daily")?.addEventListener?.("click", this.handleDailyAction);
        this.bound = true;
    }

    handleLoginSuccess(event) {
        const session = event?.detail?.session;
        if (session?.role === "teacher") {
            this.activate(session);
        } else {
            this.clear();
        }
    }

    handleLogout() {
        this.clear();
    }

    handleAttendanceDeleted() {
        if (this.currentReport) {
            this.handleLoad();
        }
    }

    activate(session) {
        this.activeSession = { ...session };
        this.element("attendance-report-panel")?.removeAttribute?.("hidden");
        const endDate = this.today();
        this.setValue("attendance-report-start-date", `${endDate.slice(0, 8)}01`);
        this.setValue("attendance-report-end-date", endDate);
        this.renderIdentity(session);
        this.renderEmpty();
        this.setStatus("เลือกช่วงวันที่แล้วกด “โหลดรายงาน”", "idle");
    }

    async handleLoad() {
        const startDate = this.value("attendance-report-start-date");
        const endDate = this.value("attendance-report-end-date");
        this.setBusy(true, "กำลังโหลดประวัติการเช็ก...");
        this.clearError();

        try {
            const history = await this.historyManager.load({ startDate, endDate });
            const report = this.reportBuilder.build(history, this.reportContext());
            this.currentHistory = history;
            this.currentReport = report;
            this.renderReport(report);
            this.emit("milkapp:attendance-report-built", this.safeReportDetail(report));
        } catch (error) {
            this.currentHistory = null;
            this.currentReport = null;
            this.renderEmpty();
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    reportContext() {
        const snapshot = this.teacherManager.getSnapshot() || {};
        const session = snapshot.session || this.activeSession || {};
        const room = snapshot.room || session.roomSnapshot || {};
        const students = snapshot.students || room.students || session.roomSnapshot?.students || [];
        return {
            settings: snapshot.settings || {},
            schoolName: session.schoolName || this.activeSession?.schoolName,
            roomId: session.roomId || room.id,
            roomName: session.roomName || room.name,
            teacher: session.teacher || room.teacher,
            room,
            students
        };
    }

    safeReportDetail(report = {}) {
        return {
            roomId: String(report.metadata?.roomId || ""),
            startDate: String(report.metadata?.startDate || ""),
            endDate: String(report.metadata?.endDate || ""),
            recordCount: Number(report.source?.recordCount) || 0,
            studentCount: Number(report.totals?.students) || 0
        };
    }

    renderReport(report = {}) {
        const metadata = report.metadata || {};
        const totals = report.totals || {};
        this.renderIdentity(metadata);
        this.setText("attendance-report-school-days", totals.schoolDays || 0);
        this.setText("attendance-report-students", totals.students || 0);
        this.setText("attendance-report-present", totals.present || 0);
        this.setText("attendance-report-absent", totals.absent || 0);
        this.setText("attendance-report-unchecked", totals.unchecked || 0);
        this.renderDaily(report.daily || []);
        this.renderStudents(report.students || []);
        const printButton = this.element("attendance-report-print-button");
        if (printButton) {
            printButton.disabled = false;
        }
        this.setStatus(
            totals.schoolDays
                ? `โหลดรายงานสำเร็จ ${totals.schoolDays} วัน`
                : "ไม่พบประวัติการเช็กในช่วงวันที่ที่เลือก",
            "success"
        );
        this.clearError();
    }

    renderIdentity(source = {}) {
        const roomName = source.roomName || source.className || source.roomId || "—";
        const teacher = source.teacher || "ครูประจำชั้น";
        const school = source.schoolName || "โรงเรียน";
        this.setText("attendance-report-identity", `${school} · ห้อง ${roomName} · ${teacher}`);
    }

    renderDaily(rows = []) {
        const target = this.element("attendance-report-daily");
        if (!target) {
            return;
        }
        target.innerHTML = rows.length
            ? `<div class="attendance-report-table-wrap"><table class="attendance-report-table">
                <thead><tr><th>วันที่</th><th>ดื่มนม</th><th>ไม่ดื่มนม</th><th>ยังไม่ตรวจ</th><th>รวม</th><th>การจัดการ</th></tr></thead>
                <tbody>${rows.map(row => `<tr>
                    <td>${this.escape(this.formatDate(row.date))}</td>
                    <td>${this.number(row.present)}</td>
                    <td>${this.number(row.absent)}</td>
                    <td>${this.number(row.unchecked)}</td>
                    <td>${this.number(row.totalStudents)}</td>
                    <td><div class="attendance-report-row-actions">
                        <button type="button" data-attendance-history-action="edit" data-date="${this.escape(row.date)}">✏️ แก้ไข</button>
                        <button type="button" class="delete" data-attendance-history-action="delete" data-date="${this.escape(row.date)}">🗑️ ลบ</button>
                    </div></td>
                </tr>`).join("")}</tbody>
            </table></div>`
            : '<p class="attendance-report-empty">ไม่พบประวัติรายวันในช่วงที่เลือก</p>';
    }

    renderStudents(rows = []) {
        const target = this.element("attendance-report-student-list");
        if (!target) {
            return;
        }
        target.innerHTML = rows.length
            ? `<div class="attendance-report-table-wrap"><table class="attendance-report-table">
                <thead><tr><th>เลขที่</th><th>ชื่อ-นามสกุล</th><th>ดื่มนม</th><th>ไม่ดื่มนม</th><th>ยังไม่ตรวจ</th><th>อัตราดื่มนม</th></tr></thead>
                <tbody>${rows.map(row => `<tr>
                    <td>${this.escape(row.num || "—")}</td>
                    <td class="name">${this.escape(row.name)}</td>
                    <td>${this.number(row.present)}</td>
                    <td>${this.number(row.absent)}</td>
                    <td>${this.number(row.unchecked)}</td>
                    <td>${row.attendanceRate === null ? "—" : `${this.number(row.attendanceRate)}%`}</td>
                </tr>`).join("")}</tbody>
            </table></div>`
            : '<p class="attendance-report-empty">ไม่พบรายชื่อนักเรียนสำหรับสรุป</p>';
    }

    async handleDailyAction(event) {
        const button = event?.target?.closest?.("[data-attendance-history-action]");
        if (!button) {
            return;
        }
        const action = String(button.dataset.attendanceHistoryAction || "");
        const date = String(button.dataset.date || "");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            this.renderError(new Error("วันที่ของรายการประวัติไม่ถูกต้อง"));
            return;
        }

        if (action === "edit") {
            this.emit("milkapp:attendance-history-edit-requested", {
                roomId: String(this.currentHistory?.roomId || ""),
                date
            });
            return;
        }
        if (action !== "delete" || !this.confirm(
            `ยืนยันการลบข้อมูลเช็กดื่มนมวันที่ ${this.formatDate(date)} และคืนสต็อกตามข้อมูลเดิมหรือไม่`
        )) {
            return;
        }

        this.setBusy(true, "กำลังลบข้อมูลวันที่เลือกและคืนสต็อก...");
        this.clearError();
        try {
            await this.attendanceManager.remove({
                roomId: this.currentHistory?.roomId,
                date
            });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handlePrint() {
        if (!this.currentReport) {
            this.renderError(new Error("กรุณาโหลดรายงานก่อนพิมพ์"));
            return;
        }

        this.setBusy(true, "กำลังโหลดรูปและลายเซ็นเฉพาะวันที่ในรายงาน...");
        this.clearError();
        try {
            const hydratedHistory = await this.historyManager.hydrateCurrentEvidence();
            const hydratedReport = this.reportBuilder.build(hydratedHistory, this.reportContext());
            this.currentHistory = hydratedHistory;
            this.currentReport = hydratedReport;
            const printData = this.printModel.build(hydratedReport, { printedAt: this.now() });
            const printWindow = this.openWindow("", "_blank");
            if (!printWindow?.document) {
                throw new Error("เบราว์เซอร์ปิดกั้นหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up");
            }

            printWindow.document.write(this.printDocument(printData, hydratedHistory.records));
            printWindow.document.close();
            this.emit("milkapp:attendance-print-opened", {
                ...this.safeReportDetail(hydratedReport),
                pageCount: this.printPageCount(printData, hydratedHistory.records),
                evidenceRecordCount: hydratedHistory.records.filter(record => record.evidence?.loaded).length
            });
            this.schedule(() => {
                printWindow.focus?.();
                printWindow.print?.();
            });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    printDocument(printData = {}, evidenceRecords = []) {
        const evidence = this.normalizePrintEvidence(evidenceRecords);
        const matrixPages = this.buildMatrixPages(printData, evidenceRecords);
        const tablePages = matrixPages.length ? matrixPages : (printData.pages || []);
        const pages = tablePages.map((page, index) => `
            <section class="print-page${page.pageBreakAfter ? " page-break" : ""}">
                <header>
                    <h1>${this.escape(page.title)}</h1>
                    <h2>${this.escape(page.header.schoolName)}</h2>
                    <p>ห้อง ${this.escape(page.header.roomName)} · ${this.escape(page.header.teacher)}</p>
                    <p>${this.escape(page.header.academicLabel)} · ${this.escape(page.header.rangeLabel)}</p>
                </header>
                <div class="totals">
                    ดื่มนม ${this.number(printData.totals.present)} ·
                    ไม่ดื่มนม ${this.number(printData.totals.absent)} ·
                    ยังไม่ตรวจ ${this.number(printData.totals.unchecked)}
                </div>
                ${page.matrix
                    ? this.matrixTable(page)
                    : `<table>
                        <thead><tr>${page.columns.map(column => `<th>${this.escape(column.label)}</th>`).join("")}</tr></thead>
                        <tbody>${page.rows.map(row => `<tr>${page.columns.map(column => (
                            `<td class="${column.key === "name" ? "name" : ""}">${this.escape(this.printCell(row[column.key], column.key))}</td>`
                        )).join("")}</tr>`).join("")}</tbody>
                    </table>`}
                ${evidence.length && index === tablePages.length - 1
                    ? evidence.map(record => this.evidenceDocumentSection(record)).join("")
                    : ""}
                <footer><span>พิมพ์เมื่อ ${this.escape(page.footer.printedAtLabel)}</span><span>${this.escape(page.footer.pageLabel)}</span></footer>
            </section>
        `).join("");

        return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>${this.escape(printData.title)}</title>
            <style>
                @page{size:A4 portrait;margin:10mm}
                *{box-sizing:border-box}
                body{margin:0;color:#111;font-family:"Sarabun","Noto Sans Thai",sans-serif;font-size:9pt}
                .print-page{min-height:277mm;display:flex;flex-direction:column}
                .page-break{break-after:page;page-break-after:always}
                header{text-align:center;margin-bottom:4mm}
                h1{margin:0;font-size:16pt}h2{margin:2mm 0 0;font-size:12pt}p{margin:1mm 0}
                .totals{margin:0 0 3mm;padding:2mm;border:1px solid #999;text-align:center;font-weight:700}
                table{width:100%;border-collapse:collapse}
                thead{display:table-header-group}
                th,td{border:.5pt solid #777;padding:1.6mm 1mm;text-align:center;vertical-align:middle}
                th{background:#174b68;color:#fff;font-weight:700}
                td.name{text-align:left}
                .matrix-table th.name,.matrix-table td.name{text-align:left}
                .matrix-table th.name{width:auto}
                .matrix-table th.day{width:8mm}
                .matrix-table th.summary{width:11mm}
                .matrix-table td.present{color:#16a34a;font-size:12pt;font-weight:800}
                .matrix-table td.absent{color:#dc2626;font-size:11pt;font-weight:800}
                .matrix-table tfoot td{background:#eaf2f8;font-weight:800}
                tr{break-inside:avoid;page-break-inside:avoid}
                .evidence{margin-top:4mm;break-inside:avoid}.evidence h3{margin:0 0 2mm;font-size:10pt}
                .evidence-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1.5mm}
                .evidence-gallery img{display:block;width:100%;height:25mm;border:1px solid #aaa;object-fit:cover}
                .evidence-empty{padding:4mm;border:1px dashed #aaa;text-align:center;color:#666}
                .signature{width:58mm;margin:4mm 8mm 0 auto;text-align:center}
                .signature img{display:block;width:100%;height:20mm;object-fit:contain}
                .signature-line{margin-top:1mm;border-top:1px solid #333;padding-top:1mm}
                footer{display:flex;justify-content:space-between;margin-top:auto;padding-top:3mm;font-size:8pt}
                @media screen{body{background:#eef2f7;padding:12px}.print-page{max-width:210mm;margin:0 auto 12px;padding:10mm;background:#fff;box-shadow:0 2px 12px #999}}
            </style></head><body>${pages}</body></html>`;
    }

    buildMatrixPages(printData = {}, records = []) {
        const sourcePages = Array.isArray(printData.pages) ? printData.pages : [];
        const students = [];
        const seenStudents = new Set();
        sourcePages.flatMap(page => Array.isArray(page.rows) ? page.rows : []).forEach(row => {
            const id = String(row?.id || "").trim();
            if (!id || seenStudents.has(id)) {
                return;
            }
            seenStudents.add(id);
            students.push({ ...row, id });
        });

        const normalizedRecords = (Array.isArray(records) ? records : [])
            .filter(record => /^\d{4}-\d{2}-\d{2}$/.test(String(record?.date || "")))
            .map(record => ({
                date: String(record.date),
                data: record.data && typeof record.data === "object" && !Array.isArray(record.data)
                    ? record.data
                    : {}
            }))
            .sort((left, right) => left.date.localeCompare(right.date));

        if (!students.length || !normalizedRecords.length || !sourcePages.length) {
            return [];
        }

        const uniqueRecords = [];
        const seenDates = new Set();
        normalizedRecords.forEach(record => {
            if (!seenDates.has(record.date)) {
                seenDates.add(record.date);
                uniqueRecords.push(record);
            }
        });

        const recordGroups = [];
        for (let index = 0; index < uniqueRecords.length; index += 5) {
            recordGroups.push(uniqueRecords.slice(index, index + 5));
        }

        const firstPage = sourcePages[0];
        return recordGroups.map((currentRecords, pageIndex) => {
            const rows = students.map(student => {
                const statuses = currentRecords.map(record => {
                    const status = String(record.data[student.id] || "");
                    return status === "present" || status === "absent" ? status : "unchecked";
                });
                const present = statuses.filter(status => status === "present").length;
                const checked = statuses.filter(status => status !== "unchecked").length;
                return {
                    ...student,
                    statuses,
                    present,
                    attendanceRate: checked ? Math.round((present / checked) * 10000) / 100 : null
                };
            });
            const dailyTotals = currentRecords.map((record, recordIndex) => (
                rows.filter(row => row.statuses[recordIndex] === "present").length
            ));
            const presentTotal = rows.reduce((total, row) => total + row.present, 0);
            const checkedTotal = rows.reduce(
                (total, row) => total + row.statuses.filter(status => status !== "unchecked").length,
                0
            );
            return {
                matrix: true,
                title: firstPage.title,
                header: {
                    ...firstPage.header,
                    rangeLabel: this.formatMatrixRange(currentRecords)
                },
                records: currentRecords,
                rows,
                dailyTotals,
                presentTotal,
                attendanceRate: checkedTotal
                    ? Math.round((presentTotal / checkedTotal) * 10000) / 100
                    : null,
                pageBreakAfter: pageIndex + 1 < recordGroups.length,
                footer: {
                    printedAtLabel: printData.printedAtLabel || firstPage.footer?.printedAtLabel || "",
                    pageLabel: `หน้า ${pageIndex + 1} / ${recordGroups.length}`
                }
            };
        });
    }

    matrixTable(page = {}) {
        return `<table class="matrix-table">
            <thead><tr>
                <th class="summary">ที่</th>
                <th class="name">ชื่อ-นามสกุล</th>
                ${(page.records || []).map(record => (
                    `<th class="day">${this.escape(this.dayLabel(record.date))}</th>`
                )).join("")}
                <th class="summary">รวม</th>
                <th class="summary">%</th>
            </tr></thead>
            <tbody>${(page.rows || []).map(row => `<tr>
                <td>${this.escape(row.num || row.rowNumber || "—")}</td>
                <td class="name">${this.escape(row.name || row.id)}</td>
                ${(row.statuses || []).map(status => (
                    `<td class="${status}">${this.escape(this.statusMark(status))}</td>`
                )).join("")}
                <td>${this.number(row.present)}</td>
                <td>${row.attendanceRate === null ? "—" : `${this.number(row.attendanceRate)}%`}</td>
            </tr>`).join("")}</tbody>
            <tfoot><tr>
                <td colspan="2" class="name">รวม</td>
                ${(page.dailyTotals || []).map(total => `<td>${this.number(total)}</td>`).join("")}
                <td>${this.number(page.presentTotal)}</td>
                <td>${page.attendanceRate === null ? "—" : `${this.number(page.attendanceRate)}%`}</td>
            </tr></tfoot>
        </table>`;
    }

    printPageCount(printData = {}, evidenceRecords = []) {
        const matrixPages = this.buildMatrixPages(printData, evidenceRecords);
        return matrixPages.length || (Array.isArray(printData.pages) ? printData.pages.length : 0);
    }

    statusMark(status) {
        if (status === "present") {
            return "✓";
        }
        if (status === "absent") {
            return "✕";
        }
        return "—";
    }

    dayLabel(value) {
        const match = String(value || "").match(/^\d{4}-\d{2}-(\d{2})$/);
        return match ? String(Number(match[1])) : String(value || "");
    }

    formatMatrixRange(records = []) {
        const dates = records.map(record => String(record?.date || "")).filter(Boolean);
        if (!dates.length) {
            return "ไม่ระบุช่วงวันที่";
        }
        if (dates.length === 1) {
            return this.formatDate(dates[0]);
        }
        return `${this.formatDate(dates[0])} ถึง ${this.formatDate(dates[dates.length - 1])}`;
    }

    normalizePrintEvidence(records = []) {
        return (Array.isArray(records) ? records : [])
            .filter(record => record?.evidence?.loaded)
            .map(record => ({
                date: String(record.date || ""),
                teacher: String(record.teacher || this.currentReport?.metadata?.teacher || "ครูประจำชั้น"),
                photos: (Array.isArray(record.photos) ? record.photos : [])
                    .filter(value => typeof value === "string" && value.startsWith("data:image/"))
                    .slice(0, 5),
                signature: typeof record.signature === "string" &&
                    record.signature.startsWith("data:image/")
                    ? record.signature
                    : ""
            }));
    }

    evidenceDocumentSection(record = {}) {
        const photos = record.photos || [];
        return `<section class="evidence">
            <h3>📷 รูปถ่ายวันที่ ${this.escape(this.formatDate(record.date))} (${photos.length} รูป)</h3>
            ${photos.length
                ? `<div class="evidence-gallery">${photos.map((photo, index) => (
                    `<img src="${this.escape(photo)}" alt="รูปหลักฐาน ${index + 1}">`
                )).join("")}</div>`
                : '<div class="evidence-empty">ไม่มีรูปถ่ายในรายการนี้</div>'}
            <div class="signature">
                ${record.signature
                    ? `<img src="${this.escape(record.signature)}" alt="ลายเซ็นครูประจำชั้น">`
                    : '<div class="evidence-empty">ไม่มีภาพลายเซ็น</div>'}
                <div class="signature-line">ลงชื่อ ${this.escape(record.teacher || "ครูประจำชั้น")}<br>ครูประจำชั้น</div>
            </div>
        </section>`;
    }

    printCell(value, key) {
        if (key === "attendanceRate") {
            return value === null || value === undefined ? "—" : `${this.number(value)}%`;
        }
        return value === null || value === undefined || value === "" ? "—" : String(value);
    }

    renderEmpty() {
        this.currentHistory = null;
        this.currentReport = null;
        for (const id of [
            "attendance-report-school-days",
            "attendance-report-students",
            "attendance-report-present",
            "attendance-report-absent",
            "attendance-report-unchecked"
        ]) {
            this.setText(id, 0);
        }
        const daily = this.element("attendance-report-daily");
        if (daily) {
            daily.innerHTML = '<p class="attendance-report-empty">เลือกช่วงวันที่เพื่อโหลดประวัติ</p>';
        }
        const students = this.element("attendance-report-student-list");
        if (students) {
            students.innerHTML = '<p class="attendance-report-empty">สรุปรายบุคคลจะแสดงหลังโหลดรายงาน</p>';
        }
        const printButton = this.element("attendance-report-print-button");
        if (printButton) {
            printButton.disabled = true;
        }
    }

    setBusy(isBusy, message = "") {
        this.element("attendance-report-panel")?.setAttribute?.("aria-busy", String(Boolean(isBusy)));
        const loadButton = this.element("attendance-report-load-button");
        const printButton = this.element("attendance-report-print-button");
        if (loadButton) {
            loadButton.disabled = Boolean(isBusy);
        }
        if (printButton) {
            printButton.disabled = Boolean(isBusy) || !this.currentReport;
        }
        if (isBusy && message) {
            this.setStatus(message, "idle");
        }
    }

    setStatus(message, state = "idle") {
        const status = this.element("attendance-report-status");
        if (status) {
            status.textContent = String(message || "");
            status.dataset.state = state;
        }
    }

    renderError(error) {
        const target = this.element("attendance-report-error");
        if (target) {
            target.textContent = `โหลดหรือพิมพ์รายงานไม่สำเร็จ: ${error?.message || "ไม่ทราบสาเหตุ"}`;
            target.hidden = false;
        }
        this.setStatus("ไม่สามารถดำเนินการรายงานได้", "error");
    }

    clearError() {
        const target = this.element("attendance-report-error");
        if (target) {
            target.textContent = "";
            target.hidden = true;
        }
    }

    clear() {
        this.activeSession = null;
        this.historyManager?.clear?.();
        this.element("attendance-report-panel")?.setAttribute?.("hidden", "");
        this.renderEmpty();
        this.setStatus("", "idle");
        this.clearError();
    }

    getState() {
        return {
            initialized: this.initialized,
            active: this.activeSession?.role === "teacher",
            loaded: Boolean(this.currentReport),
            roomId: this.currentReport?.metadata?.roomId || null,
            startDate: this.currentReport?.metadata?.startDate || null,
            endDate: this.currentReport?.metadata?.endDate || null
        };
    }

    emit(name, detail) {
        if (typeof this.eventTarget.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }
        this.eventTarget.dispatchEvent(new CustomEvent(name, { detail }));
    }

    today() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }

    formatDate(value) {
        const text = String(value || "");
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : text;
    }

    number(value) {
        const normalized = Number(value);
        return Number.isFinite(normalized) ? normalized : 0;
    }

    escape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    element(id) {
        return this.document.getElementById(id);
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    setValue(id, value) {
        const element = this.element(id);
        if (element) {
            element.value = String(value ?? "");
        }
    }

    value(id) {
        return String(this.element(id)?.value || "").trim();
    }
}

window.AttendancePrintViewClass = AttendancePrintView;
window.AttendancePrintView = new AttendancePrintView();
