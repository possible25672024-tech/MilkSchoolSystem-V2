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
            if (this.isOnline()) {
                this.flushNow("periodic");
            }
        }, this.periodicIntervalMs);
        this.emitQueueCount();

        if (this.isOnline() && this.ensureSyncService().getStatus().count > 0) {
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
        const entry = this.ensureSyncService().queueAttendance(this.getSession(), input);
        this.emitQueueCount();
        if (this.isOnline()) {
            this.scheduleRetry(0);
        }
        return entry;
    }

    queueRoomStockAdjustment(input = {}) {
        const entry = this.ensureSyncService().queueRoomStockAdjustment(this.getSession(), input);
        this.emitQueueCount();
        if (this.isOnline()) {
            this.scheduleRetry(0);
        }
        return entry;
    }

    flushNow(reason = "manual") {
        if (!this.isOnline()) {
            const summary = {
                processed: 0,
                succeeded: 0,
                failed: 0,
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

        this.emit("milkapp:sync-started", {
            reason,
            status: this.getStatus()
        });

        this.flushPromise = this.ensureSyncService()
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
            lastSyncedAt: this.lastSyncedAt,
            lastSummary: this.lastSummary
        };
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
