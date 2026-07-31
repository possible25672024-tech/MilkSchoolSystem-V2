class AdminDistributionManager {
    constructor(
        service = window.AdminDistributionService,
        authService = window.AuthService
    ) {
        this.service = service;
        this.authService = authService;
        this.current = null;
        this.history = null;
        this.operationId = "";
    }

    ensureDependencies() {
        this.service ||= window.AdminDistributionService;
        this.authService ||= window.AuthService;
        if (!this.service?.load || !this.service?.distribute || !this.authService?.getSession) {
            throw new Error("Admin Distribution dependencies are not available.");
        }
    }

    getSession() {
        this.ensureDependencies();
        return this.authService.getSession();
    }

    createOperationId() {
        const random = globalThis.crypto?.randomUUID?.()
            || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        return `dist-${random}`;
    }

    getOperationId() {
        this.operationId ||= this.createOperationId();
        return this.operationId;
    }

    async refresh() {
        this.current = await this.service.load(this.getSession());
        return this.current;
    }

    async refreshHistory() {
        this.history = await this.service.loadHistory(this.getSession());
        return this.history;
    }

    preview(input = {}) {
        if (!this.current) throw new Error("กรุณาโหลดข้อมูลห้องเรียนก่อน");
        return this.service.preview(this.getSession(), this.current, input);
    }

    async distribute(input = {}) {
        const operationId = this.getOperationId();
        const result = await this.service.distribute(this.getSession(), input, operationId);
        this.operationId = "";
        const refreshes = await Promise.allSettled([this.refresh(), this.refreshHistory()]);
        const refreshWarning = refreshes.some(refresh => refresh.status === "rejected");
        this.emit("milkapp:classroom-distributed", {
            roomId: result.record?.roomId,
            total: result.record?.total,
            idempotent: result.idempotent === true,
            refreshWarning
        });
        return { ...result, refreshWarning };
    }

    clear() {
        this.current = null;
        this.history = null;
        this.operationId = "";
    }

    emit(eventName, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

window.AdminDistributionManager = new AdminDistributionManager();
