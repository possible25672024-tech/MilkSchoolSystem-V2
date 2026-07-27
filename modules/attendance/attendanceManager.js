class AttendanceManager {
    constructor(
        attendanceService = window.AttendanceService,
        authService = window.AuthService,
        syncService = window.SyncService
    ) {
        this.attendanceService = attendanceService;
        this.authService = authService;
        this.syncService = syncService;
        this.currentDay = null;
        this.history = {};
    }

    ensureAttendanceService() {
        if (!this.attendanceService) {
            this.attendanceService = window.AttendanceService;
        }

        if (!this.attendanceService?.saveAttendance) {
            throw new Error("AttendanceService is not available.");
        }

        return this.attendanceService;
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

    ensureSyncService() {
        if (!this.syncService) {
            this.syncService = window.SyncService;
        }

        if (!this.syncService?.queueRoomStockAdjustment) {
            throw new Error("SyncService is not available for Room Stock retry.");
        }

        return this.syncService;
    }

    getSession() {
        const session = this.ensureAuthService().getSession();
        this.ensureAttendanceService().assertRoomAccess(session);
        return session;
    }

    async loadDay(date) {
        const session = this.getSession();
        this.currentDay = await this.ensureAttendanceService().loadDay(session, date);
        this.emit("milkapp:attendance-day-loaded", {
            date,
            record: this.currentDay
        });
        return this.currentDay;
    }

    async loadHistory() {
        const session = this.getSession();
        this.history = await this.ensureAttendanceService().loadHistory(session);
        this.emit("milkapp:attendance-history-loaded", {
            records: this.history
        });
        return this.history;
    }

    queueStockAdjustment(session, error) {
        const details = error?.details || {};
        const queueEntry = this.ensureSyncService().queueRoomStockAdjustment(session, {
            roomId: details.roomId,
            difference: details.difference,
            referenceId: details.referenceId,
            roomName: details.roomName,
            date: details.date,
            key: `stockadj_${details.referenceId}`
        });

        return {
            ...details,
            queueEntry,
            stockQueued: true,
            mainStockDelta: 0
        };
    }

    async save(input = {}) {
        const session = this.getSession();

        try {
            const result = await this.ensureAttendanceService().saveAttendance(session, input);
            this.currentDay = result.record;
            this.history = {
                ...this.history,
                [result.key]: result.record
            };
            this.emit("milkapp:attendance-saved", result);
            return result;
        } catch (error) {
            if (error?.code !== "ROOM_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "save") {
                throw error;
            }

            const result = this.queueStockAdjustment(session, error);
            this.currentDay = result.record;
            this.history = {
                ...this.history,
                [result.key]: result.record
            };
            this.emit("milkapp:attendance-stock-queued", result);
            return result;
        }
    }

    async remove(input = {}) {
        const session = this.getSession();

        try {
            const result = await this.ensureAttendanceService().deleteAttendance(session, input);
            this.currentDay = null;
            const nextHistory = { ...this.history };
            delete nextHistory[result.key];
            this.history = nextHistory;
            this.emit("milkapp:attendance-deleted", result);
            return result;
        } catch (error) {
            if (error?.code !== "ROOM_STOCK_ADJUSTMENT_REQUIRED" || error?.details?.operation !== "delete") {
                throw error;
            }

            const result = this.queueStockAdjustment(session, error);
            this.currentDay = null;
            const nextHistory = { ...this.history };
            delete nextHistory[result.key];
            this.history = nextHistory;
            this.emit("milkapp:attendance-stock-queued", result);
            return result;
        }
    }

    clear() {
        this.currentDay = null;
        this.history = {};
    }

    emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

window.AttendanceManager = new AttendanceManager();
