class SyncView {
    constructor(
        syncManager = window.SyncManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.syncManager = syncManager;
        this.authService = authService;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.network = options.network || window.navigator;
        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.syncingOverride = false;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleSyncEvent = this.handleSyncEvent.bind(this);
        this.handleManualRetry = this.handleManualRetry.bind(this);
    }

    ensureDependencies() {
        if (!this.syncManager) {
            this.syncManager = window.SyncManager;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }

        if (!this.syncManager?.getStatus || !this.syncManager?.flushNow) {
            throw new Error("SyncManager is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
    }

    async initialize() {
        if (this.initialized) {
            return this.getState();
        }

        this.ensureDependencies();
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

    ensureStructure() {
        if (this.element("sync-panel")) {
            return;
        }

        const teacherShell = this.element("teacher-shell");
        if (!teacherShell || !this.document?.createElement) {
            return;
        }

        this.ensureStyles();
        const panel = this.document.createElement("section");
        panel.id = "sync-panel";
        panel.className = "sync-panel";
        panel.hidden = true;
        panel.setAttribute?.("aria-labelledby", "sync-title");
        panel.setAttribute?.("aria-busy", "false");
        panel.innerHTML = `
            <div class="sync-heading">
                <div>
                    <p class="eyebrow">ออฟไลน์และการซิงก์</p>
                    <h3 id="sync-title">สถานะรายการรอซิงก์</h3>
                </div>
                <span id="sync-banner" class="sync-banner" data-state="idle">ไม่มีรายการรอซิงก์</span>
            </div>
            <dl class="sync-summary" aria-label="สรุปสถานะซิงก์">
                <div class="sync-summary-card"><dt>รายการค้าง</dt><dd id="sync-pending-count">0</dd></div>
                <div class="sync-summary-card"><dt>ลองสูงสุด</dt><dd id="sync-max-attempts">0</dd></div>
                <div class="sync-summary-card"><dt>สำเร็จล่าสุด</dt><dd id="sync-last-succeeded">0</dd></div>
                <div class="sync-summary-card"><dt>ล้มเหลว/รอต่อ</dt><dd id="sync-last-failed">0</dd></div>
            </dl>
            <div class="sync-details">
                <p><strong>ซิงก์สำเร็จล่าสุด:</strong> <span id="sync-last-synced-at">ยังไม่มี</span></p>
                <p><strong>ผลล่าสุด:</strong> <span id="sync-last-summary">ยังไม่มีการซิงก์</span></p>
                <p><strong>ลองใหม่ใน:</strong> <span id="sync-next-retry">—</span></p>
            </div>
            <div id="sync-queue-items" class="sync-queue-items" aria-live="polite"></div>
            <p id="sync-status" class="status" data-state="idle" aria-live="polite"></p>
            <p id="sync-error" class="error" role="alert" hidden></p>
            <div class="sync-actions">
                <button id="sync-retry-button" type="button">ลองซิงก์ใหม่</button>
            </div>
        `;
        teacherShell.appendChild?.(panel);
    }

    ensureStyles() {
        if (this.element("sync-view-style") || !this.document?.createElement) {
            return;
        }

        const style = this.document.createElement("style");
        style.id = "sync-view-style";
        style.textContent = `
            .sync-panel { margin-top: 28px; padding-top: 26px; border-top: 1px solid #dbe5ef; }
            .sync-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
            .sync-banner { flex: 0 0 auto; border-radius: 999px; padding: 7px 12px; color: #166534; background: #dcfce7; font-size: .85rem; font-weight: 800; }
            .sync-banner[data-state="offline"], .sync-banner[data-state="warning"] { color: #9a3412; background: #ffedd5; }
            .sync-banner[data-state="syncing"] { color: #1e3a8a; background: #dbeafe; }
            .sync-banner[data-state="error"] { color: #991b1b; background: #fee2e2; }
            .sync-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
            .sync-summary-card { margin: 0; border-radius: 10px; padding: 12px; text-align: center; background: #f1f5f9; }
            .sync-summary-card dt { color: #64748b; font-size: .78rem; font-weight: 700; }
            .sync-summary-card dd { margin: 5px 0 0; color: #1a5276; font-size: 1.15rem; font-weight: 800; }
            .sync-details { display: grid; gap: 5px; margin-top: 16px; color: #475569; font-size: .9rem; }
            .sync-details p { margin: 0; overflow-wrap: anywhere; }
            .sync-queue-items { display: grid; gap: 10px; margin-top: 16px; }
            .sync-item { border: 1px solid #dbe5ef; border-radius: 12px; padding: 13px; background: #fff; }
            .sync-item-heading { display: flex; justify-content: space-between; gap: 10px; }
            .sync-item-title { margin: 0; color: #1f2937; font-weight: 800; }
            .sync-item-state { font-size: .8rem; font-weight: 800; color: #475569; }
            .sync-item-meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px 12px; margin-top: 8px; color: #64748b; font-size: .84rem; }
            .sync-item-error { margin: 8px 0 0; color: #991b1b; font-size: .84rem; overflow-wrap: anywhere; }
            .sync-empty { margin: 0; border-radius: 10px; padding: 16px; color: #64748b; background: #f8fafc; }
            .sync-actions { display: flex; justify-content: flex-end; margin-top: 8px; }
            .sync-actions button { width: min(220px, 100%); }
            #sync-status[data-state="success"] { color: #166534; }
            #sync-status[data-state="warning"] { color: #9a3412; }
            #sync-status[data-state="error"] { color: #991b1b; }
            @media (max-width: 760px) { .sync-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
            @media (max-width: 600px) {
                .sync-heading { flex-direction: column; }
                .sync-banner { align-self: flex-start; }
                .sync-summary, .sync-item-meta { grid-template-columns: 1fr; }
                .sync-actions button { width: 100%; }
            }
        `;
        this.document.head?.appendChild?.(style);
    }

    bindEvents() {
        if (this.bound) {
            return;
        }

        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        for (const eventName of [
            "milkapp:sync-online",
            "milkapp:sync-offline",
            "milkapp:sync-started",
            "milkapp:sync-completed",
            "milkapp:sync-failed",
            "milkapp:sync-queue-count",
            "online",
            "offline"
        ]) {
            this.eventTarget.addEventListener?.(eventName, this.handleSyncEvent);
        }
        this.element("sync-retry-button")?.addEventListener?.("click", this.handleManualRetry);
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

    handleSyncEvent(event) {
        if (event?.type === "milkapp:sync-started") {
            this.syncingOverride = true;
        } else if (event?.type === "milkapp:sync-completed" || event?.type === "milkapp:sync-failed") {
            this.syncingOverride = false;
        }

        if (this.activeSession?.role === "teacher") {
            this.render();
        }
    }

    async handleManualRetry() {
        const button = this.element("sync-retry-button");
        if (this.activeSession?.role !== "teacher" || button?.disabled) {
            return null;
        }

        this.syncingOverride = true;
        this.clearError();
        this.render();

        try {
            const summary = await this.syncManager.flushNow("manual-ui");
            this.syncingOverride = false;
            this.render();
            return summary;
        } catch (error) {
            this.syncingOverride = false;
            this.renderError(error);
            this.render();
            return null;
        }
    }

    activate(session) {
        if (session?.role !== "teacher") {
            this.clear();
            return null;
        }

        this.activeSession = { ...session };
        const panel = this.element("sync-panel");
        if (panel) {
            panel.hidden = false;
        }
        this.syncManager.start?.();
        this.render();
        return this.getState();
    }

    clear() {
        this.activeSession = null;
        this.syncingOverride = false;
        this.syncManager?.stop?.();
        const panel = this.element("sync-panel");
        if (panel) {
            panel.hidden = true;
            panel.setAttribute?.("aria-busy", "false");
        }
        this.setText("sync-pending-count", "0");
        this.setText("sync-max-attempts", "0");
        this.setText("sync-last-succeeded", "0");
        this.setText("sync-last-failed", "0");
        this.setText("sync-last-synced-at", "ยังไม่มี");
        this.setText("sync-last-summary", "ยังไม่มีการซิงก์");
        this.setText("sync-next-retry", "—");
        this.setText("sync-status", "");
        this.renderItems([]);
        this.clearError();
    }

    render() {
        if (this.activeSession?.role !== "teacher") {
            return;
        }

        let status;
        try {
            status = this.syncManager.getStatus() || {};
        } catch (error) {
            this.renderError(error);
            status = {};
        }

        const online = status.online !== false && this.network?.onLine !== false;
        const flushing = this.syncingOverride || Boolean(status.flushing);
        const queueCount = this.nonNegativeNumber(status.queueCount);
        const maxAttempts = this.nonNegativeNumber(status.maxAttempts);
        const summary = status.lastSummary || {};
        const succeeded = this.nonNegativeNumber(summary.succeeded);
        const failed = this.nonNegativeNumber(summary.failed);
        const deferred = this.nonNegativeNumber(summary.deferred);
        const remaining = Number.isFinite(Number(summary.remaining))
            ? this.nonNegativeNumber(summary.remaining)
            : queueCount;

        this.setText("sync-pending-count", this.formatNumber(queueCount));
        this.setText("sync-max-attempts", this.formatNumber(maxAttempts));
        this.setText("sync-last-succeeded", this.formatNumber(succeeded));
        this.setText("sync-last-failed", this.formatNumber(failed));
        this.setText("sync-last-synced-at", this.formatTimestamp(status.lastSyncedAt));
        this.setText(
            "sync-last-summary",
            summary.processed === undefined
                ? "ยังไม่มีการซิงก์"
                : `ประมวลผล ${this.formatNumber(summary.processed)} · สำเร็จ ${this.formatNumber(succeeded)} · รอต่อ ${this.formatNumber(failed)} · คงเหลือ ${this.formatNumber(remaining)}`
        );
        this.setText("sync-next-retry", this.formatRetry(summary.nextRetryDelay));
        this.renderItems(Array.isArray(status.queueItems) ? status.queueItems : []);
        this.renderBanner({ online, flushing, queueCount, failed, deferred });

        const panel = this.element("sync-panel");
        panel?.setAttribute?.("aria-busy", String(flushing));
        const button = this.element("sync-retry-button");
        if (button) {
            button.disabled = !online || flushing || queueCount === 0;
            button.textContent = flushing ? "กำลังซิงก์..." : "ลองซิงก์ใหม่";
        }
    }

    renderBanner({ online, flushing, queueCount, failed, deferred }) {
        const banner = this.element("sync-banner");
        const status = this.element("sync-status");
        let state = "idle";
        let message = "ไม่มีรายการรอซิงก์";

        if (!online) {
            state = "offline";
            message = queueCount > 0
                ? `ออฟไลน์ · รอซิงก์ ${this.formatNumber(queueCount)} รายการ`
                : "ออฟไลน์ · ยังไม่มีรายการค้าง";
        } else if (flushing) {
            state = "syncing";
            message = "กำลังซิงก์รายการค้าง...";
        } else if (failed > 0 || deferred > 0) {
            state = "error";
            message = `มี ${this.formatNumber(queueCount)} รายการรอลองใหม่`;
        } else if (queueCount > 0) {
            state = "warning";
            message = `รอซิงก์ ${this.formatNumber(queueCount)} รายการ`;
        } else {
            state = "success";
            message = "ซิงก์ครบแล้ว";
        }

        if (banner) {
            banner.textContent = message;
            banner.dataset.state = state;
        }
        if (status) {
            status.textContent = message;
            status.dataset.state = state;
        }
    }

    renderItems(items) {
        const container = this.element("sync-queue-items");
        if (!container) {
            return;
        }

        if (!Array.isArray(items) || items.length === 0) {
            const empty = this.createElement("p", "sync-empty", "ไม่มีรายละเอียดรายการค้าง");
            container.replaceChildren?.(empty);
            return;
        }

        const nodes = items.map(item => {
            const article = this.createElement("article", "sync-item");
            const heading = this.createElement("div", "sync-item-heading");
            heading.appendChild?.(this.createElement("p", "sync-item-title", this.typeLabel(item.type)));
            heading.appendChild?.(this.createElement("span", "sync-item-state", this.statusLabel(item.status)));
            article.appendChild?.(heading);

            const meta = this.createElement("div", "sync-item-meta");
            for (const text of [
                `ห้อง: ${item.roomName || item.roomId || "—"}`,
                `วันที่/อ้างอิง: ${item.date || item.referenceId || "—"}`,
                `ลองแล้ว: ${this.formatNumber(item.attempts || 0)} ครั้ง`,
                `เข้าคิว: ${this.formatTimestamp(item.queuedAt)}`,
                `ลองครั้งถัดไป: ${this.formatTimestamp(item.nextRetryAt)}`
            ]) {
                meta.appendChild?.(this.createElement("span", "", text));
            }
            article.appendChild?.(meta);

            if (item.error?.code || item.error?.message) {
                article.appendChild?.(this.createElement(
                    "p",
                    "sync-item-error",
                    `${item.error.code || "SYNC_ERROR"}: ${item.error.message || "ซิงก์ไม่สำเร็จ"}`
                ));
            }
            return article;
        });
        container.replaceChildren?.(...nodes);
    }

    typeLabel(type) {
        return {
            attendance: "บันทึกเช็กดื่มนม",
            roomStockAdjust: "ปรับสต็อกห้องที่ค้าง",
            attendanceAudit: "บันทึกประวัติที่ค้าง"
        }[String(type || "")] || "รายการซิงก์";
    }

    statusLabel(status) {
        return {
            pending: "รอดำเนินการ",
            failed: "ลองไม่สำเร็จ",
            deferred: "รอดำเนินการต่อ",
            success: "สำเร็จ"
        }[String(status || "")] || "รอดำเนินการ";
    }

    formatTimestamp(value) {
        if (!value) {
            return "ยังไม่มี";
        }
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return "—";
        }
        return new Intl.DateTimeFormat("th-TH", {
            dateStyle: "short",
            timeStyle: "medium"
        }).format(date);
    }

    formatRetry(milliseconds) {
        const number = Number(milliseconds);
        if (!Number.isFinite(number) || number <= 0) {
            return "—";
        }
        return `${this.formatNumber(Math.ceil(number / 1000))} วินาที`;
    }

    nonNegativeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
    }

    formatNumber(value) {
        return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(this.nonNegativeNumber(value));
    }

    renderError(error) {
        const element = this.element("sync-error");
        if (!element) {
            return;
        }
        element.textContent = `แสดงสถานะซิงก์ไม่สำเร็จ: ${error?.message || "ไม่ทราบสาเหตุ"}`;
        element.hidden = false;
    }

    clearError() {
        const element = this.element("sync-error");
        if (!element) {
            return;
        }
        element.textContent = "";
        element.hidden = true;
    }

    getState() {
        let status = {};
        try {
            status = this.syncManager?.getStatus?.() || {};
        } catch (error) {
            status = {};
        }
        return {
            active: this.activeSession?.role === "teacher",
            session: this.activeSession ? { ...this.activeSession } : null,
            online: status.online !== false && this.network?.onLine !== false,
            flushing: this.syncingOverride || Boolean(status.flushing),
            queueCount: this.nonNegativeNumber(status.queueCount)
        };
    }

    createElement(tagName, className = "", text = "") {
        const element = this.document?.createElement?.(tagName);
        if (!element) {
            return null;
        }
        element.className = className;
        element.textContent = text;
        return element;
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    element(id) {
        return this.document?.getElementById?.(id) || null;
    }
}

window.SyncView = new SyncView();
