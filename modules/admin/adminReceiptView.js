class AdminReceiptView {
    constructor(
        manager = window.AdminReceiptManager,
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
        this.document.querySelector?.('[data-admin-menu="receipts"]')?.addEventListener("click", () => {
            if (this.authService?.getSession?.()?.role === "admin") this.load();
        });
        this.element("admin-receipt-refresh")?.addEventListener("click", () => this.load());
        this.element("admin-receipt-form")?.addEventListener("input", () => this.renderPreview());
        this.element("admin-receipt-form")?.addEventListener("submit", event => this.submit(event));
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    formInput() {
        return {
            date: this.element("admin-receipt-date")?.value,
            crates: this.element("admin-receipt-crates")?.value,
            extra: this.element("admin-receipt-extra")?.value,
            perCrate: this.element("admin-receipt-per-crate")?.value,
            note: this.element("admin-receipt-note")?.value,
            supplier: "อบต."
        };
    }

    renderPreview() {
        try {
            const preview = this.manager.preview(this.formInput());
            this.setText("admin-receipt-preview", `${preview.total} กล่อง`);
            this.showError("");
            return preview;
        } catch (error) {
            this.setText("admin-receipt-preview", "—");
            return null;
        }
    }

    async load() {
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลดประวัติรับนม...");
        try {
            const model = await this.manager.refresh();
            this.render(model);
            this.setStatus(`โหลดประวัติรับนม ${model.receipts.length} รายการ`);
            return model;
        } catch (error) {
            this.showError(error?.message || "โหลดประวัติรับนมไม่สำเร็จ");
            this.setStatus("");
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    render(model = {}) {
        this.setText("admin-receipt-main-stock", `${model.mainStock || 0} กล่อง`);
        const body = this.element("admin-receipt-body");
        if (!body) return;
        body.replaceChildren(...(model.receipts || []).map(receipt => {
            const row = this.document.createElement("tr");
            [
                receipt.date || "—",
                receipt.supplier,
                `${receipt.crates} ลัง + ${receipt.extra} กล่อง`,
                `${receipt.total} กล่อง`,
                receipt.note || "—"
            ].forEach((value, index) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = ["วันที่รับ", "แหล่งรับ", "ลัง/เศษ", "รวม", "หมายเหตุ"][index];
                cell.textContent = String(value);
                row.appendChild(cell);
            });
            return row;
        }));
        if (!model.receipts?.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 5;
            cell.textContent = "ยังไม่มีประวัติรับนม";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    async submit(event) {
        event?.preventDefault?.();
        const preview = this.renderPreview();
        if (!preview) {
            this.showError("กรุณากรอกจำนวนลังและวันที่รับนมให้ถูกต้อง");
            return;
        }
        if (!this.confirm(`ยืนยันรับนมจาก อบต. ${preview.total} กล่อง เข้า Main Stock?`)) {
            return;
        }
        this.setBusy(true);
        this.showError("");
        try {
            const result = await this.manager.receive(this.formInput());
            this.render(this.manager.current);
            this.setStatus(`รับนมสำเร็จ · Main Stock ${result.stockBefore} → ${result.stockAfter} กล่อง`);
            this.element("admin-receipt-form")?.reset?.();
            this.setDefaultDate();
            this.renderPreview();
        } catch (error) {
            this.showError(error?.message || "บันทึกรับนมไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    setDefaultDate() {
        const input = this.element("admin-receipt-date");
        if (input && !input.value) {
            const now = new Date();
            const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
            input.value = localTime.toISOString().slice(0, 10);
        }
        const perCrate = this.element("admin-receipt-per-crate");
        if (perCrate && !perCrate.value) perCrate.value = "36";
        const extra = this.element("admin-receipt-extra");
        if (extra && !extra.value) extra.value = "0";
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(message) {
        this.setText("admin-receipt-status", message);
    }

    showError(message) {
        const element = this.element("admin-receipt-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(busy) {
        this.document.querySelectorAll?.(
            "#admin-receipt-form input, #admin-receipt-form button, #admin-receipt-refresh"
        )?.forEach(element => {
            element.disabled = Boolean(busy);
        });
    }

    reset() {
        this.manager?.clear?.();
        this.element("admin-receipt-body")?.replaceChildren?.();
        this.setStatus("");
        this.showError("");
    }
}

window.AdminReceiptView = new AdminReceiptView();
