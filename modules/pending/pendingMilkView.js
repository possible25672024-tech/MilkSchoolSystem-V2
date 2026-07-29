class PendingMilkView {
    constructor(
        pendingMilkManager = window.PendingMilkManager,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        options = {}
    ) {
        this.pendingMilkManager = pendingMilkManager;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.currentWeek = null;
        this.selectedKeys = new Set();

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleLoad = this.handleLoad.bind(this);
        this.handleIssue = this.handleIssue.bind(this);
        this.handleSelectionChange = this.handleSelectionChange.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
    }

    ensureDependencies() {
        if (!this.pendingMilkManager) {
            this.pendingMilkManager = window.PendingMilkManager;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }
        if (!this.teacherManager) {
            this.teacherManager = window.TeacherManager;
        }
        if (!this.pendingMilkManager?.loadWeek || !this.pendingMilkManager?.issue || !this.pendingMilkManager?.remove) {
            throw new Error("PendingMilkManager is not available.");
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
        if (this.document.getElementById("pending-milk-view-style")) {
            return;
        }
        const style = this.document.createElement("style");
        style.id = "pending-milk-view-style";
        style.textContent = `
            .pending-milk-panel{margin-top:28px;padding-top:26px;border-top:1px solid #dbe5ef}
            .pending-milk-intro{margin:6px 0 0;color:#64748b;font-size:.9rem}
            .pending-milk-toolbar{display:grid;grid-template-columns:minmax(180px,1fr) auto;align-items:end;gap:12px;margin-top:18px}
            .pending-milk-toolbar label{margin:0 0 6px}
            .pending-milk-toolbar button{width:auto;min-width:150px;margin:0}
            .pending-milk-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:18px}
            .pending-milk-summary-card{margin:0;border-radius:10px;padding:12px;text-align:center;background:#f1f5f9}
            .pending-milk-summary-card dt{color:#64748b;font-size:.78rem;font-weight:700}
            .pending-milk-summary-card dd{margin:5px 0 0;color:#1a5276;font-size:1.15rem;font-weight:800}
            .pending-milk-list,.pending-milk-history{display:grid;gap:10px;margin-top:18px}
            .pending-milk-row{display:grid;grid-template-columns:auto minmax(180px,1fr) minmax(120px,auto);align-items:center;gap:12px;border:1px solid #dbe5ef;border-radius:12px;padding:13px;background:#fff}
            .pending-milk-row input[type=checkbox]{width:auto;min-height:auto;margin:0}
            .pending-milk-name{font-weight:700;overflow-wrap:anywhere}
            .pending-milk-meta{color:#64748b;font-size:.82rem}
            .pending-milk-issued{color:#166534;font-weight:700}
            .pending-milk-empty{margin:0;border-radius:10px;padding:16px;color:#64748b;background:#f8fafc}
            .pending-milk-note{margin-top:16px}
            .pending-milk-note label{margin:0 0 6px}
            .pending-milk-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}
            .pending-milk-actions button{width:min(240px,100%)}
            #pending-milk-status[data-state=success]{color:#166534}
            #pending-milk-status[data-state=warning]{color:#9a3412}
            #pending-milk-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.pending-milk-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.pending-milk-row{grid-template-columns:auto 1fr}}
            @media(max-width:600px){.pending-milk-toolbar,.pending-milk-summary{grid-template-columns:1fr}.pending-milk-toolbar button,.pending-milk-actions button{width:100%}.pending-milk-actions{flex-direction:column}.pending-milk-row{grid-template-columns:auto 1fr}.pending-milk-row .pending-milk-date{grid-column:2}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("pending-milk-panel")) {
            return;
        }
        const teacherShell = this.document.getElementById("teacher-shell");
        if (!teacherShell) {
            throw new Error("Teacher shell is not available for Pending Milk UI.");
        }
        const panel = this.document.createElement("section");
        panel.id = "pending-milk-panel";
        panel.className = "pending-milk-panel";
        panel.setAttribute("aria-labelledby", "pending-milk-title");
        panel.setAttribute("aria-busy", "false");
        panel.hidden = true;
        panel.innerHTML = `
            <h3 id="pending-milk-title">จ่ายนมค้างรายสัปดาห์</h3>
            <p class="pending-milk-intro">แสดงเฉพาะนักเรียนที่ขาดเรียนและยังไม่เคยรับนมค้างของวันนั้น</p>
            <div class="pending-milk-toolbar">
                <div>
                    <label for="pending-milk-week-date">เลือกวันที่ในสัปดาห์</label>
                    <input id="pending-milk-week-date" type="date" required>
                </div>
                <button id="pending-milk-load-button" type="button">โหลดรายการ</button>
            </div>
            <p id="pending-milk-week-label" class="status" aria-live="polite"></p>
            <dl class="pending-milk-summary" aria-label="สรุปรายการนมค้าง">
                <div class="pending-milk-summary-card"><dt>มีสิทธิ์รับ</dt><dd id="pending-milk-eligible-count">0</dd></div>
                <div class="pending-milk-summary-card"><dt>เคยรับแล้ว</dt><dd id="pending-milk-issued-count">0</dd></div>
                <div class="pending-milk-summary-card"><dt>เลือกแล้ว</dt><dd id="pending-milk-selected-count">0</dd></div>
                <div class="pending-milk-summary-card"><dt>กล่องที่จะหัก</dt><dd id="pending-milk-box-count">0</dd></div>
            </dl>
            <div id="pending-milk-list" class="pending-milk-list"></div>
            <div class="pending-milk-note">
                <label for="pending-milk-note">หมายเหตุ</label>
                <input id="pending-milk-note" type="text" maxlength="300" placeholder="หมายเหตุ (ไม่บังคับ)">
            </div>
            <p id="pending-milk-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="pending-milk-error" class="error" role="alert" hidden></p>
            <div class="pending-milk-actions">
                <button id="pending-milk-issue-button" type="button" disabled>จ่ายนมค้าง</button>
            </div>
            <h3 style="margin-top:24px">ประวัติล่าสุดของห้อง</h3>
            <div id="pending-milk-history" class="pending-milk-history"></div>
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
        this.element("pending-milk-load-button")?.addEventListener?.("click", this.handleLoad);
        this.element("pending-milk-issue-button")?.addEventListener?.("click", this.handleIssue);
        this.element("pending-milk-list")?.addEventListener?.("change", this.handleSelectionChange);
        this.element("pending-milk-history")?.addEventListener?.("click", this.handleDeleteClick);
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
        this.element("pending-milk-panel")?.removeAttribute?.("hidden");
        this.setValue("pending-milk-week-date", this.today());
        this.setStatus("เลือกวันที่ในสัปดาห์แล้วกด “โหลดรายการ”", "idle");
        this.renderEmpty();
    }

    async handleLoad() {
        const weekDate = this.value("pending-milk-week-date");
        if (!weekDate) {
            this.renderError(new Error("กรุณาเลือกวันที่ในสัปดาห์"));
            return;
        }
        this.setBusy(true, "กำลังโหลดรายการนมค้าง...");
        try {
            this.currentWeek = await this.pendingMilkManager.loadWeek(weekDate);
            this.selectedKeys.clear();
            this.renderWeek(this.currentWeek);
            this.clearError();
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    handleSelectionChange(event) {
        const target = event?.target;
        if (!target?.matches?.("input[data-pending-key]")) {
            return;
        }
        const key = String(target.dataset.pendingKey || "");
        if (target.checked) {
            this.selectedKeys.add(key);
        } else {
            this.selectedKeys.delete(key);
        }
        this.renderSelectionSummary();
    }

    selectedPairs() {
        const eligible = this.currentWeek?.eligible || [];
        return eligible
            .filter(pair => this.selectedKeys.has(pair.key))
            .map(pair => ({ studentId: pair.studentId, date: pair.date }));
    }

    async handleIssue() {
        if (!this.currentWeek) {
            this.renderError(new Error("กรุณาโหลดรายการก่อน"));
            return;
        }
        const selectedPairs = this.selectedPairs();
        if (!selectedPairs.length) {
            this.renderError(new Error("กรุณาเลือกรายการนมค้างอย่างน้อย 1 รายการ"));
            return;
        }
        if (!this.confirm(`ยืนยันจ่ายนมค้าง ${selectedPairs.length} กล่อง?`)) {
            return;
        }
        this.setBusy(true, "กำลังบันทึกรายการนมค้าง...");
        try {
            const result = await this.pendingMilkManager.issue({
                weekDate: this.value("pending-milk-week-date"),
                selectedPairs,
                note: this.value("pending-milk-note")
            });
            if (result.stockQueued) {
                this.setStatus("บันทึกรายการแล้ว แต่การหักสต็อกถูกเข้าคิวเพื่อซิงก์ใหม่", "warning");
            } else if (result.auditQueued) {
                this.setStatus("จ่ายนมค้างและหักสต็อกแล้ว แต่ Audit ถูกเข้าคิว", "warning");
            } else {
                this.setStatus(`จ่ายนมค้างสำเร็จ ${result.quantity} กล่อง · สต็อกห้อง ${result.roomStockBefore} → ${result.roomStockAfter}`, "success");
            }
            this.setValue("pending-milk-note", "");
            await this.teacherManager.refresh();
            this.currentWeek = await this.pendingMilkManager.loadWeek(this.value("pending-milk-week-date"));
            this.selectedKeys.clear();
            this.renderWeek(this.currentWeek, { preserveStatus: true });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async handleDeleteClick(event) {
        const button = event?.target?.closest?.("button[data-pending-delete]");
        if (!button) {
            return;
        }
        const recordId = String(button.dataset.pendingDelete || "");
        const record = (this.currentWeek?.records || []).find(item => item.id === recordId);
        if (!record || !this.confirm(`ยืนยันลบรายการนมค้าง ${Number(record.totalBoxes) || 0} กล่อง และคืนสต็อกห้อง?`)) {
            return;
        }
        this.setBusy(true, "กำลังลบรายการและคืนสต็อก...");
        try {
            const result = await this.pendingMilkManager.remove({ recordId });
            if (result.stockQueued) {
                this.setStatus("ลบรายการแล้ว แต่การคืนสต็อกถูกเข้าคิวเพื่อซิงก์ใหม่", "warning");
            } else if (result.auditQueued) {
                this.setStatus("ลบและคืนสต็อกแล้ว แต่ Audit ถูกเข้าคิว", "warning");
            } else {
                this.setStatus(`ลบรายการสำเร็จ · คืนสต็อก ${result.restoredQuantity} กล่อง`, "success");
            }
            await this.teacherManager.refresh();
            this.currentWeek = await this.pendingMilkManager.loadWeek(this.value("pending-milk-week-date"));
            this.selectedKeys.clear();
            this.renderWeek(this.currentWeek, { preserveStatus: true });
        } catch (error) {
            this.renderError(error);
        } finally {
            this.setBusy(false);
        }
    }

    renderWeek(state = {}, options = {}) {
        this.setText("pending-milk-week-label", `สัปดาห์ ${this.formatDate(state.weekStart)} – ${this.formatDate(state.weekEnd)}`);
        this.setText("pending-milk-eligible-count", state.eligibleBoxes || 0);
        this.setText("pending-milk-issued-count", state.alreadyIssuedBoxes || 0);
        const list = this.element("pending-milk-list");
        if (list) {
            list.innerHTML = (state.eligible || []).length
                ? state.eligible.map(pair => `
                    <label class="pending-milk-row">
                        <input type="checkbox" data-pending-key="${this.escape(pair.key)}">
                        <span><span class="pending-milk-name">${this.escape(pair.studentNumber)}. ${this.escape(pair.name)}</span><br><span class="pending-milk-meta">ขาดเรียน · 1 กล่อง</span></span>
                        <span class="pending-milk-date">${this.escape(this.formatDate(pair.date))}</span>
                    </label>
                `).join("")
                : '<p class="pending-milk-empty">ไม่มีนักเรียนที่ขาดและยังไม่ได้รับนมค้างในสัปดาห์นี้</p>';
        }
        this.renderHistory(state.records || []);
        this.renderSelectionSummary();
        if (!options.preserveStatus) {
            this.setStatus(
                (state.eligible || []).length
                    ? `พบรายการที่มีสิทธิ์ ${state.eligibleBoxes} รายการ`
                    : "สัปดาห์นี้ไม่มีรายการที่ต้องจ่ายนมค้าง",
                (state.eligible || []).length ? "idle" : "success"
            );
        }
    }

    renderHistory(records = []) {
        const history = this.element("pending-milk-history");
        if (!history) {
            return;
        }
        const ordered = [...records]
            .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")))
            .slice(0, 15);
        history.innerHTML = ordered.length
            ? ordered.map(record => `
                <article class="pending-milk-row">
                    <span aria-hidden="true">✓</span>
                    <span><span class="pending-milk-name">${this.escape(this.formatDate(record.weekStart))} – ${this.escape(this.formatDate(record.weekEnd))}</span><br><span class="pending-milk-meta">${Number(record.totalBoxes) || 0} กล่อง · ${this.escape(record.note || "ไม่มีหมายเหตุ")}</span></span>
                    <button class="danger" type="button" data-pending-delete="${this.escape(record.id)}">ลบและคืนสต็อก</button>
                </article>
            `).join("")
            : '<p class="pending-milk-empty">ยังไม่มีประวัตินมค้างของห้องนี้</p>';
    }

    renderSelectionSummary() {
        const count = this.selectedKeys.size;
        this.setText("pending-milk-selected-count", count);
        this.setText("pending-milk-box-count", count);
        const button = this.element("pending-milk-issue-button");
        if (button) {
            button.disabled = count === 0 || !this.currentWeek;
        }
    }

    renderEmpty() {
        this.currentWeek = null;
        this.selectedKeys.clear();
        this.setText("pending-milk-week-label", "");
        this.setText("pending-milk-eligible-count", 0);
        this.setText("pending-milk-issued-count", 0);
        this.setText("pending-milk-selected-count", 0);
        this.setText("pending-milk-box-count", 0);
        const list = this.element("pending-milk-list");
        if (list) {
            list.innerHTML = '<p class="pending-milk-empty">เลือกวันที่ในสัปดาห์เพื่อโหลดรายการ</p>';
        }
        const history = this.element("pending-milk-history");
        if (history) {
            history.innerHTML = '<p class="pending-milk-empty">ประวัติจะโหลดพร้อมรายการนมค้าง</p>';
        }
        const button = this.element("pending-milk-issue-button");
        if (button) {
            button.disabled = true;
        }
    }

    setBusy(isBusy, message = "") {
        const panel = this.element("pending-milk-panel");
        panel?.setAttribute?.("aria-busy", String(Boolean(isBusy)));
        for (const id of ["pending-milk-load-button", "pending-milk-issue-button"]) {
            const element = this.element(id);
            if (element) {
                element.disabled = Boolean(isBusy) || (id === "pending-milk-issue-button" && this.selectedKeys.size === 0);
            }
        }
        if (isBusy && message) {
            this.setStatus(message, "idle");
        }
    }

    setStatus(message, state = "idle") {
        const status = this.element("pending-milk-status");
        if (status) {
            status.textContent = message;
            status.dataset.state = state;
        }
    }

    renderError(error) {
        const target = this.element("pending-milk-error");
        if (target) {
            target.textContent = `ดำเนินการนมค้างไม่สำเร็จ: ${error?.message || "ไม่ทราบสาเหตุ"}`;
            target.hidden = false;
        }
        this.setStatus("ไม่สามารถดำเนินการได้", "error");
    }

    clearError() {
        const target = this.element("pending-milk-error");
        if (target) {
            target.textContent = "";
            target.hidden = true;
        }
    }

    clear() {
        this.activeSession = null;
        this.pendingMilkManager?.clear?.();
        this.element("pending-milk-panel")?.setAttribute?.("hidden", "");
        this.setValue("pending-milk-note", "");
        this.renderEmpty();
        this.setStatus("", "idle");
        this.clearError();
    }

    getState() {
        return {
            initialized: this.initialized,
            active: this.activeSession?.role === "teacher",
            weekStart: this.currentWeek?.weekStart || null,
            weekEnd: this.currentWeek?.weekEnd || null,
            eligible: this.currentWeek?.eligibleBoxes || 0,
            selected: this.selectedKeys.size
        };
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

window.PendingMilkView = new PendingMilkView();
