class SyncManager {
    constructor(
        syncService = window.SyncService,
        authService = window.AuthService,
        options = {}
    ) {
        this.syncService = syncService;
        this.authService = authService;
        this.eventTarget = options.eventTarget || window;
        this.network = options.network || window.navigator;
        this.setTimeoutFn = options.setTimeoutFn || window.setTimeout.bind(window);
        this.clearTimeoutFn = options.clearTimeoutFn || window.clearTimeout.bind(window);
        this.setIntervalFn = options.setIntervalFn || window.setInterval.bind(window);
        this.clearIntervalFn = options.clearIntervalFn || window.clearInterval.bind(window);
        this.periodicIntervalMs = options.periodicIntervalMs || 60000;
        this.retryTimer = null;
        this.periodicTimer = null;
        this.flushPromise = null;
        this.started = false;
        this.lastSummary = null;
        this.lastSyncedAt = null;
        this.readOnlyMode = Boolean(
            window.APP_CONFIG?.legacyReadOnly === true ||
            window.APP_CONFIG?.mode === "LEGACY_READ_ONLY" ||
            window.APP_CONFIG?.mode === "OFFLINE_READ_ONLY"
        );
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);
    }

    ensureSyncService() {
        if (!this.syncService) {
            this.syncService = window.SyncService;
        }

        if (!this.syncService?.flush || !this.syncService?.getStatus) {
            throw new Error("SyncService is not available.");
        }

        return this.syncService;
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
        const session = this.ensureAuthService().getSession();
        if (!session) {
            throw new Error("An authenticated teacher session is required for queue sync.");
        }
        return session;
    }

    isOnline() {
        return this.network?.onLine !== false;
    }

    start() {
        if (this.started) {
            return this.getStatus();
        }

        this.started = true;
        this.eventTarget.addEventListener?.("online", this.handleOnline);
        this.eventTarget.addEventListener?.("offline", this.handleOffline);
        this.periodicTimer = this.setIntervalFn(() => {
            if (this.isOnline() && !this.readOnlyMode) {
                this.flushNow("periodic");
            }
        }, this.periodicIntervalMs);
        this.emitQueueCount();

        if (!this.readOnlyMode && this.isOnline() && this.ensureSyncService().getStatus().count > 0) {
            this.flushNow("startup");
        }

        return this.getStatus();
    }

    stop() {
        this.started = false;
        this.eventTarget.removeEventListener?.("online", this.handleOnline);
        this.eventTarget.removeEventListener?.("offline", this.handleOffline);

        if (this.retryTimer !== null) {
            this.clearTimeoutFn(this.retryTimer);
            this.retryTimer = null;
        }

        if (this.periodicTimer !== null) {
            this.clearIntervalFn(this.periodicTimer);
            this.periodicTimer = null;
        }

        return this.getStatus();
    }

    handleOnline() {
        this.emit("milkapp:sync-online", this.getStatus());
        return this.flushNow("reconnect");
    }

    handleOffline() {
        this.emit("milkapp:sync-offline", this.getStatus());
    }

    queueAttendance(input = {}) {
        if (this.readOnlyMode) {
            throw new Error("Queue attendance is disabled in legacy read-only mode.");
        }

        const entry = this.ensureSyncService().queueAttendance(this.getSession(), input);
        this.emitQueueCount();
        if (this.isOnline()) {
            this.scheduleRetry(0);
        }
        return entry;
    }

    queueRoomStockAdjustment(input = {}) {
        if (this.readOnlyMode) {
            throw new Error("Queue room stock adjustment is disabled in legacy read-only mode.");
        }

        const entry = this.ensureSyncService().queueRoomStockAdjustment(this.getSession(), input);
        this.emitQueueCount();
        if (this.isOnline()) {
            this.scheduleRetry(0);
        }
        return entry;
    }

    flushNow(reason = "manual") {
        if (this.readOnlyMode) {
            const summary = {
                processed: 0,
                succeeded: 0,
                failed: 0,
                deferred: 0,
                remaining: this.ensureSyncService().getStatus().count,
                results: [],
                nextRetryDelay: 0,
                mainStockDelta: 0,
                skipped: "read-only",
                reason
            };
            this.lastSummary = summary;
            this.emit("milkapp:sync-failed", summary);
            return Promise.resolve(summary);
        }

        if (!this.isOnline()) {
            const summary = {
                processed: 0,
                succeeded: 0,
                failed: 0,
                deferred: 0,
                remaining: this.ensureSyncService().getStatus().count,
                results: [],
                nextRetryDelay: 0,
                mainStockDelta: 0,
                skipped: "offline",
                reason
            };
            this.lastSummary = summary;
            this.emit("milkapp:sync-failed", summary);
            return Promise.resolve(summary);
        }

        if (this.flushPromise) {
            return this.flushPromise;
        }

        const run = this.ensureSyncService()
            .flush(this.getSession())
            .then(summary => {
                const completed = { ...summary, reason };
                this.lastSummary = completed;
                if (summary.succeeded > 0) {
                    this.lastSyncedAt = new Date().toISOString();
                }
                this.emitQueueCount();
                this.emit("milkapp:sync-completed", completed);

                if (summary.failed > 0 && summary.nextRetryDelay > 0) {
                    this.scheduleRetry(summary.nextRetryDelay);
                }

                return completed;
            })
            .catch(error => {
                const failed = {
                    processed: 0,
                    succeeded: 0,
                    failed: 1,
                    deferred: 0,
                    remaining: this.ensureSyncService().getStatus().count,
                    results: [],
                    nextRetryDelay: 5000,
                    mainStockDelta: 0,
                    reason,
                    error: {
                        code: error?.code || "SYNC_FLUSH_FAILED",
                        message: error?.message || "Queue flush failed."
                    }
                };
                this.lastSummary = failed;
                this.emit("milkapp:sync-failed", failed);
                this.scheduleRetry(failed.nextRetryDelay);
                return failed;
            })
            .finally(() => {
                this.flushPromise = null;
            });

        this.flushPromise = run;
        this.emit("milkapp:sync-started", {
            reason,
            status: this.getStatus()
        });
        return this.flushPromise;
    }

    scheduleRetry(delayMs) {
        if (this.retryTimer !== null) {
            this.clearTimeoutFn(this.retryTimer);
        }

        const delay = Math.max(0, Number(delayMs) || 0);
        this.retryTimer = this.setTimeoutFn(() => {
            this.retryTimer = null;
            if (this.isOnline()) {
                this.flushNow("retry");
            }
        }, delay);

        return delay;
    }

    getStatus() {
        const queueStatus = this.ensureSyncService().getStatus();
        return {
            started: this.started,
            online: this.isOnline(),
            flushing: Boolean(this.flushPromise),
            queueCount: queueStatus.count,
            maxAttempts: queueStatus.maxAttempts,
            queueItems: this.summarizeQueueEntries(queueStatus.entries || []),
            lastSyncedAt: this.lastSyncedAt,
            lastSummary: this.lastSummary
        };
    }

    summarizeQueueEntries(entries = []) {
        const resultByKey = new Map();
        for (const result of this.lastSummary?.results || []) {
            if (result?.key) {
                resultByKey.set(String(result.key), result);
            }
            if (result?.convertedTo?.key) {
                resultByKey.set(String(result.convertedTo.key), {
                    ...result,
                    key: result.convertedTo.key,
                    status: "deferred"
                });
            }
        }

        return entries.map(entry => {
            const key = String(entry?.key || "");
            const result = resultByKey.get(key) || null;
            const record = entry?.record && typeof entry.record === "object"
                ? entry.record
                : {};
            const attempts = this.nonNegativeInteger(entry?.attempts);
            const type = ["attendance", "roomStockAdjust", "attendanceAudit"].includes(entry?.type)
                ? entry.type
                : "unknown";
            const operationType = this.operationType(entry?.operationType);

            return {
                key,
                type,
                operationType,
                note: String(entry?.note || ""),
                roomId: String(entry?.roomId || record.clsId || record.roomId || ""),
                roomName: String(entry?.roomName || record.roomName || ""),
                date: String(entry?.date || record.date || this.dateFromAttendanceKey(key)),
                referenceId: String(entry?.referenceId || (type === "attendance" ? key : "")),
                attempts,
                queuedAt: this.timestampOrZero(entry?.queuedAt),
                nextRetryAt: this.timestampOrZero(entry?.nextRetryAt),
                status: String(result?.status || (attempts > 0 ? "failed" : "pending")),
                error: result?.error
                    ? {
                        code: String(result.error.code || "SYNC_REPLAY_FAILED"),
                        message: String(result.error.message || "Queue replay failed.")
                    }
                    : null
            };
        });
    }

    operationType(value) {
        const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
        return ["ATTENDANCE", "PENDING", "ROLLBACK"].includes(normalized)
            ? normalized
            : "ATTENDANCE";
    }

    dateFromAttendanceKey(key) {
        const match = String(key || "").match(/_(\d{4}-\d{2}-\d{2})$/);
        return match ? match[1] : "";
    }

    nonNegativeInteger(value, fallback = 0) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : fallback;
    }

    timestampOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : 0;
    }

    emitQueueCount() {
        const status = this.getStatus();
        this.emit("milkapp:sync-queue-count", status);
        return status.queueCount;
    }

    emit(name, detail) {
        this.eventTarget.dispatchEvent?.(new CustomEvent(name, { detail }));
    }
}

window.SyncManager = new SyncManager();
