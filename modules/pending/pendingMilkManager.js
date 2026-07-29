class PendingMilkManager {
    constructor(
        pendingMilkService = window.PendingMilkService,
        authService = window.AuthService,
        teacherManager = window.TeacherManager,
        syncService = window.SyncService
    ) {
        this.pendingMilkService = pendingMilkService;
        this.authService = authService;
        this.teacherManager = teacherManager;
        this.syncService = syncService;
        this.currentWeek = null;
        this.inFlightDeletes = new Set();
    }

    ensurePendingMilkService() {
        if (!this.pendingMilkService) {
            this.pendingMilkService = window.PendingMilkService;
        }
        if (!this.pendingMilkService?.loadWeek || !this.pendingMilkService?.issue || !this.pendingMilkService?.remove) {
            throw new Error("PendingMilkService is not available.");
        }
        return this.pendingMilkService;
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
        this.ensurePendingMilkService().assertRoomAccess(session);
        return session;
    }

    getStudents() {
        const snapshot = this.ensureTeacherManager().getSnapshot();
        const students = snapshot?.students || snapshot?.room?.students || [];
        return Array.isArray(students) ? students : Object.values(students || {});
    }

    async loadWeek(weekDate) {
        const session = this.getSession();
        this.currentWeek = await this.ensurePendingMilkService().loadWeek(
            session,
            weekDate,
            this.getStudents()
        );
        this.emit("milkapp:pending-week-loaded", this.currentWeek);
        return this.currentWeek;
    }

    queueStockAdjustment(session, error) {
        const details = error?.details || {};
        const syncService = this.ensureSyncService();
        if (!syncService.queueRoomStockAdjustment) {
            throw new Error("SyncService cannot queue Pending Milk Room Stock retries.");
        }
        const queueEntry = syncService.queueRoomStockAdjustment(session, {
            roomId: details.roomId,
            difference: details.difference,
            referenceId: details.referenceId,
            roomName: details.roomName,
            date: details.date,
            operationType: details.operationType,
            note: details.operation === "delete"
                ? "คืนสต็อกจากการลบรายการนมค้าง (ซิงก์ค้าง)"
                : "หักสต็อกจากการจ่ายนมค้าง (ซิงก์ค้าง)",
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
            throw new Error("SyncService cannot queue Pending Milk audit retries.");
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
            let result = await this.ensurePendingMilkService().issue(session, {
                ...input,
                students: this.getStudents()
            });
            result = this.queueAuditIfNeeded(session, result);
            this.emit(
                result.auditQueued ? "milkapp:pending-audit-queued" : "milkapp:pending-issued",
                result
            );
            return result;
        } catch (error) {
            if (error?.code !== "PENDING_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "issue") {
                throw error;
            }
            const result = this.queueStockAdjustment(session, error);
            this.emit("milkapp:pending-stock-queued", result);
            return result;
        }
    }

    async remove(input = {}) {
        const recordId = String(input.recordId || input.id || "").trim();
        if (!recordId) {
            throw new Error("A Pending Milk record id is required.");
        }
        if (this.inFlightDeletes.has(recordId)) {
            const error = new Error("Pending Milk deletion is already in progress.");
            error.code = "PENDING_DELETE_IN_PROGRESS";
            throw error;
        }
        this.inFlightDeletes.add(recordId);
        const session = this.getSession();
        try {
            let result;
            try {
                result = await this.ensurePendingMilkService().remove(session, input);
                result = this.queueAuditIfNeeded(session, result);
                this.emit(
                    result.auditQueued ? "milkapp:pending-audit-queued" : "milkapp:pending-deleted",
                    result
                );
                return result;
            } catch (error) {
                if (error?.code !== "PENDING_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "delete") {
                    throw error;
                }
                result = this.queueStockAdjustment(session, error);
                this.emit("milkapp:pending-stock-queued", result);
                return result;
            }
        } finally {
            this.inFlightDeletes.delete(recordId);
        }
    }

    clear() {
        this.currentWeek = null;
        this.inFlightDeletes.clear();
    }

    emit(name, detail) {
        if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
            window.dispatchEvent(new CustomEvent(name, { detail }));
        }
    }
}

window.PendingMilkManager = new PendingMilkManager();
