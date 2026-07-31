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
        this.element("admin-dashboard-room-body")?.addEventListener("click", event => {
            const button = event?.target?.closest?.("[data-stock-trace-room]");
            if (button?.dataset?.stockTraceRoom) {
                this.renderTrace(this.manager.getRoomTrace(button.dataset.stockTraceRoom));
            }
        });
        this.element("admin-stock-trace-close")?.addEventListener("click", () => {
            this.closeTrace();
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
        this.setText("admin-dashboard-baseline", `${model?.counts?.baseline || 0} ห้อง`);
        this.setText("admin-dashboard-negative", `${model?.counts?.negative || 0} ห้อง`);
        const health = this.element("admin-dashboard-health");
        if (health) {
            health.dataset.state = model?.healthy ? "ready" : "warning";
            health.textContent = model?.healthy
                ? "ทุกห้องมีประวัติครบและ Room Stock ไม่ติดลบ"
                : "พบห้องที่ต้องระบุยอดยกมาหรือตรวจสอบสต็อกติดลบ";
        }
        this.renderRooms(model?.rooms || []);
    }

    renderRooms(rooms) {
        const body = this.element("admin-dashboard-room-body");
        if (!body) return;
        body.replaceChildren(...rooms.map(room => {
            const row = this.document.createElement("tr");
            row.dataset.state = room.state;
            const values = [
                room.roomName,
                room.students,
                room.actual,
                room.historyBalance,
                this.signedNumber(room.openingBalance),
                this.stateLabel(room.state)
            ];
            values.forEach((value, index) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = ["ห้องเรียน", "นักเรียน", "คงเหลือจริง", "จากประวัติ V2", "ยอดยกมา/รายการขาด", "สถานะ"][index];
                cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });
            const actionCell = this.document.createElement("td");
            actionCell.dataset.label = "เส้นทาง";
            const button = this.document.createElement("button");
            button.type = "button";
            button.dataset.stockTraceRoom = room.roomId;
            button.textContent = "ดูเส้นทาง";
            actionCell.appendChild(button);
            row.appendChild(actionCell);
            return row;
        }));
        if (!rooms.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 7;
            cell.textContent = "ยังไม่มีข้อมูลห้องเรียน";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    stateLabel(state) {
        return {
            ready: "ประวัติครบ",
            empty: "สต็อกหมด",
            baseline: "ต้องระบุยอดยกมา",
            negative: "ติดลบ"
        }[state] || "ตรวจสอบ";
    }

    renderTrace(room) {
        this.setText("admin-stock-trace-room", room.roomName);
        this.setText("admin-stock-trace-opening", this.signedNumber(room.openingBalance));
        this.setText("admin-stock-trace-distributed", room.distributed);
        this.setText("admin-stock-trace-attendance", `−${room.attendance}`);
        this.setText("admin-stock-trace-pending", `−${room.pending}`);
        this.setText("admin-stock-trace-retroactive", `−${room.retroactive}`);
        this.setText("admin-stock-trace-vacation", `−${room.vacation}`);
        this.setText("admin-stock-trace-actual", room.actual);
        this.setText(
            "admin-stock-trace-equation",
            `${this.signedNumber(room.openingBalance)} + ${room.distributed} − ${room.attendance} − ${room.pending} − ${room.retroactive} − ${room.vacation} = ${room.reconciledBalance} กล่อง`
        );
        const warning = this.element("admin-stock-trace-warning");
        if (warning) {
            warning.hidden = room.openingBalance === 0;
            warning.textContent = room.openingBalance === 0
                ? ""
                : "ยอดนี้เป็นส่วนต่างที่มีอยู่ก่อนประวัติ V2 หรือมาจากธุรกรรมเก่าที่ยังไม่ถูกนำเข้า ระบบยังไม่เขียนปรับ Stock อัตโนมัติ";
        }
        this.element("admin-stock-trace")?.removeAttribute("hidden");
        this.element("admin-stock-trace")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }

    closeTrace() {
        const panel = this.element("admin-stock-trace");
        if (panel) panel.hidden = true;
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
        this.closeTrace();
        this.setStatus("");
        this.showError("");
        this.element("admin-dashboard-room-body")?.replaceChildren?.();
    }
}

window.AdminDashboardView = new AdminDashboardView();
