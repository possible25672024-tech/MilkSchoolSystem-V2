class AdminDashboardView {
    constructor(
        manager = window.AdminDashboardManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.document = options.document || document;
        this.window = options.window || window;
        this.bound = false;
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        this.handleSession(this.authService?.getSession?.());
    }

    bindEvents() {
        if (this.bound) return;
        this.element("admin-dashboard-refresh")?.addEventListener("click", () => {
            this.load({ forceReport: true });
        });
        this.eventTarget.addEventListener?.("milkapp:report-ready", event => {
            const session = this.authService?.getSession?.();
            if (session?.role === "admin") this.load({ report: event?.detail?.report });
        });
        this.eventTarget.addEventListener?.("milkapp:login-success", event => {
            this.handleSession(event?.detail?.session);
        });
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    handleSession(session) {
        if (session?.role !== "admin") {
            this.reset();
            return;
        }
        const report = this.window.ReportManager?.getCurrentReport?.();
        if (report) this.load({ report });
    }

    async load(options = {}) {
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลดภาพรวมระบบ...");
        try {
            const model = await this.manager.refresh(options);
            this.render(model);
            this.setStatus(`อัปเดตล่าสุด ${this.formatDateTime(model.generatedAt)}`);
            return model;
        } catch (error) {
            this.showError(error?.message || "โหลดภาพรวมระบบไม่สำเร็จ");
            this.setStatus("");
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    render(model) {
        const totals = model?.totals || {};
        this.setText("admin-dashboard-school", model?.schoolName || "โรงเรียน");
        this.setText("admin-dashboard-year", model?.academicYear || "ไม่ระบุ");
        this.setText("admin-dashboard-main-stock", `${totals.mainStock || 0} กล่อง`);
        this.setText("admin-dashboard-room-stock", `${totals.roomStock || 0} กล่อง`);
        this.setText("admin-dashboard-system-stock", `${totals.systemStock || 0} กล่อง`);
        this.setText("admin-dashboard-rooms", `${totals.rooms || 0} ห้อง`);
        this.setText("admin-dashboard-students", `${totals.students || 0} คน`);
        this.setText("admin-dashboard-used", `${totals.used || 0} กล่อง`);
        this.setText("admin-dashboard-ready", `${model?.counts?.ready || 0} ห้อง`);
        this.setText("admin-dashboard-empty", `${model?.counts?.empty || 0} ห้อง`);
        this.setText("admin-dashboard-mismatch", `${model?.counts?.mismatch || 0} ห้อง`);
        this.setText("admin-dashboard-negative", `${model?.counts?.negative || 0} ห้อง`);
        const health = this.element("admin-dashboard-health");
        if (health) {
            health.dataset.state = model?.healthy ? "ready" : "warning";
            health.textContent = model?.healthy
                ? "ยอด Room Stock ตรงกับประวัติทุกห้อง"
                : "พบห้องที่ควรตรวจสอบยอด Room Stock";
        }
        this.renderRooms(model?.rooms || []);
    }

    renderRooms(rooms) {
        const body = this.element("admin-dashboard-room-body");
        if (!body) return;
        body.replaceChildren(...rooms.map(room => {
            const row = this.document.createElement("tr");
            row.dataset.state = room.state;
            [
                room.roomName,
                room.students,
                room.actual,
                room.expected,
                this.signedNumber(room.difference),
                this.stateLabel(room.state)
            ].forEach((value, index) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = ["ห้องเรียน", "นักเรียน", "คงเหลือจริง", "ตามประวัติ", "ส่วนต่าง", "สถานะ"][index];
                cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });
            return row;
        }));
        if (!rooms.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 6;
            cell.textContent = "ยังไม่มีข้อมูลห้องเรียน";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    stateLabel(state) {
        return {
            ready: "ปกติ",
            empty: "สต็อกหมด",
            mismatch: "ยอดไม่ตรง",
            negative: "ติดลบ"
        }[state] || "ตรวจสอบ";
    }

    signedNumber(value) {
        const number = Number(value) || 0;
        return number > 0 ? `+${number}` : String(number);
    }

    formatDateTime(value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("th-TH");
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(message) {
        this.setText("admin-dashboard-status", message);
    }

    showError(message) {
        const element = this.element("admin-dashboard-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(busy) {
        const button = this.element("admin-dashboard-refresh");
        if (button) button.disabled = Boolean(busy);
    }

    reset() {
        this.manager?.clear?.();
        this.setStatus("");
        this.showError("");
        this.element("admin-dashboard-room-body")?.replaceChildren?.();
    }
}

window.AdminDashboardView = new AdminDashboardView();
