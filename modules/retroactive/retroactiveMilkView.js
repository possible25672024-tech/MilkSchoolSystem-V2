class RetroactiveMilkView {
    constructor(
        retroactiveMilkManager = window.RetroactiveMilkManager,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        options = {}
    ) {
        this.retroactiveMilkManager = retroactiveMilkManager;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.confirm = options.confirm || (message => window.confirm(message));
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
        if (!this.retroactiveMilkManager) {
            this.retroactiveMilkManager = window.RetroactiveMilkManager;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }
        if (!this.teacherManager) {
            this.teacherManager = window.TeacherManager;
        }
        const required = ["preview", "loadHistory", "issue", "remove"];
        const missing = required.find(method => !this.retroactiveMilkManager?.[method]);
        if (missing) {
            throw new Error(`RetroactiveMilkManager method ${missing} is not available.`);
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
        if (!this.teacherManager?.refresh) {
            throw new Error("TeacherManager is not available.");
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
        if (this.document.getElementById("retroactive-milk-view-style")) {
            return;
        }
        const style = this.document.createElement("style");
        style.id = "retroactive-milk-view-style";
        style.textContent = `
            .retroactive-milk-panel{margin-top:28px;padding-top:26px;border-top:1px solid #dbe5ef}
            .retroactive-milk-intro{margin:6px 0 0;color:#64748b;font-size:.9rem}
            .retroactive-milk-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:18px}
            .retroactive-milk-field label{display:block;margin:0 0 6px}
            .retroactive-milk-field-wide{grid-column:1/-1}
            .retroactive-milk-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
            .retroactive-milk-summary-card{margin:0;border-radius:10px;padding:12px;text-align:center;background:#f1f5f9}
            .retroactive-milk-summary-card dt{color:#64748b;font-size:.78rem;font-weight:700}
            .retroactive-milk-summary-card dd{margin:5px 0 0;color:#1a5276;font-size:1.15rem;font-weight:800}
            .retroactive-milk-summary-card.debt{background:#fff7ed}
            .retroactive-milk-summary-card.debt dd{color:#b91c1c}
            .retroactive-milk-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:14px}
            .retroactive-milk-actions button{width:min(260px,100%)}
            .retroactive-milk-history{display:grid;gap:10px;margin-top:16px}
            .retroactive-milk-history-row{display:grid;grid-template-columns:minmax(190px,1fr) auto;align-items:center;gap:12px;border:1px solid #dbe5ef;border-radius:12px;padding:13px;background:#fff}
            .retroactive-milk-history-title{font-weight:800;color:#1a5276}
            .retroactive-milk-history-meta{margin-top:3px;color:#64748b;font-size:.82rem;overflow-wrap:anywhere}
            .retroactive-milk-history-badge{display:inline-block;margin-top:6px;padding:3px 8px;border-radius:999px;background:#fee2e2;color:#991b1b;font-size:.76rem;font-weight:800}
            .retroactive-milk-empty{margin:0;border-radius:10px;padding:16px;color:#64748b;background:#f8fafc}
            #retroactive-milk-status[data-state=success]{color:#166534}
            #retroactive-milk-status[data-state=warning]{color:#9a3412}
            #retroactive-milk-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.retroactive-milk-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
            @media(max-width:600px){.retroactive-milk-form,.retroactive-milk-summary,.retroactive-milk-history-row{grid-template-columns:1fr}.retroactive-milk-actions{flex-direction:column}.retroactive-milk-actions button,.retroactive-milk-history-row button{width:100%}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("retroactive-milk-panel")) {
            return;
        }
        const teacherShell = this.document.getElementById("teacher-shell");
        if (!teacherShell) {
            throw new Error("Teacher shell is not available for Retroactive Milk UI.");
        }
        const panel = this.document.createElement("section");
        panel.id = "retroactive-milk-panel";
        panel.className = "retroactive-milk-panel";
        panel.setAttribute("aria-labelledby", "retroactive-milk-title");
        panel.setAttribute("aria-busy", "false");
        panel.hidden = true;
        panel.innerHTML = `
            <h3 id="retroactive-milk-title">จ่ายนมย้อนหลัง</h3>
            <p class="retroactive-milk-intro">คำนวณเฉพาะวันจันทร์–ศุกร์และบันทึกเป็นหนี้นม โดยหักเฉพาะสต็อกห้อง</p>
            <div class="retroactive-milk-form">
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-academic-year">ปีการศึกษา</label>
                    <input id="retroactive-milk-academic-year" type="number" min="2500" max="3000" required>
                </div>
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-semester">ภาคเรียน</label>
                    <select id="retroactive-milk-semester"><option value="1">ภาคเรียนที่ 1</option><option value="2">ภาคเรียนที่ 2</option></select>
                </div>
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-issue-date">วันที่จ่าย</label>
                    <input id="retroactive-milk-issue-date" type="date" required>
                </div>
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-room">ห้องเรียน</label>
                    <input id="retroactive-milk-room" type="text" readonly>
                </div>
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-start-date">ช่วงวันที่ย้อนหลัง — เริ่มต้น</label>
                    <input id="retroactive-milk-start-date" type="date" required>
                </div>
                <div class="retroactive-milk-field">
                    <label for="retroactive-milk-end-date">ช่วงวันที่ย้อนหลัง — วันสุดท้าย</label>
                    <input id="retroactive-milk-end-date" type="date" required>
                </div>
            </div>
            <dl class="retroactive-milk-summary" aria-label="สรุปนมย้อนหลัง">
                <div class="retroactive-milk-summary-card"><dt>นักเรียน</dt><dd id="retroactive-milk-student-count">0</dd></div>
                <div class="retroactive-milk-summary-card"><dt>วัน จ–ศ</dt><dd id="retroactive-milk-day-count">0</dd></div>
                <div class="retroactive-milk-summary-card"><dt>กล่องทั้งหมด</dt><dd id="retroactive-milk-box-count">0</dd></div>
                <div class="retroactive-milk-summary-card debt"><dt>หนี้นม</dt><dd id="retroactive-milk-debt-count">0</dd></div>
            </dl>
            <div class="retroactive-milk-field retroactive-milk-field-wide" style="margin-top:16px">
                <label for="retroactive-milk-note">หมายเหตุ</label>
                <input id="retroactive-milk-note" type="text" maxlength="300" placeholder="หมายเหตุ (ไม่บังคับ)">
            </div>
            <p id="retroactive-milk-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="retroactive-milk-error" class="error" role="alert" hidden></p>
            <div class="retroactive-milk-actions">
                <button id="retroactive-milk-history-button" type="button">โหลดประวัติ</button>
                <button id="retroactive-milk-issue-button" type="button" disabled>บันทึกนมย้อนหลัง</button>
            </div>
            <h3 style="margin-top:24px">รายการย้อนหลังของห้อง</h3>
            <div id="retroactive-milk-history" class="retroactive-milk-history"></div>
        `;
        const pendingPanel = this.document.getElementById("pending-milk-panel");
        const actions = this.document.getElementById("teacher-logout-button")?.parentElement;
        if (pendingPanel?.parentElement === teacherShell && pendingPanel.nextSibling) {
            teacherShell.insertBefore(panel, pendingPanel.nextSibling);
        } else if (actions && typeof teacherShell.insertBefore === "function") {
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
        [
            "retroactive-milk-academic-year",
            "retroactive-milk-semester",
            "retroactive-milk-issue-date",
            "retroactive-milk-start-date",
            "retroactive-milk-end-date"
        ].forEach(id => this.element(id)?.addEventListener?.("change", this.handlePreviewChange));
        this.element("retroactive-milk-history-button")?.addEventListener?.("click", this.handleLoadHistory);
        this.element("retroactive-milk-issue-button")?.addEventListener?.("click", this.handleIssue);
        this.element("retroactive-milk-history")?.addEventListener?.("click", this.handleDeleteClick);
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

    activate(session) {
        this.activeSession = { ...session };
        this.element("retroactive-milk-panel")?.removeAttribute?.("hidden");
        const today = this.today();
        this.setValue("retroactive-milk-academic-year", String(new Date().getFullYear() + 543));
        this.setValue("retroactive-milk-semester", "1");
        this.setValue("retroactive-milk-issue-date", today);
        this.setValue("retroactive-milk-room", String(session.roomName || session.roomId || ""));
        this.setStatus("เลือกช่วงวันที่ย้อนหลังเพื่อคำนวณจำนวนกล่อง", "idle");
        this.renderPreview(null);
        this.renderHistory(null);
    }

    handlePreviewChange() {
        this.clearError();
        try {
            this.currentPreview = this.retroactiveMilkManager.preview(this.formInput());
            this.renderPreview(this.currentPreview);
            this.setStatus(
                `ช่วง ${this.currentPreview.retroStart} – ${this.currentPreview.retroEnd} · ${this.currentPreview.days} วันทำการ`,
                "idle"
            );
        } catch (error) {
            this.currentPreview = null;
            this.renderPreview(null);
            if (this.hasCompleteRange()) {
                this.renderError(error);
            } else {
                this.setStatus("เลือกช่วงวันที่ย้อนหลังเพื่อคำนวณจำนวนกล่อง", "idle");
            }
        }
    }

    async handleLoadHistory() {
        this.setBusy(true, "กำลังโหลดประวัตินมย้อนหลัง...");
        try {
            this.currentHistory = await this.retroactiveMilkManager.loadHistory();
            this.renderHistory(this.currentHistory);
            this.clearError();
            this.setStatus(`โหลดประวัติแล้ว ${this.currentHistory.records.length} รายการ`, "success");
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handleIssue() {
        if (!this.currentPreview) {
            this.renderError(new Error("กรุณาเลือกช่วงวันที่ย้อนหลังที่ถูกต้อง"));
            return;
        }
        const quantity = this.currentPreview.totalBoxes;
        if (!this.confirm(`ยืนยันบันทึกนมย้อนหลัง ${quantity} กล่อง และหักสต็อกห้อง?`)) {
            return;
        }
        this.setBusy(true, "กำลังบันทึกรายการนมย้อนหลัง...");
        try {
            const result = await this.retroactiveMilkManager.issue(this.formInput());
            if (result.stockQueued) {
                this.setStatus("บันทึกรายการแล้ว แต่การหักสต็อกถูกเข้าคิวเพื่อซิงก์ใหม่", "warning");
            } else if (result.auditQueued) {
                this.setStatus("บันทึกและหักสต็อกแล้ว แต่ Audit ถูกเข้าคิว", "warning");
            } else {
                this.setStatus(`บันทึกสำเร็จ ${result.quantity} กล่อง · สต็อกห้อง ${result.roomStockBefore} → ${result.roomStockAfter}`, "success");
            }
            this.setValue("retroactive-milk-note", "");
            await this.teacherManager.refresh();
            this.currentHistory = await this.retroactiveMilkManager.loadHistory();
            this.renderHistory(this.currentHistory);
            this.clearError();
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handleDeleteClick(event) {
        const button = event?.target?.closest?.("button[data-retro-delete]");
        if (!button) {
            return;
        }
        const recordId = String(button.dataset.retroDelete || "");
        const quantity = Number(button.dataset.retroBoxes || 0);
        if (!recordId || !this.confirm(`ยืนยันลบรายการนมย้อนหลัง ${quantity} กล่อง และคืนสต็อกห้อง?`)) {
            return;
        }
        this.setBusy(true, "กำลังลบและคืนสต็อก...");
        try {
            const result = await this.retroactiveMilkManager.remove({ recordId });
            if (result.stockQueued) {
                this.setStatus("ลบรายการแล้ว แต่การคืนสต็อกถูกเข้าคิวเพื่อซิงก์ใหม่", "warning");
            } else if (result.auditQueued) {
                this.setStatus("ลบและคืนสต็อกแล้ว แต่ Audit ถูกเข้าคิว", "warning");
            } else {
                this.setStatus(`ลบสำเร็จ · สต็อกห้อง ${result.roomStockBefore} → ${result.roomStockAfter}`, "success");
            }
            await this.teacherManager.refresh();
            this.currentHistory = await this.retroactiveMilkManager.loadHistory();
            this.renderHistory(this.currentHistory);
            this.clearError();
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    formInput() {
        return {
            academicYear: this.value("retroactive-milk-academic-year"),
            semester: this.value("retroactive-milk-semester"),
            issueDate: this.value("retroactive-milk-issue-date"),
            retroStart: this.value("retroactive-milk-start-date"),
            retroEnd: this.value("retroactive-milk-end-date"),
            roomName: String(this.activeSession?.roomName || ""),
            teacher: String(this.activeSession?.teacher || ""),
            note: this.value("retroactive-milk-note")
        };
    }

    hasCompleteRange() {
        return Boolean(this.value("retroactive-milk-start-date") && this.value("retroactive-milk-end-date"));
    }

    renderPreview(preview) {
        this.text("retroactive-milk-student-count", preview?.studentCount || 0);
        this.text("retroactive-milk-day-count", preview?.days || 0);
        this.text("retroactive-milk-box-count", preview?.totalBoxes || 0);
        this.text("retroactive-milk-debt-count", preview?.debtBoxes || 0);
        const button = this.element("retroactive-milk-issue-button");
        if (button) {
            button.disabled = !preview?.totalBoxes;
        }
    }

    renderHistory(history) {
        const container = this.element("retroactive-milk-history");
        if (!container) {
            return;
        }
        const records = history?.records || [];
        if (!records.length) {
            container.innerHTML = '<p class="retroactive-milk-empty">ยังไม่ได้โหลดประวัติหรือยังไม่มีรายการนมย้อนหลัง</p>';
            return;
        }
        container.innerHTML = records.slice(0, 15).map(record => `
            <article class="retroactive-milk-history-row">
                <div>
                    <div class="retroactive-milk-history-title">${this.escape(record.retroStart)} – ${this.escape(record.retroEnd)}</div>
                    <div class="retroactive-milk-history-meta">ปี ${this.escape(record.academicYear)} · ภาค ${this.escape(record.semester)} · จ่าย ${this.escape(record.date)} · ${Number(record.days) || 0} วัน · ${Number(record.totalBoxes) || 0} กล่อง</div>
                    <span class="retroactive-milk-history-badge">หนี้นม ${Number(record.debtBoxes) || 0} กล่อง</span>
                </div>
                <button type="button" data-retro-delete="${this.escape(record.id)}" data-retro-boxes="${Number(record.totalBoxes) || 0}">ลบและคืนสต็อก</button>
            </article>
        `).join("");
    }

    setBusy(busy, message = "") {
        const panel = this.element("retroactive-milk-panel");
        panel?.setAttribute?.("aria-busy", String(Boolean(busy)));
        ["retroactive-milk-history-button", "retroactive-milk-issue-button"].forEach(id => {
            const button = this.element(id);
            if (button) {
                button.disabled = Boolean(busy) || (id === "retroactive-milk-issue-button" && !this.currentPreview?.totalBoxes);
            }
        });
        if (busy && message) {
            this.setStatus(message, "idle");
        }
    }

    renderError(error) {
        const element = this.element("retroactive-milk-error");
        if (element) {
            element.hidden = false;
            element.textContent = error?.message || "ไม่สามารถดำเนินการได้";
        }
        this.setStatus("ไม่สามารถดำเนินการได้", "error");
    }

    clearError() {
        const element = this.element("retroactive-milk-error");
        if (element) {
            element.hidden = true;
            element.textContent = "";
        }
    }

    setStatus(message, state = "idle") {
        const element = this.element("retroactive-milk-status");
        if (element) {
            element.textContent = message;
            element.dataset.state = state;
        }
    }

    clear() {
        this.activeSession = null;
        this.currentPreview = null;
        this.currentHistory = null;
        this.retroactiveMilkManager?.clear?.();
        const panel = this.element("retroactive-milk-panel");
        if (panel) {
            panel.hidden = true;
            panel.setAttribute("aria-busy", "false");
        }
        this.renderPreview(null);
        this.renderHistory(null);
        this.clearError();
    }

    getState() {
        return {
            initialized: this.initialized,
            active: Boolean(this.activeSession),
            preview: this.currentPreview,
            history: this.currentHistory
        };
    }

    today() {
        const date = new Date();
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    element(id) {
        return this.document.getElementById(id);
    }

    value(id) {
        return String(this.element(id)?.value || "").trim();
    }

    setValue(id, value) {
        const element = this.element(id);
        if (element) {
            element.value = String(value ?? "");
        }
    }

    text(id, value) {
        const element = this.element(id);
        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    escape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

window.RetroactiveMilkView = new RetroactiveMilkView();
