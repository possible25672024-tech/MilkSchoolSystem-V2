class AdminDistributionView {
    constructor(
        manager = window.AdminDistributionManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.document = options.document || document;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.bound = false;
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        this.setDefaultDate();
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelector?.('[data-admin-menu="distribution"]')
            ?.addEventListener("click", () => this.load());
        this.document.querySelector?.('[data-admin-menu="distribution-history"]')
            ?.addEventListener("click", () => this.loadHistory());
        this.element("admin-distribution-refresh")?.addEventListener("click", () => this.load());
        this.element("admin-distribution-history-refresh")?.addEventListener("click", () => this.loadHistory());
        this.element("admin-distribution-form")?.addEventListener("input", () => this.renderPreview());
        this.element("admin-distribution-room")?.addEventListener("change", () => this.renderPreview());
        this.element("admin-distribution-form")?.addEventListener("submit", event => this.submit(event));
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    formInput() {
        return {
            date: this.element("admin-distribution-date")?.value,
            roomId: this.element("admin-distribution-room")?.value,
            days: this.element("admin-distribution-days")?.value,
            perCrate: this.element("admin-distribution-per-crate")?.value,
            year: this.element("admin-distribution-year")?.value,
            note: this.element("admin-distribution-note")?.value
        };
    }

    async load() {
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลด Main Stock และห้องเรียน...");
        try {
            const model = await this.manager.refresh();
            this.renderForm(model);
            this.setStatus(`พร้อมจ่ายนม · Main Stock ${model.mainStock} กล่อง`);
            return model;
        } catch (error) {
            this.showError(error?.message || "โหลดข้อมูลจ่ายนมไม่สำเร็จ");
            this.setStatus("");
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    async loadHistory() {
        this.setHistoryBusy(true);
        this.showHistoryError("");
        this.setHistoryStatus("กำลังโหลดประวัติการจ่ายนม...");
        try {
            const model = await this.manager.refreshHistory();
            this.renderHistory(model);
            this.setHistoryStatus(`โหลดประวัติ ${model.distributions.length} รายการ`);
            return model;
        } catch (error) {
            this.showHistoryError(error?.message || "โหลดประวัติการจ่ายนมไม่สำเร็จ");
            this.setHistoryStatus("");
            return null;
        } finally {
            this.setHistoryBusy(false);
        }
    }

    renderForm(model = {}) {
        this.setText("admin-distribution-main-stock", `${model.mainStock || 0} กล่อง`);
        const select = this.element("admin-distribution-room");
        if (select) {
            const selected = select.value;
            const placeholder = this.document.createElement("option");
            placeholder.value = "";
            placeholder.textContent = "-- เลือกห้องเรียน --";
            const options = (model.rooms || []).map(room => {
                const option = this.document.createElement("option");
                option.value = room.id;
                option.textContent = `${room.name} — ${room.students} คน · คงเหลือ ${room.roomStock}`;
                return option;
            });
            select.replaceChildren(placeholder, ...options);
            if (model.rooms?.some(room => room.id === selected)) select.value = selected;
        }
        this.renderPreview();
    }

    renderPreview() {
        try {
            const preview = this.manager.preview(this.formInput());
            this.setText("admin-distribution-students", `${preview.students} คน`);
            this.setText("admin-distribution-total", `${preview.total} กล่อง`);
            this.setText("admin-distribution-package", `${preview.crates} ลัง + ${preview.boxes} กล่อง`);
            this.setText("admin-distribution-main-after", `${preview.mainStockAfter} กล่อง`);
            this.setText("admin-distribution-room-after", `${preview.roomStockBefore} → ${preview.roomStockAfter} กล่อง`);
            this.showError("");
            return preview;
        } catch (error) {
            this.setText("admin-distribution-students", "—");
            this.setText("admin-distribution-total", "—");
            this.setText("admin-distribution-package", "—");
            this.setText("admin-distribution-main-after", "—");
            this.setText("admin-distribution-room-after", "—");
            return null;
        }
    }

    async submit(event) {
        event?.preventDefault?.();
        const preview = this.renderPreview();
        if (!preview) {
            this.showError("กรุณาเลือกห้อง วันที่ และจำนวนวันให้ถูกต้อง");
            return;
        }
        const message = [
            `ยืนยันจ่ายนมให้ห้อง ${preview.roomName}`,
            `${preview.students} คน × ${preview.days} วัน = ${preview.total} กล่อง`,
            `Main Stock ${preview.mainStockBefore} → ${preview.mainStockAfter} กล่อง`
        ].join("\n");
        if (!this.confirm(message)) return;

        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังบันทึกแบบป้องกันการตัดสต็อกซ้ำ...");
        try {
            const result = await this.manager.distribute(this.formInput());
            if (this.manager.current) this.renderForm(this.manager.current);
            if (this.manager.history) this.renderHistory(this.manager.history);
            const suffix = result.idempotent ? " · ตรวจพบคำสั่งเดิม จึงไม่ตัดซ้ำ" : "";
            const refreshWarning = result.refreshWarning
                ? " · บันทึกสำเร็จ แต่โหลดข้อมูลใหม่ไม่ครบ กรุณากดโหลดสต็อกใหม่ ห้ามกดบันทึกซ้ำ"
                : "";
            this.setStatus(
                `จ่ายนมสำเร็จ ${result.record.total} กล่อง · Main Stock ${result.mainStockBefore} → ${result.mainStockAfter}${suffix}${refreshWarning}`
            );
            this.clearForm();
            return result;
        } catch (error) {
            this.showError(this.errorMessage(error));
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    errorMessage(error) {
        return {
            DISTRIBUTION_LOCKED: "มีรายการจ่ายนมจาก Admin อีกหน้ากำลังบันทึก กรุณารอแล้วโหลดข้อมูลใหม่",
            DISTRIBUTION_OPERATION_MISMATCH: "คำสั่งนี้ไม่ตรงกับรายการเดิม ระบบหยุดเพื่อป้องกันการตัด Main Stock ซ้ำ",
            INSUFFICIENT_MAIN_STOCK: "Main Stock ไม่เพียงพอ กรุณาตรวจยอดรับนมและโหลดข้อมูลใหม่",
            QUARANTINED_ROOM_DATE: error?.message
        }[error?.code] || error?.message || "บันทึกการจ่ายนมไม่สำเร็จ";
    }

    renderHistory(model = {}) {
        this.setText("admin-distribution-history-main-stock", `${model.mainStock || 0} กล่อง`);
        this.setText("admin-distribution-history-count", `${model.distributions?.length || 0} รายการ`);
        this.setText("admin-distribution-history-total", `${model.totalBoxes || 0} กล่อง`);
        const body = this.element("admin-distribution-history-body");
        if (!body) return;
        body.replaceChildren(...(model.distributions || []).map((record, index) => {
            const row = this.document.createElement("tr");
            const values = [
                index + 1,
                record.date || "—",
                record.roomName,
                record.students,
                `${record.days} วัน`,
                `${record.crates} ลัง + ${record.boxes} กล่อง`,
                `${record.total} กล่อง`,
                `${record.stockBefore} → ${record.stockAfter}`,
                record.note || "—"
            ];
            values.forEach((value, cellIndex) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = ["#", "วันที่", "ห้อง", "นักเรียน", "วัน", "ลัง/เศษ", "รวม", "Main Stock", "หมายเหตุ"][cellIndex];
                cell.textContent = String(value);
                row.appendChild(cell);
            });
            return row;
        }));
        if (!model.distributions?.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 9;
            cell.textContent = "ยังไม่มีประวัติการจ่ายนมให้ห้องเรียน";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    clearForm() {
        this.element("admin-distribution-form")?.reset?.();
        this.setDefaultDate();
        this.renderPreview();
    }

    setDefaultDate() {
        const input = this.element("admin-distribution-date");
        if (input && !input.value) {
            const now = new Date();
            const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
            input.value = localTime.toISOString().slice(0, 10);
        }
        const days = this.element("admin-distribution-days");
        if (days && !days.value) days.value = "1";
        const perCrate = this.element("admin-distribution-per-crate");
        if (perCrate && !perCrate.value) perCrate.value = "36";
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(message) { this.setText("admin-distribution-status", message); }
    setHistoryStatus(message) { this.setText("admin-distribution-history-status", message); }

    showError(message) {
        const element = this.element("admin-distribution-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    showHistoryError(message) {
        const element = this.element("admin-distribution-history-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(busy) {
        this.document.querySelectorAll?.(
            "#admin-distribution-form input, #admin-distribution-form select, #admin-distribution-form button, #admin-distribution-refresh"
        )?.forEach(element => { element.disabled = Boolean(busy); });
    }

    setHistoryBusy(busy) {
        const button = this.element("admin-distribution-history-refresh");
        if (button) button.disabled = Boolean(busy);
    }

    reset() {
        this.manager?.clear?.();
        this.element("admin-distribution-room")?.replaceChildren?.();
        this.element("admin-distribution-history-body")?.replaceChildren?.();
        this.setStatus("");
        this.setHistoryStatus("");
        this.showError("");
        this.showHistoryError("");
    }
}

window.AdminDistributionView = new AdminDistributionView();
