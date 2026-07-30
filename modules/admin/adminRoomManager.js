class AdminRoomManager {
    constructor(
        adminRoomService = window.AdminRoomService,
        authService = window.AuthService,
        loginManager = window.LoginManager,
        syncService = window.SyncService
    ) {
        this.adminRoomService = adminRoomService;
        this.authService = authService;
        this.loginManager = loginManager;
        this.syncService = syncService;
        this.rooms = [];
        this.selectedRoomId = "";
        this.current = null;
    }

    ensureDependencies() {
        this.adminRoomService ||= window.AdminRoomService;
        this.authService ||= window.AuthService;
        this.loginManager ||= window.LoginManager;
        if (!this.adminRoomService?.loadRooms || !this.authService?.getSession) {
            throw new Error("Admin room dependencies are not available.");
        }
    }

    getAdminSession() {
        this.ensureDependencies();
        const session = this.authService.getSession();
        this.adminRoomService.assertAdmin(session);
        return session;
    }

    async loadRooms(options = {}) {
        this.rooms = await this.adminRoomService.loadRooms(this.getAdminSession(), options);
        if (!this.rooms.some(room => room.id === this.selectedRoomId)) {
            this.selectedRoomId = this.rooms[0]?.id || "";
        }
        return this.rooms;
    }

    async selectRoom(roomId) {
        this.selectedRoomId = String(roomId || "").trim();
        if (!this.selectedRoomId) {
            this.current = null;
            return null;
        }
        this.current = await this.adminRoomService.loadRoomDashboard(
            this.getAdminSession(),
            this.selectedRoomId
        );
        return this.current;
    }

    refresh() {
        return this.selectRoom(this.selectedRoomId);
    }

    async enterSelectedRoom(options = {}) {
        if (!this.current || this.current.room.id !== this.selectedRoomId) {
            await this.refresh();
        }
        this.adminRoomService.assertDelegationAllowed(this.selectedRoomId);
        const adminSession = this.getAdminSession();
        const delegated = this.current.delegatedSession;
        this.authService.saveParentAdminSession?.(adminSession);
        this.authService.saveSession(delegated);
        this.loginManager.currentUser = delegated;
        this.loginManager.renderAuthenticated(delegated);
        window.dispatchEvent(new CustomEvent("milkapp:login-success", {
            detail: { session: delegated }
        }));
        if (options.attendanceDate) {
            window.dispatchEvent(new CustomEvent("milkapp:attendance-history-edit-requested", {
                detail: { date: String(options.attendanceDate) }
            }));
        }
        return delegated;
    }

    restoreAdmin() {
        const parent = this.authService.getParentAdminSession?.();
        if (!parent?.isAdmin || parent.role !== "admin") {
            throw new Error("ไม่พบ session ผู้ดูแลระบบ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่");
        }
        this.authService.saveSession(parent);
        this.authService.clearParentAdminSession?.();
        this.loginManager.currentUser = parent;
        this.loginManager.renderAuthenticated(parent);
        window.dispatchEvent(new CustomEvent("milkapp:login-success", {
            detail: { session: parent }
        }));
        return parent;
    }

    async deleteRecord(type, input = {}) {
        let result;
        try {
            result = await this.adminRoomService.deleteRecord(
                this.getAdminSession(),
                this.selectedRoomId,
                type,
                input
            );
            result = this.queueAuditIfNeeded(result);
        } catch (error) {
            if (!error?.details?.difference || error?.details?.operation !== "delete") {
                throw error;
            }
            result = this.queueStockAdjustment(error);
        }
        await this.refresh();
        return result;
    }

    async loadAttendanceEditor(date) {
        return this.adminRoomService.loadAttendanceEditor(
            this.getAdminSession(),
            this.selectedRoomId,
            date
        );
    }

    async saveAttendanceEditor(input = {}) {
        let result;
        try {
            result = await this.adminRoomService.saveAttendanceEditor(
                this.getAdminSession(),
                this.selectedRoomId,
                input
            );
            result = this.queueAuditIfNeeded(result);
        } catch (error) {
            if (
                error?.code !== "ROOM_STOCK_ADJUSTMENT_REQUIRED" ||
                error?.details?.operation !== "save"
            ) {
                throw error;
            }
            result = this.queueStockAdjustment(error);
        }
        await this.refresh();
        return result;
    }

    delegatedSession() {
        const session = this.current?.delegatedSession;
        if (!session?.roomId || session.roomId !== this.selectedRoomId) {
            throw new Error("Admin room context is not ready.");
        }
        return session;
    }

    ensureSyncService() {
        this.syncService ||= window.SyncService;
        if (!this.syncService?.queueRoomStockAdjustment) {
            throw new Error("SyncService is not available for Admin recovery.");
        }
        return this.syncService;
    }

    queueStockAdjustment(error) {
        const details = error.details || {};
        const entry = this.ensureSyncService().queueRoomStockAdjustment(
            this.delegatedSession(),
            {
                roomId: details.roomId,
                difference: details.difference,
                referenceId: details.referenceId,
                roomName: details.roomName,
                date: details.date,
                operationType: details.operationType,
                key: `stockadj_${details.referenceId}`
            }
        );
        return {
            ...details,
            queueEntry: entry,
            stockQueued: true,
            mainStockDelta: 0
        };
    }

    queueAuditIfNeeded(result) {
        if (result?.audit?.ok !== false || (!result?.ledger?.id && !result?.stockLog?.id)) {
            return result;
        }
        const syncService = this.ensureSyncService();
        if (!syncService.queueAttendanceAudit) {
            throw new Error("SyncService cannot queue Admin audit recovery.");
        }
        const entry = syncService.queueAttendanceAudit(this.delegatedSession(), {
            roomId: result.roomId,
            referenceId: result.referenceId || result.id,
            ledger: result.ledger,
            stockLog: result.stockLog,
            key: `audit_${result.ledger?.id || result.stockLog?.id}`
        });
        return {
            ...result,
            auditQueued: true,
            auditQueueEntry: entry,
            mainStockDelta: 0
        };
    }

    async updateRecordNote(type, input = {}) {
        const result = await this.adminRoomService.updateRecordNote(
            this.getAdminSession(),
            this.selectedRoomId,
            type,
            input
        );
        await this.refresh();
        return result;
    }

    clear() {
        this.rooms = [];
        this.selectedRoomId = "";
        this.current = null;
    }
}

window.AdminRoomManager = new AdminRoomManager();
