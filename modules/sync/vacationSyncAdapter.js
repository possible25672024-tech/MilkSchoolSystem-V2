class VacationSyncAdapter {
    constructor(options = {}) {
        this.window = options.window || window;
        this.installed = false;
    }

    install() {
        const queueStorage = this.window.QueueStorage;
        const syncService = this.window.SyncService;
        const syncManager = this.window.SyncManager;
        const syncView = this.window.SyncView;

        this.patchQueueStorage(queueStorage);
        this.patchSyncService(syncService);
        this.patchSyncManager(syncManager);
        this.patchSyncView(syncView);

        this.installed = Boolean(queueStorage && syncService && syncManager);
        return this.getStatus();
    }

    patchQueueStorage(queueStorage) {
        if (!queueStorage?.operationType || queueStorage.__vacationOperationTypePatched) {
            return queueStorage;
        }
        const original = queueStorage.operationType.bind(queueStorage);
        queueStorage.operationType = value => {
            const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
            return normalized === "VACATION" ? "VACATION" : original(value);
        };
        queueStorage.__vacationOperationTypePatched = true;
        return queueStorage;
    }

    patchSyncService(syncService) {
        if (!syncService || syncService.__vacationOperationTypePatched) {
            return syncService;
        }

        const originalNormalize = syncService.normalizeOperationType.bind(syncService);
        const originalNote = syncService.defaultStockNote.bind(syncService);
        const originalReplay = syncService.replayTypedRoomStockAdjustment.bind(syncService);

        syncService.normalizeOperationType = value => {
            const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
            return normalized === "VACATION" ? "VACATION" : originalNormalize(value);
        };

        syncService.defaultStockNote = (operationType, difference) => {
            const normalized = syncService.normalizeOperationType(operationType);
            if (normalized === "VACATION") {
                return "หักสต็อกจากการจ่ายนมช่วงปิดเทอม (ซิงก์ค้าง)";
            }
            return originalNote(operationType, difference);
        };

        syncService.replayTypedRoomStockAdjustment = async function(session, entry) {
            const operationType = this.normalizeOperationType(entry?.operationType);
            if (operationType !== "VACATION") {
                return originalReplay(session, entry);
            }

            const difference = Number(entry?.difference);
            if (!Number.isFinite(difference) || difference <= 0) {
                throw new Error("Vacation Milk retry requires a positive Room Stock deduction.");
            }

            const service = this.ensureTypedStockService();
            const stockResult = await service.atomicRoomStockDifference(entry.roomId, difference);
            const referenceId = String(entry.referenceId || "").trim();
            const note = String(
                entry.note || this.defaultStockNote(operationType, difference)
            ).trim();
            const ledger = service.buildLedgerEntry({
                roomId: entry.roomId,
                type: "VACATION",
                quantity: -difference,
                stockBefore: stockResult.roomStockBefore,
                stockAfter: stockResult.roomStockAfter,
                referenceId,
                user: session?.teacher || entry.roomName || "teacher"
            });
            const stockLog = service.buildStockLog({
                type: "OUT",
                roomId: entry.roomId,
                roomName: String(entry.roomName || session?.roomName || entry.roomId),
                date: String(entry.date || ""),
                quantity: difference,
                balanceAfter: stockResult.roomStockAfter,
                note
            });
            const audit = await service.writeAuditWithRetry(ledger, stockLog);

            return {
                roomId: entry.roomId,
                difference,
                operationType: "VACATION",
                note,
                referenceId,
                roomStockBefore: stockResult.roomStockBefore,
                roomStockAfter: stockResult.roomStockAfter,
                stockAttempts: stockResult.attempts,
                stockConflictCount: stockResult.conflictCount,
                ledger,
                stockLog,
                audit,
                mainStockDelta: 0
            };
        };

        syncService.__vacationOperationTypePatched = true;
        return syncService;
    }

    patchSyncManager(syncManager) {
        if (!syncManager?.operationType || syncManager.__vacationOperationTypePatched) {
            return syncManager;
        }
        const original = syncManager.operationType.bind(syncManager);
        syncManager.operationType = value => {
            const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
            return normalized === "VACATION" ? "VACATION" : original(value);
        };
        syncManager.__vacationOperationTypePatched = true;
        return syncManager;
    }

    patchSyncView(syncView) {
        if (!syncView?.typeLabel || syncView.__vacationOperationTypePatched) {
            return syncView;
        }
        const original = syncView.typeLabel.bind(syncView);
        syncView.typeLabel = (type, operationType = "ATTENDANCE") => {
            const normalized = String(operationType || "ATTENDANCE").trim().toUpperCase();
            if (String(type || "") === "roomStockAdjust" && normalized === "VACATION") {
                return "หักสต็อกนมช่วงปิดเทอมที่รอซิงก์";
            }
            return original(type, operationType);
        };
        syncView.__vacationOperationTypePatched = true;
        return syncView;
    }

    getStatus() {
        return {
            installed: this.installed,
            queueStorage: Boolean(this.window.QueueStorage?.__vacationOperationTypePatched),
            syncService: Boolean(this.window.SyncService?.__vacationOperationTypePatched),
            syncManager: Boolean(this.window.SyncManager?.__vacationOperationTypePatched),
            syncView: Boolean(this.window.SyncView?.__vacationOperationTypePatched)
        };
    }
}

window.VacationSyncAdapter = new VacationSyncAdapter();
window.VacationSyncAdapter.install();
