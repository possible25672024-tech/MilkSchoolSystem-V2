class AttendanceHistoryManager {
    constructor(
        historyService = window.AttendanceHistoryService,
        authService = window.AuthService
    ) {
        this.historyService = historyService;
        this.authService = authService;
        this.current = null;
        this.loading = false;
        this.error = null;
    }

    ensureHistoryService() {
        if (!this.historyService) {
            this.historyService = window.AttendanceHistoryService;
        }
        if (
            !this.historyService?.loadRange ||
            !this.historyService?.loadEvidence ||
            !this.historyService?.normalizeRange
        ) {
            throw new Error("AttendanceHistoryService is not available.");
        }
        return this.historyService;
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

    getSession() {
        return this.ensureAuthService().getSession();
    }

    async load(input = {}) {
        const service = this.ensureHistoryService();
        const session = this.getSession();
        const range = service.normalizeRange(input);
        const roomId = String(session?.roomId || session?.classId || "").trim();

        this.loading = true;
        this.error = null;
        this.emit("milkapp:attendance-history-loading", {
            roomId,
            startDate: range.startDate,
            endDate: range.endDate,
            requestedDays: range.days
        });

        try {
            const result = await service.loadRange(session, input);
            this.current = result;
            this.loading = false;

            const eventName = result.recordCount
                ? "milkapp:attendance-history-loaded"
                : "milkapp:attendance-history-empty";
            this.emit(eventName, result);
            return result;
        } catch (error) {
            this.loading = false;
            this.error = {
                code: error?.code || "ATTENDANCE_HISTORY_LOAD_FAILED",
                message: error?.message || "Attendance history could not be loaded."
            };
            this.emit("milkapp:attendance-history-error", {
                roomId,
                startDate: range.startDate,
                endDate: range.endDate,
                error: this.error
            });
            throw error;
        }
    }

    async hydrateCurrentEvidence() {
        if (!this.current) {
            throw new Error("Attendance history must be loaded before evidence.");
        }

        const session = this.getSession();
        const dates = this.current.records.map(record => record.date);
        const result = await this.ensureHistoryService().loadEvidence(session, {
            roomId: this.current.roomId,
            startDate: this.current.startDate,
            endDate: this.current.endDate,
            dates
        });
        const evidenceByDate = new Map(result.records.map(record => [record.date, record]));
        this.current = {
            ...this.current,
            records: this.current.records.map(record => {
                const hydrated = evidenceByDate.get(record.date);
                return hydrated ? { ...record, ...hydrated } : record;
            })
        };
        this.emit("milkapp:attendance-evidence-hydrated", {
            roomId: this.current.roomId,
            startDate: this.current.startDate,
            endDate: this.current.endDate,
            recordCount: result.recordCount
        });
        return this.current;
    }

    getSnapshot() {
        return {
            loading: this.loading,
            error: this.error ? { ...this.error } : null,
            current: this.current ? {
                ...this.current,
                records: this.current.records.map(record => ({
                    ...record,
                    data: { ...record.data },
                    notes: { ...record.notes },
                    photos: Array.isArray(record.photos) ? [...record.photos] : undefined,
                    evidence: { ...record.evidence }
                }))
            } : null
        };
    }

    clear() {
        this.current = null;
        this.loading = false;
        this.error = null;
    }

    emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

window.AttendanceHistoryManagerClass = AttendanceHistoryManager;
window.AttendanceHistoryManager = new AttendanceHistoryManager();
