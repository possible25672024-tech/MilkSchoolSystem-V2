class AdminConsumptionView {
    constructor(
        manager = window.AdminConsumptionManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.document = options.document || document;
        this.bound = false;
    }

    element(id) { return this.document.getElementById(id); }

    initialize() {
        this.bindEvents();
        const today = this.today();
        this.setValue("admin-consumption-date", today);
        this.setValue("admin-attendance-month", today.slice(0, 7));
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelector?.('[data-admin-menu="dashboard"]')
            ?.addEventListener("click", () => this.loadOverview());
        this.document.querySelector?.('[data-admin-menu="attendance"]')
            ?.addEventListener("click", () => this.loadHistory());
        this.element("admin-consumption-refresh")?.addEventListener("click", () => this.loadOverview());
        this.element("admin-attendance-filter")?.addEventListener("click", () => this.loadHistory());
        this.element("admin-consumption-latest")?.addEventListener("click", event => this.openDetail(event));
        this.element("admin-attendance-body")?.addEventListener("click", event => this.openDetail(event));
        window.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    isAdmin() { return this.authService?.getSession?.()?.role === "admin"; }

    async loadOverview() {
        if (!this.isAdmin()) return null;
        this.setBusy("overview", true);
        this.showError("");
        this.setStatus("admin-consumption-status", "กำลังโหลดข้อมูลการดื่มนมทุกห้อง...");
        try {
            const model = await this.manager.loadOverview(this.element("admin-consumption-date")?.value);
            this.renderOverview(model);
            this.setStatus("admin-consumption-status", `โหลดข้อมูลวันที่ ${this.formatDate(model.date)} สำเร็จ`);
            return model;
        } catch (error) {
            this.showError(error?.message || "โหลดภาพรวมการดื่มนมไม่สำเร็จ");
            return null;
        } finally {
            this.setBusy("overview", false);
        }
    }

    renderOverview(model = {}) {
        this.setText("admin-consumption-rooms", model.rooms || 0);
        this.setText("admin-consumption-students", model.students || 0);
        this.setText("admin-consumption-present", model.presentToday || 0);
        this.setText("admin-consumption-absent", model.absentToday || 0);
        this.setText("admin-consumption-rate", `${model.monthlyRate || 0}%`);
        this.renderRecordRows("admin-consumption-latest", model.latest || [], true);
        const body = this.element("admin-consumption-room-status");
        if (!body) return;
        body.replaceChildren(...(model.roomStatuses || []).map(room => {
            const row = this.document.createElement("tr");
            const status = {
                complete: "✅ เช็กครบ",
                partial: "⚠️ เช็กไม่ครบ",
                missing: "⏳ ยังไม่เช็ก"
            }[room.status] || "—";
            [room.roomName, room.teacher, room.students, room.present, room.absent, room.unchecked, status]
                .forEach(value => {
                    const cell = this.document.createElement("td");
                    cell.textContent = String(value ?? "");
                    row.appendChild(cell);
                });
            return row;
        }));
    }

    async loadHistory() {
        if (!this.isAdmin()) return null;
        this.setBusy("history", true);
        this.showError("");
        this.setStatus("admin-attendance-status", "กำลังโหลดประวัติการเช็ก...");
        try {
            const model = await this.manager.loadHistory({
                roomId: this.element("admin-attendance-room-filter")?.value,
                month: this.element("admin-attendance-month")?.value
            });
            this.renderRoomOptions(model.rooms || []);
            this.renderRecordRows("admin-attendance-body", model.records || [], false);
            this.setStatus("admin-attendance-status", `พบ ${model.records?.length || 0} รายการ`);
            return model;
        } catch (error) {
            this.showError(error?.message || "โหลดประวัติการเช็กไม่สำเร็จ");
            return null;
        } finally {
            this.setBusy("history", false);
        }
    }

    renderRoomOptions(rooms = []) {
        const select = this.element("admin-attendance-room-filter");
        if (!select) return;
        const current = select.value;
        const all = this.document.createElement("option");
        all.value = "";
        all.textContent = "ทุกห้อง";
        const options = rooms.map(room => {
            const option = this.document.createElement("option");
            option.value = room.id;
            option.textContent = room.name;
            return option;
        });
        select.replaceChildren(all, ...options);
        if (rooms.some(room => room.id === current)) select.value = current;
    }

    renderRecordRows(targetId, records = [], compact = false) {
        const body = this.element(targetId);
        if (!body) return;
        body.replaceChildren(...records.map(record => {
            const row = this.document.createElement("tr");
            row.dataset.roomId = record.roomId;
            row.dataset.date = record.date;
            const values = compact
                ? [this.formatDate(record.date), record.roomName, record.teacher, record.present, record.absent]
                : [this.formatDate(record.date), record.roomName, record.teacher, record.present, record.absent, record.unchecked, this.formatDateTime(record.savedAt)];
            values.forEach(value => {
                const cell = this.document.createElement("td");
                cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });
            const action = this.document.createElement("td");
            const button = this.document.createElement("button");
            button.type = "button";
            button.dataset.adminAttendanceDetail = "true";
            button.textContent = "ดูรายละเอียด";
            action.appendChild(button);
            row.appendChild(action);
            return row;
        }));
        if (!records.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = compact ? 6 : 8;
            cell.textContent = "ไม่มีข้อมูลการเช็กในช่วงที่เลือก";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    async openDetail(event) {
        const button = event?.target?.closest?.("[data-admin-attendance-detail]");
        const row = button?.closest?.("tr");
        if (!button || !row?.dataset?.roomId || !row?.dataset?.date) return;
        this.showError("");
        try {
            await window.AdminRoomView?.loadRoom?.(row.dataset.roomId);
            await window.AdminRoomView?.openRecordDetail?.("attendance", { date: row.dataset.date });
        } catch (error) {
            this.showError(error?.message || "เปิดรายละเอียดการเช็กไม่สำเร็จ");
        }
    }

    setBusy(type, busy) {
        const ids = type === "overview"
            ? ["admin-consumption-date", "admin-consumption-refresh"]
            : ["admin-attendance-room-filter", "admin-attendance-month", "admin-attendance-filter"];
        ids.forEach(id => {
            const element = this.element(id);
            if (element) element.disabled = Boolean(busy);
        });
    }

    showError(message) {
        const element = this.element("admin-room-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setText(id, value) { const element = this.element(id); if (element) element.textContent = String(value ?? ""); }
    setValue(id, value) { const element = this.element(id); if (element && !element.value) element.value = String(value ?? ""); }
    setStatus(id, value) { this.setText(id, value); }
    formatDate(value) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("th-TH") : "—"; }
    formatDateTime(value) { const date = new Date(value); return value && !Number.isNaN(date.getTime()) ? date.toLocaleString("th-TH") : "—"; }
    today() { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); }
    reset() { this.manager?.clear?.(); }
}

window.AdminConsumptionView = new AdminConsumptionView();
