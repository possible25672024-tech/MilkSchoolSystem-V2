class AdminReceiptManager {
    constructor(
        service = window.AdminReceiptService,
        authService = window.AuthService
    ) {
        this.service = service;
        this.authService = authService;
        this.current = null;
        this.detail = null;
    }

    ensureDependencies() {
        this.service ||= window.AdminReceiptService;
        this.authService ||= window.AuthService;
        if (!this.service?.load || !this.service?.receive || !this.authService?.getSession) {
            throw new Error("Admin Receipt dependencies are not available.");
        }
    }

    getSession() {
        this.ensureDependencies();
        return this.authService.getSession();
    }

    createOperationId(prefix = "receipt") {
        const random = globalThis.crypto?.randomUUID?.()
            || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        return `${prefix}-${random}`;
    }

    preview(input = {}) {
        return this.service.preview(this.getSession(), input);
    }

    async refresh() {
        this.current = await this.service.load(this.getSession());
        return this.current;
    }

    async loadDetail(receiptId) {
        this.detail = await this.service.loadDetail(this.getSession(), receiptId);
        return this.detail;
    }

    async receive(input = {}) {
        const result = await this.service.receive(
            this.getSession(),
            input,
            this.createOperationId("receipt-create")
        );
        await this.refresh();
        return result;
    }

    async update(receiptId, input = {}) {
        if (!this.detail || this.detail.receipt?.id !== String(receiptId)) {
            throw new Error("กรุณาเปิดรายการรับนมใหม่ก่อนแก้ไข");
        }
        const result = await this.service.update(
            this.getSession(),
            receiptId,
            input,
            this.detail.etag,
            this.createOperationId("receipt-edit")
        );
        this.detail = null;
        await this.refresh();
        return result;
    }

    async delete(receiptId) {
        if (!this.detail || this.detail.receipt?.id !== String(receiptId)) {
            await this.loadDetail(receiptId);
        }
        const result = await this.service.delete(
            this.getSession(),
            receiptId,
            this.detail.etag,
            this.createOperationId("receipt-delete")
        );
        this.detail = null;
        await this.refresh();
        return result;
    }

    clear() {
        this.current = null;
        this.detail = null;
    }
}

window.AdminReceiptManager = new AdminReceiptManager();
