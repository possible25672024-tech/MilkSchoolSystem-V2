class VacationMilkView {
    constructor(
        vacationMilkManager = window.VacationMilkManager,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        options = {}
    ) {
        this.vacationMilkManager = vacationMilkManager;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.operationPrintView = options.operationPrintView || window.MilkOperationPrintView;
        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.currentPreview = null;
        this.currentHistory = null;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handlePreviewChange = this.handlePreviewChange.bind(this);
        this.handleLoadHistory = this.handleLoadHistory.bind(this);
        this.handleIssue = this.handleIssue.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
    }

    ensureDependencies() {
        if (!this.vacationMilkManager) this.vacationMilkManager = window.VacationMilkManager;
        if (!this.authService) this.authService = window.AuthService;
        if (!this.teacherManager) this.teacherManager = window.TeacherManager;
        const required = ["preview", "loadHistory", "issue", "remove"];
        const missing = required.find(method => !this.vacationMilkManager?.[method]);
        if (missing) throw new Error(`VacationMilkManager method ${missing} is not available.`);
        if (!this.authService?.getSession) throw new Error("AuthService is not available.");
        if (!this.teacherManager?.refresh || !this.teacherManager?.getSnapshot) {
            throw new Error("TeacherManager is not available.");
        }
    }

    async initialize() {
        if (this.initialized) return this.getState();
        this.ensureDependencies();
        this.ensureStyles();
        this.ensureStructure();
        this.bindEvents();
        this.initialized = true;
        const session = this.authService.getSession();
        if (session?.role === "teacher") this.activate(session);
        else this.clear();
        return this.getState();
    }

    ensureStyles() {
        if (this.document.getElementById("vacation-milk-view-style")) return;
        const style = this.document.createElement("style");
        style.id = "vacation-milk-view-style";
        style.textContent = `
            .vacation-milk-panel{margin-top:28px;padding-top:26px;border-top:1px solid #dbe5ef}
            .vacation-milk-intro{margin:6px 0 0;color:#64748b;font-size:.9rem}
            .vacation-milk-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
            .vacation-milk-field label{display:block;margin:0 0 6px}
            .vacation-milk-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
            .vacation-milk-summary-card{margin:0;border-radius:10px;padding:12px;text-align:center;background:#f1f5f9}
            .vacation-milk-summary-card dt{color:#64748b;font-size:.78rem;font-weight:700}
            .vacation-milk-summary-card dd{margin:5px 0 0;color:#1a5276;font-size:1.15rem;font-weight:800}
            .vacation-milk-summary-card.stock-warning{background:#fff7ed}.vacation-milk-summary-card.stock-warning dd{color:#b91c1c}
            .vacation-milk-students{margin-top:16px;border:1px solid #dbe5ef;border-radius:12px;overflow:hidden}
            .vacation-milk-student-row{display:grid;grid-template-columns:48px minmax(140px,1fr) 90px minmax(140px,auto);gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid #edf2f7}
            .vacation-milk-student-row:last-child{border-bottom:0}.vacation-milk-student-row.head{font-weight:800;background:#f8fafc}
            .vacation-milk-media-pending{font-size:.75rem;color:#7c3aed;font-weight:700}
            .vacation-milk-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}
            .vacation-milk-actions button{width:min(260px,100%)}
            .vacation-milk-history{display:grid;gap:10px;margin-top:16px}
            .vacation-milk-history-row{display:grid;grid-template-columns:minmax(190px,1fr) auto;align-items:center;gap:12px;border:1px solid #dbe5ef;border-radius:12px;padding:13px;background:#fff}
            .vacation-milk-history-actions{display:flex;justify-content:flex-end;gap:7px;flex-wrap:wrap}
            .vacation-milk-history-actions button{width:auto;margin:0}
            .vacation-milk-history-title{font-weight:800;color:#1a5276}.vacation-milk-history-meta{margin-top:3px;color:#64748b;font-size:.82rem;overflow-wrap:anywhere}
            .vacation-milk-history-badge{display:inline-block;margin-top:6px;padding:3px 8px;border-radius:999px;background:#dcfce7;color:#166534;font-size:.76rem;font-weight:800}
            .vacation-milk-empty{margin:0;border-radius:10px;padding:16px;color:#64748b;background:#f8fafc}
            #vacation-milk-status[data-state=success]{color:#166534}#vacation-milk-status[data-state=warning]{color:#9a3412}#vacation-milk-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.vacation-milk-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.vacation-milk-student-row{grid-template-columns:42px minmax(120px,1fr) 70px}.vacation-milk-student-row>:last-child{grid-column:2/-1}}
            @media(max-width:600px){.vacation-milk-form,.vacation-milk-summary,.vacation-milk-history-row{grid-template-columns:1fr}.vacation-milk-actions{flex-direction:column}.vacation-milk-actions button,.vacation-milk-history-row button{width:100%}.vacation-milk-student-row{grid-template-columns:36px 1fr}.vacation-milk-student-row>:nth-child(3),.vacation-milk-student-row>:nth-child(4){grid-column:2}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("vacation-milk-panel")) return;
        const teacherShell = this.document.getElementById("teacher-shell");
        if (!teacherShell) throw new Error("Teacher shell is not available for Vacation Milk UI.");
        const panel = this.document.createElement("section");
        panel.id = "vacation-milk-panel";
        panel.className = "vacation-milk-panel";
        panel.setAttribute("aria-labelledby", "vacation-milk-title");
        panel.setAttribute("aria-busy", "false");
        panel.hidden = true;
        panel.innerHTML = `
            <h3 id="vacation-milk-title">จ่ายนมช่วงปิดเทอม</h3>
            <p class="vacation-milk-intro">จ่ายนมตามจำนวนวันปิดเทอมให้ผู้ปกครองรับ โดยหักเฉพาะสต็อกห้อง</p>
            <div class="vacation-milk-form">
                <div class="vacation-milk-field"><label for="vacation-milk-academic-year">ปีการศึกษา</label><input id="vacation-milk-academic-year" type="number" min="2500" max="3000" required></div>
                <div class="vacation-milk-field"><label for="vacation-milk-semester">ภาคเรียน</label><select id="vacation-milk-semester"><option value="1">ปิดเทอมหลัง ภาค 1</option><option value="2">ปิดเทอมหลัง ภาค 2</option></select></div>
                <div class="vacation-milk-field"><label for="vacation-milk-issue-date">วันที่จ่าย</label><input id="vacation-milk-issue-date" type="date" required></div>
                <div class="vacation-milk-field"><label for="vacation-milk-room">ห้องเรียน</label><input id="vacation-milk-room" type="text" readonly></div>
                <div class="vacation-milk-field"><label for="vacation-milk-days">จำนวนวันปิดเทอม</label><input id="vacation-milk-days" type="number" min="1" max="365" value="30" required></div>
            </div>
            <dl class="vacation-milk-summary" aria-label="สรุปนมช่วงปิดเทอม">
                <div class="vacation-milk-summary-card"><dt>นักเรียน</dt><dd id="vacation-milk-student-count">0</dd></div>
                <div class="vacation-milk-summary-card"><dt>จำนวนวัน</dt><dd id="vacation-milk-day-count">30</dd></div>
                <div class="vacation-milk-summary-card"><dt>กล่องทั้งหมด</dt><dd id="vacation-milk-box-count">0</dd></div>
                <div class="vacation-milk-summary-card" id="vacation-milk-stock-card"><dt>สต็อกห้อง</dt><dd id="vacation-milk-room-stock">—</dd></div>
            </dl>
            <h4 style="margin-top:20px">รายชื่อนักเรียนและจำนวนกล่อง</h4>
            <div id="vacation-milk-students" class="vacation-milk-students"></div>
            <p class="vacation-milk-media-pending">รูปถ่ายและลายเซ็นผู้ปกครองจะเชื่อมผ่าน Shared Media & Signature Workflow ตาม Legacy Parity Contract</p>
            <div class="vacation-milk-field" style="margin-top:16px"><label for="vacation-milk-note">หมายเหตุ</label><input id="vacation-milk-note" type="text" maxlength="300" placeholder="หมายเหตุ (ไม่บังคับ)"></div>
            <p id="vacation-milk-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="vacation-milk-error" class="error" role="alert" hidden></p>
            <div class="vacation-milk-actions"><button id="vacation-milk-history-button" type="button">โหลดประวัติ</button><button id="vacation-milk-issue-button" type="button" disabled>บันทึกนมช่วงปิดเทอม</button></div>
            <h3 style="margin-top:24px">รายการปิดเทอมของห้อง</h3>
            <div id="vacation-milk-history" class="vacation-milk-history"></div>
        `;
        const retroPanel = this.document.getElementById("retroactive-milk-panel");
        const actions = this.document.getElementById("teacher-logout-button")?.parentElement;
        if (retroPanel?.parentElement === teacherShell && retroPanel.nextSibling) teacherShell.insertBefore(panel, retroPanel.nextSibling);
        else if (actions && typeof teacherShell.insertBefore === "function") teacherShell.insertBefore(panel, actions);
        else teacherShell.appendChild(panel);
    }

    bindEvents() {
        if (this.bound) return;
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        ["vacation-milk-academic-year", "vacation-milk-semester", "vacation-milk-issue-date", "vacation-milk-days"]
            .forEach(id => this.element(id)?.addEventListener?.("change", this.handlePreviewChange));
        this.element("vacation-milk-days")?.addEventListener?.("input", this.handlePreviewChange);
        this.element("vacation-milk-history-button")?.addEventListener?.("click", this.handleLoadHistory);
        this.element("vacation-milk-issue-button")?.addEventListener?.("click", this.handleIssue);
        this.element("vacation-milk-history")?.addEventListener?.("click", this.handleDeleteClick);
        this.bound = true;
    }

    handleLoginSuccess(event) {
        const session = event?.detail?.session;
        if (session?.role === "teacher") this.activate(session);
        else this.clear();
    }

    handleLogout() {
        this.clear();
    }

    activate(session) {
        this.activeSession = { ...session };
        this.element("vacation-milk-panel")?.removeAttribute?.("hidden");
        this.setValue("vacation-milk-academic-year", String(new Date().getFullYear() + 543));
        this.setValue("vacation-milk-semester", "1");
        this.setValue("vacation-milk-issue-date", this.today());
        this.setValue("vacation-milk-room", String(session.roomName || session.roomId || ""));
        this.setValue("vacation-milk-days", "30");
        this.renderHistory(null);
        this.handlePreviewChange();
    }

    handlePreviewChange() {
        this.clearError();
        try {
            this.currentPreview = this.vacationMilkManager.preview(this.formInput());
            this.renderPreview(this.currentPreview);
            this.setStatus(
                `${this.currentPreview.studentCount} คน × ${this.currentPreview.days} วัน = ${this.currentPreview.totalBoxes} กล่อง`,
                "idle"
            );
        } catch (error) {
            this.currentPreview = null;
            this.renderPreview(null);
            this.renderError(error);
        }
    }

    async handleLoadHistory(options = {}) {
        const preserveStatus = Boolean(options.preserveStatus);
        const statusSnapshot = preserveStatus
            ? {
                message: this.element("vacation-milk-status")?.textContent || "",
                state: this.element("vacation-milk-status")?.dataset?.state || "idle"
            }
            : null;
        this.setBusy(true, "กำลังโหลดประวัตินมช่วงปิดเทอม...");
        try {
            this.currentHistory = await this.vacationMilkManager.loadHistory();
            this.renderHistory(this.currentHistory);
            if (statusSnapshot) {
                this.setStatus(statusSnapshot.message, statusSnapshot.state);
            } else {
                this.setStatus(`โหลดประวัติแล้ว ${this.currentHistory.records.length} รายการ`, "success");
            }
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handleIssue() {
        if (!this.currentPreview) return;
        const message = `ยืนยันจ่ายนมช่วงปิดเทอม ${this.currentPreview.totalBoxes} กล่องให้ห้อง ${this.currentPreview.roomName}?`;
        if (!this.confirm(message)) return;
        this.setBusy(true, "กำลังบันทึกนมช่วงปิดเทอม...");
        try {
            const result = await this.vacationMilkManager.issue(this.formInput());
            if (result.stockQueued) {
                this.setStatus("บันทึกรายการแล้ว และนำการหักสต็อกเข้าคิวซิงก์", "warning");
            } else {
                this.setStatus(`บันทึกสำเร็จ · สต็อกห้อง ${result.roomStockBefore} → ${result.roomStockAfter}`, "success");
            }
            await this.teacherManager.refresh?.();
            await this.handleLoadHistory({ preserveStatus: true });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handleDeleteClick(event) {
        const printButton = event?.target?.closest?.("[data-vacation-print]");
        if (printButton) {
            this.printHistoryRecord(String(printButton.dataset.vacationPrint || ""));
            return;
        }
        const button = event?.target?.closest?.("[data-vacation-delete]");
        if (!button) return;
        const recordId = String(button.dataset.vacationDelete || "");
        if (!recordId) return;
        const quantity = Number(button.dataset.quantity || 0);
        if (!this.confirm(`ยืนยันลบรายการและคืนสต็อก ${quantity} กล่อง?`)) return;
        this.setBusy(true, "กำลังลบและคืนสต็อก...");
        try {
            const result = await this.vacationMilkManager.remove({ recordId });
            if (result.stockQueued) {
                this.setStatus("ลบรายการแล้ว และนำการคืนสต็อกเข้าคิวซิงก์", "warning");
            } else {
                this.setStatus(`ลบสำเร็จ · สต็อกห้อง ${result.roomStockBefore} → ${result.roomStockAfter}`, "success");
            }
            await this.teacherManager.refresh?.();
            await this.handleLoadHistory({ preserveStatus: true });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    formInput() {
        return {
            roomId: this.activeSession?.roomId,
            roomName: this.activeSession?.roomName,
            teacher: this.activeSession?.teacher,
            academicYear: this.value("vacation-milk-academic-year"),
            semester: this.value("vacation-milk-semester"),
            issueDate: this.value("vacation-milk-issue-date"),
            days: this.value("vacation-milk-days"),
            note: this.value("vacation-milk-note"),
            signatures: {},
            photos: []
        };
    }

    currentRoomStock() {
        const snapshot = this.teacherManager.getSnapshot?.() || {};
        const candidates = [snapshot.roomStock, snapshot.stock, snapshot.room?.stock, snapshot.room?.roomStock];
        const value = candidates.find(item => Number.isFinite(Number(item)));
        return value === undefined ? null : Number(value);
    }

    renderPreview(preview) {
        this.setText("vacation-milk-student-count", preview?.studentCount || 0);
        this.setText("vacation-milk-day-count", preview?.days || Number(this.value("vacation-milk-days")) || 30);
        this.setText("vacation-milk-box-count", preview?.totalBoxes || 0);
        const stock = this.currentRoomStock();
        this.setText("vacation-milk-room-stock", stock === null ? "—" : stock);
        const card = this.element("vacation-milk-stock-card");
        card?.classList?.toggle?.("stock-warning", stock !== null && preview && preview.totalBoxes > stock);
        const issueButton = this.element("vacation-milk-issue-button");
        if (issueButton) issueButton.disabled = !preview;
        this.renderStudents(preview?.students || [], preview?.days || 0);
    }

    renderStudents(students, days) {
        const container = this.element("vacation-milk-students");
        if (!container) return;
        if (!students.length) {
            container.innerHTML = '<p class="vacation-milk-empty">ยังไม่มีรายชื่อนักเรียนในห้อง</p>';
            return;
        }
        container.innerHTML = `
            <div class="vacation-milk-student-row head"><span>ที่</span><span>ชื่อ – สกุล</span><span>กล่อง</span><span>หลักฐานรับนม</span></div>
            ${students.map((student, index) => `
                <div class="vacation-milk-student-row">
                    <span>${this.escape(student.num || index + 1)}</span>
                    <span>${this.escape(student.name || student.id)}</span>
                    <strong>${this.escape(days)} กล่อง</strong>
                    <span class="vacation-milk-media-pending">รอ Media & Signature Sprint</span>
                </div>
            `).join("")}
        `;
    }

    renderHistory(history) {
        const container = this.element("vacation-milk-history");
        if (!container) return;
        const records = history?.records || [];
        if (!records.length) {
            container.innerHTML = '<p class="vacation-milk-empty">ยังไม่มีรายการนมช่วงปิดเทอม</p>';
            return;
        }
        container.innerHTML = records.map(record => `
            <article class="vacation-milk-history-row">
                <div>
                    <div class="vacation-milk-history-title">ปี ${this.escape(record.academicYear)} · ปิดเทอมหลังภาค ${this.escape(record.semester)}</div>
                    <div class="vacation-milk-history-meta">จ่าย ${this.escape(record.date)} · ${this.escape(record.days || 30)} วัน · ${this.escape(record.studentCount || 0)} คน · ${this.escape(record.totalBoxes || 0)} กล่อง · รูป ${(record.photos || []).length}</div>
                    <span class="vacation-milk-history-badge">จ่ายช่วงปิดเทอม</span>
                </div>
                <span class="vacation-milk-history-actions">
                    <button type="button" data-vacation-print="${this.escape(record.id)}">🖨️ พิมพ์รายงาน A4</button>
                    <button type="button" data-vacation-delete="${this.escape(record.id)}" data-quantity="${this.escape(record.totalBoxes || 0)}">ลบและคืนสต็อก</button>
                </span>
            </article>
        `).join("");
    }

    printHistoryRecord(recordId) {
        const record = (this.currentHistory?.records || []).find(
            item => String(item.id) === String(recordId)
        );
        if (!record) {
            this.renderError(new Error("ไม่พบรายการนมช่วงปิดเทอมสำหรับพิมพ์"));
            return;
        }
        try {
            this.operationPrintView ||= window.MilkOperationPrintView;
            if (!this.operationPrintView?.print) {
                throw new Error("ระบบพิมพ์รายงานจ่ายนมยังไม่พร้อมใช้งาน");
            }
            const snapshot = this.teacherManager.getSnapshot?.() || {};
            this.operationPrintView.print({
                kind: "vacation",
                record,
                session: this.activeSession,
                settings: snapshot.settings || {},
                students: snapshot.students || snapshot.room?.students || []
            });
            this.setStatus("เปิดหน้าพิมพ์รายงานนมช่วงปิดเทอมแล้ว", "success");
        } catch (error) {
            this.renderError(error);
        }
    }

    setBusy(busy, message = "") {
        const panel = this.element("vacation-milk-panel");
        panel?.setAttribute?.("aria-busy", busy ? "true" : "false");
        ["vacation-milk-history-button", "vacation-milk-issue-button"].forEach(id => {
            const button = this.element(id);
            if (button) button.disabled = Boolean(busy) || (id === "vacation-milk-issue-button" && !this.currentPreview);
        });
        if (busy && message) this.setStatus(message, "idle");
    }

    setStatus(message, state = "idle") {
        const status = this.element("vacation-milk-status");
        if (!status) return;
        status.textContent = message || "";
        status.dataset.state = state;
    }

    renderError(error) {
        const target = this.element("vacation-milk-error");
        if (!target) return;
        target.hidden = false;
        target.textContent = error?.message || "ไม่สามารถดำเนินการได้";
        this.setStatus("ไม่สามารถดำเนินการได้", "error");
    }

    clearError() {
        const target = this.element("vacation-milk-error");
        if (!target) return;
        target.hidden = true;
        target.textContent = "";
    }

    clear() {
        this.activeSession = null;
        this.currentPreview = null;
        this.currentHistory = null;
        this.vacationMilkManager?.clear?.();
        const panel = this.element("vacation-milk-panel");
        if (panel) panel.hidden = true;
        this.clearError();
        this.renderPreview(null);
        this.renderHistory(null);
    }

    today() {
        const date = new Date();
        return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
    }

    value(id) {
        return String(this.element(id)?.value || "").trim();
    }

    setValue(id, value) {
        const element = this.element(id);
        if (element) element.value = value;
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    element(id) {
        return this.document.getElementById(id);
    }

    escape(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    getState() {
        return {
            initialized: this.initialized,
            active: Boolean(this.activeSession),
            roomId: this.activeSession?.roomId || null,
            preview: this.currentPreview,
            historyCount: this.currentHistory?.records?.length || 0
        };
    }
}

window.VacationMilkView = new VacationMilkView();
