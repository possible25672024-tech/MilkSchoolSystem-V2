class RetroactiveMilkManager {
    constructor(
        retroactiveMilkService = window.RetroactiveMilkService,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        syncService = window.SyncService
    ) {
        this.retroactiveMilkService = retroactiveMilkService;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.syncService = syncService;
        this.currentHistory = null;
        this.inFlightDeletes = new Set();
    }

    ensureService() {
        if (!this.retroactiveMilkService) {
            this.retroactiveMilkService = window.RetroactiveMilkService;
        }
        const required = ["assertRoomAccess", "preview", "loadHistory", "issue", "remove"];
        const missing = required.find(method => !this.retroactiveMilkService?.[method]);
        if (missing) {
            throw new Error(`RetroactiveMilkService method ${missing} is not available.`);
        }
        return this.retroactiveMilkService;
    }

    ensureAuthService() {
        if (!this.authService) {
            this.authService = window.AuthService;
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
        return this.authService;
    }

    ensureTeacherManager() {
        if (!this.teacherManager) {
            this.teacherManager = window.TeacherManager;
        }
        if (!this.teacherManager?.getSnapshot) {
            throw new Error("TeacherManager is not available.");
        }
        return this.teacherManager;
    }

    ensureSyncService() {
        if (!this.syncService) {
            this.syncService = window.SyncService;
        }
        if (!this.syncService) {
            throw new Error("SyncService is not available.");
        }
        return this.syncService;
    }

    getSession() {
        const session = this.ensureAuthService().getSession();
        this.ensureService().assertRoomAccess(session);
        return session;
    }

    getStudents() {
        const snapshot = this.ensureTeacherManager().getSnapshot();
        const students = snapshot?.students || snapshot?.room?.students || [];
        return Array.isArray(students) ? students : Object.values(students || {});
    }

    preview(input = {}) {
        return this.ensureService().preview(this.getSession(), {
            ...input,
            students: this.getStudents()
        });
    }

    async loadHistory() {
        this.currentHistory = await this.ensureService().loadHistory(this.getSession());
        this.emit("milkapp:retro-history-loaded", this.currentHistory);
        return this.currentHistory;
    }

    queueStockAdjustment(session, error) {
        const details = error?.details || {};
        const syncService = this.ensureSyncService();
        if (!syncService.queueRoomStockAdjustment) {
            throw new Error("SyncService cannot queue Retroactive Milk Room Stock retries.");
        }
        const deleting = details.operation === "delete";
        const queueEntry = syncService.queueRoomStockAdjustment(session, {
            roomId: details.roomId,
            difference: details.difference,
            referenceId: details.referenceId,
            roomName: details.roomName,
            date: details.date,
            operationType: details.operationType,
            note: deleting
                ? "คืนสต็อกจากการลบรายการนมย้อนหลัง (ซิงก์ค้าง)"
                : "หักสต็อกจากการจ่ายนมย้อนหลัง (ซิงก์ค้าง)",
            key: `stockadj_${details.referenceId}`
        });
        return {
            ...details,
            queueEntry,
            stockQueued: true,
            mainStockDelta: 0
        };
    }

    queueAuditIfNeeded(session, result) {
        if (result?.audit?.ok !== false || (!result?.ledger?.id && !result?.stockLog?.id)) {
            return result;
        }
        const syncService = this.ensureSyncService();
        if (!syncService.queueAttendanceAudit) {
            throw new Error("SyncService cannot queue Retroactive Milk audit retries.");
        }
        const auditQueueEntry = syncService.queueAttendanceAudit(session, {
            roomId: result.roomId || result.ledger?.roomId || result.stockLog?.roomId,
            referenceId: result.referenceId || result.id,
            ledger: result.ledger,
            stockLog: result.stockLog,
            key: `audit_${result.ledger?.id || result.stockLog?.id}`
        });
        return {
            ...result,
            auditQueued: true,
            auditQueueEntry,
            mainStockDelta: 0
        };
    }

    async issue(input = {}) {
        const session = this.getSession();
        try {
            let result = await this.ensureService().issue(session, {
                ...input,
                students: this.getStudents()
            });
            result = this.queueAuditIfNeeded(session, result);
            this.emit(
                result.auditQueued ? "milkapp:retro-audit-queued" : "milkapp:retro-issued",
                result
            );
            return result;
        } catch (error) {
            if (error?.code !== "RETRO_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "issue") {
                throw error;
            }
            const result = this.queueStockAdjustment(session, error);
            this.emit("milkapp:retro-stock-queued", result);
            return result;
        }
    }

    async remove(input = {}) {
        const recordId = String(input.recordId || input.id || "").trim();
        if (!recordId) {
            throw new Error("A Retroactive Milk record id is required.");
        }
        if (this.inFlightDeletes.has(recordId)) {
            const error = new Error("Retroactive Milk deletion is already in progress.");
            error.code = "RETRO_DELETE_IN_PROGRESS";
            throw error;
        }
        this.inFlightDeletes.add(recordId);
        const session = this.getSession();
        try {
            try {
                let result = await this.ensureService().remove(session, input);
                result = this.queueAuditIfNeeded(session, result);
                this.emit(
                    result.auditQueued ? "milkapp:retro-audit-queued" : "milkapp:retro-deleted",
                    result
                );
                return result;
            } catch (error) {
                if (error?.code !== "RETRO_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "delete") {
                    throw error;
                }
                const result = this.queueStockAdjustment(session, error);
                this.emit("milkapp:retro-stock-queued", result);
                return result;
            }
        } finally {
            this.inFlightDeletes.delete(recordId);
        }
    }

    clear() {
        this.currentHistory = null;
        this.inFlightDeletes.clear();
    }

    emit(name, detail) {
        if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent(name, { detail }));
        }
    }
}

window.RetroactiveMilkManager = new RetroactiveMilkManager();
