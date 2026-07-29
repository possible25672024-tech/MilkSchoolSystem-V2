class SyncService {
    constructor(
        queueStorage = window.QueueStorage,
        attendanceService = window.AttendanceService,
        teacherService = window.TeacherService,
        options = {}
    ) {
        this.queueStorage = queueStorage;
        this.attendanceService = attendanceService;
        this.teacherService = teacherService;
        this.attendanceRepository = options.attendanceRepository || window.AttendanceRepository;
        this.clock = options.clock || (() => Date.now());
        this.backoffSteps = options.backoffSteps || [5000, 10000, 20000, 40000, 60000];
    }

    ensureQueueStorage() {
        if (!this.queueStorage) {
            this.queueStorage = window.QueueStorage;
        }

        if (!this.queueStorage?.snapshot || !this.queueStorage?.upsert) {
            throw new Error("QueueStorage is not available.");
        }

        return this.queueStorage;
    }

    ensureAttendanceService() {
        if (!this.attendanceService) {
            this.attendanceService = window.AttendanceService;
        }

        if (!this.attendanceService?.saveAttendance || !this.attendanceService?.adjustRoomStock) {
            throw new Error("AttendanceService is not available.");
        }

        return this.attendanceService;
    }

    ensureTypedStockService() {
        const service = this.ensureAttendanceService();
        const required = [
            "atomicRoomStockDifference",
            "buildLedgerEntry",
            "buildStockLog",
            "writeAuditWithRetry"
        ];
        const missing = required.find(method => !service?.[method]);
        if (missing) {
            throw new Error(`AttendanceService shared stock method ${missing} is not available.`);
        }
        return service;
    }

    ensureAttendanceRepository() {
        if (!this.attendanceRepository) {
            this.attendanceRepository = window.AttendanceRepository;
        }

        if (!this.attendanceRepository?.appendAttendanceAudit) {
            throw new Error("AttendanceRepository is not available for audit recovery.");
        }

        return this.attendanceRepository;
    }

    ensureTeacherService() {
        if (!this.teacherService) {
            this.teacherService = window.TeacherService;
        }

        if (!this.teacherService?.assertRoomAccess) {
            throw new Error("TeacherService is not available.");
        }

        return this.teacherService;
    }

    assertRoomAccess(session, roomId) {
        return this.ensureTeacherService().assertRoomAccess(session, roomId);
    }

    queueAttendance(session, input = {}) {
        const record = input.record || input.rec;
        const roomId = String(
            input.roomId ||
            record?.roomId ||
            record?.classId ||
            record?.clsId ||
            this.roomIdFromAttendanceKey(input.key)
        ).trim();
        this.assertRoomAccess(session, roomId);

        const key = String(input.key || "").trim();
        if (!key || !record || typeof record !== "object") {
            throw new Error("A valid queued attendance record is required.");
        }

        return this.ensureQueueStorage().upsert({
            type: "attendance",
            key,
            roomId,
            record,
            baselinePresent: this.nonNegativeInteger(input.baselinePresent),
            queuedAt: this.timestamp(input.queuedAt),
            attempts: this.nonNegativeInteger(input.attempts),
            nextRetryAt: this.timestamp(input.nextRetryAt, 0)
        });
    }

    queueRoomStockAdjustment(session, input = {}) {
        const roomId = String(input.roomId || "").trim();
        this.assertRoomAccess(session, roomId);
        const difference = Number(input.difference ?? input.diff);

        if (!Number.isFinite(difference) || difference === 0) {
            throw new Error("A non-zero Room Stock difference is required.");
        }

        const referenceId = String(input.referenceId || "").trim();
        const key = String(input.key || `stockadj_${referenceId}`).trim();
        if (!key) {
            throw new Error("A queue key is required for Room Stock adjustment.");
        }

        const operationType = this.normalizeOperationType(input.operationType);
        return this.ensureQueueStorage().upsert({
            type: "roomStockAdjust",
            key,
            roomId,
            difference,
            referenceId,
            roomName: String(input.roomName || session?.roomName || ""),
            date: String(input.date || ""),
            operationType,
            note: String(input.note || this.defaultStockNote(operationType, difference)).trim(),
            queuedAt: this.timestamp(input.queuedAt),
            attempts: this.nonNegativeInteger(input.attempts),
            nextRetryAt: this.timestamp(input.nextRetryAt, 0)
        });
    }

    queueAttendanceAudit(session, input = {}) {
        const ledger = input.ledger && typeof input.ledger === "object"
            ? { ...input.ledger }
            : null;
        const stockLog = input.stockLog && typeof input.stockLog === "object"
            ? { ...input.stockLog }
            : null;
        const roomId = String(
            input.roomId || ledger?.roomId || stockLog?.roomId || ""
        ).trim();
        this.assertRoomAccess(session, roomId);

        if (!ledger?.id && !stockLog?.id) {
            throw new Error("A valid attendance audit payload is required.");
        }

        const referenceId = String(
            input.referenceId || ledger?.referenceId || ""
        ).trim();
        const auditId = String(ledger?.id || stockLog?.id || referenceId).trim();
        const key = String(input.key || `audit_${auditId}`).trim();
        if (!key) {
            throw new Error("An audit queue key is required.");
        }

        return this.ensureQueueStorage().upsert({
            type: "attendanceAudit",
            key,
            roomId,
            ledger,
            stockLog,
            referenceId,
            queuedAt: this.timestamp(input.queuedAt),
            attempts: this.nonNegativeInteger(input.attempts),
            nextRetryAt: this.timestamp(input.nextRetryAt, 0)
        });
    }

    async replayEntry(session, entry) {
        this.assertRoomAccess(session, entry.roomId);
        const attendanceService = this.ensureAttendanceService();

        if (entry.type === "attendance") {
            return attendanceService.saveAttendance(session, {
                ...entry.record,
                roomId: entry.roomId,
                baselinePresent: entry.baselinePresent
            });
        }

        if (entry.type === "roomStockAdjust") {
            const operationType = this.normalizeOperationType(entry.operationType);
            if (operationType === "ATTENDANCE") {
                return attendanceService.adjustRoomStock(session, {
                    roomId: entry.roomId,
                    difference: entry.difference,
                    referenceId: entry.referenceId,
                    roomName: entry.roomName,
                    date: entry.date
                });
            }
            return this.replayTypedRoomStockAdjustment(session, entry);
        }

        if (entry.type === "attendanceAudit") {
            await this.ensureAttendanceRepository().appendAttendanceAudit(
                entry.ledger,
                entry.stockLog
            );
            return {
                roomId: entry.roomId,
                referenceId: entry.referenceId,
                ledger: entry.ledger,
                stockLog: entry.stockLog,
                audit: { ok: true, attempts: 1, error: null },
                mainStockDelta: 0
            };
        }

        throw new Error(`Unsupported queue entry type: ${entry.type}`);
    }

    async replayTypedRoomStockAdjustment(session, entry) {
        const service = this.ensureTypedStockService();
        const operationType = this.normalizeOperationType(entry.operationType);
        if (operationType !== "PENDING" && operationType !== "ROLLBACK") {
            throw new Error(`Unsupported typed Room Stock operation: ${operationType}`);
        }

        const difference = Number(entry.difference);
        const stockResult = await service.atomicRoomStockDifference(entry.roomId, difference);
        const referenceId = String(entry.referenceId || "").trim();
        const note = String(
            entry.note || this.defaultStockNote(operationType, difference)
        ).trim();
        const ledger = service.buildLedgerEntry({
            roomId: entry.roomId,
            type: operationType,
            quantity: -difference,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId,
            user: session?.teacher || entry.roomName || "teacher"
        });
        const stockLog = service.buildStockLog({
            type: difference > 0 ? "OUT" : "IN",
            roomId: entry.roomId,
            roomName: String(entry.roomName || session?.roomName || entry.roomId),
            date: String(entry.date || ""),
            quantity: Math.abs(difference),
            balanceAfter: stockResult.roomStockAfter,
            note
        });
        const audit = await service.writeAuditWithRetry(ledger, stockLog);

        return {
            roomId: entry.roomId,
            difference,
            operationType,
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
    }

    convertAttendanceToStockAdjustment(session, entry, error, attempts) {
        const details = error?.details || {};
        const storage = this.ensureQueueStorage();
        const referenceId = String(details.referenceId || entry.key || "").trim();
        const converted = {
            type: "roomStockAdjust",
            key: `stockadj_${referenceId}`,
            roomId: details.roomId || entry.roomId,
            difference: details.difference,
            referenceId,
            roomName: details.roomName || entry.record?.roomName || session?.roomName || "",
            date: details.date || entry.record?.date || "",
            operationType: "ATTENDANCE",
            note: this.defaultStockNote("ATTENDANCE", details.difference),
            queuedAt: entry.queuedAt,
            attempts,
            nextRetryAt: this.clock() + this.backoffForAttempts(attempts)
        };
        const next = storage.snapshot().filter(item => item.key !== entry.key);
        next.push(converted);
        storage.replace(next);
        return converted;
    }

    convertResultToAuditEntry(session, entry, value, attempts) {
        const storage = this.ensureQueueStorage();
        const ledger = value?.ledger || null;
        const stockLog = value?.stockLog || null;
        const roomId = String(
            value?.roomId || ledger?.roomId || stockLog?.roomId || entry.roomId || ""
        ).trim();
        const referenceId = String(
            value?.referenceId || ledger?.referenceId || entry.referenceId || entry.key || ""
        ).trim();
        const auditId = String(ledger?.id || stockLog?.id || referenceId).trim();
        const converted = {
            type: "attendanceAudit",
            key: `audit_${auditId}`,
            roomId,
            ledger,
            stockLog,
            referenceId,
            queuedAt: entry.queuedAt,
            attempts,
            nextRetryAt: this.clock() + this.backoffForAttempts(attempts)
        };
        const next = storage.snapshot().filter(item => item.key !== entry.key);
        next.push(converted);
        storage.replace(next);
        return converted;
    }

    hasPendingAudit(value) {
        return value?.audit?.ok === false && Boolean(value?.ledger?.id || value?.stockLog?.id);
    }

    async flush(session) {
        this.ensureTeacherService().assertRoomAccess(session);
        const storage = this.ensureQueueStorage();
        const entries = storage.snapshot();
        const results = [];
        let maxFailedAttempts = 0;

        for (const entry of entries) {
            try {
                const value = await this.replayEntry(session, entry);

                if (this.hasPendingAudit(value)) {
                    const attempts = this.nonNegativeInteger(entry.attempts) + 1;
                    maxFailedAttempts = Math.max(maxFailedAttempts, attempts);
                    const converted = this.convertResultToAuditEntry(
                        session,
                        entry,
                        value,
                        attempts
                    );
                    results.push({
                        key: entry.key,
                        type: entry.type,
                        status: "deferred",
                        attempts,
                        convertedTo: converted,
                        error: value.audit.error || {
                            code: "ATTENDANCE_AUDIT_WRITE_FAILED",
                            message: "Attendance audit write failed."
                        }
                    });
                    continue;
                }

                storage.remove(entry.key);
                results.push({
                    key: entry.key,
                    type: entry.type,
                    status: "success",
                    value
                });
            } catch (error) {
                const attempts = this.nonNegativeInteger(entry.attempts) + 1;
                const retryDelay = this.backoffForAttempts(attempts);
                maxFailedAttempts = Math.max(maxFailedAttempts, attempts);

                if (
                    entry.type === "attendance" &&
                    error?.code === "ROOM_STOCK_ADJUSTMENT_REQUIRED" &&
                    error?.details?.attendanceSaved === true
                ) {
                    const converted = this.convertAttendanceToStockAdjustment(
                        session,
                        entry,
                        error,
                        attempts
                    );
                    results.push({
                        key: entry.key,
                        type: entry.type,
                        status: "deferred",
                        attempts,
                        convertedTo: converted,
                        error: {
                            code: error.code,
                            message: error.message
                        }
                    });
                    continue;
                }

                this.updateFailedEntry({
                    ...entry,
                    attempts,
                    nextRetryAt: this.clock() + retryDelay
                });
                results.push({
                    key: entry.key,
                    type: entry.type,
                    status: "failed",
                    attempts,
                    error: {
                        code: error?.code || "SYNC_REPLAY_FAILED",
                        message: error?.message || "Queue replay failed."
                    }
                });
            }
        }

        const failed = results.filter(result => result.status === "failed");
        const deferred = results.filter(result => result.status === "deferred");
        const succeeded = results.filter(result => result.status === "success");
        const pending = failed.length + deferred.length;

        return {
            processed: results.length,
            succeeded: succeeded.length,
            failed: pending,
            deferred: deferred.length,
            remaining: storage.count(),
            results,
            nextRetryDelay: pending ? this.backoffForAttempts(maxFailedAttempts) : 0,
            mainStockDelta: 0
        };
    }

    updateFailedEntry(updatedEntry) {
        const storage = this.ensureQueueStorage();
        const next = storage.snapshot().map(entry =>
            entry.key === updatedEntry.key ? updatedEntry : entry
        );
        storage.replace(next);
        return updatedEntry;
    }

    normalizeOperationType(value) {
        const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
        return ["ATTENDANCE", "PENDING", "ROLLBACK"].includes(normalized)
            ? normalized
            : "ATTENDANCE";
    }

    defaultStockNote(operationType, difference) {
        const normalized = this.normalizeOperationType(operationType);
        if (normalized === "PENDING") {
            return "หักสต็อกจากการจ่ายนมค้าง (ซิงก์ค้าง)";
        }
        if (normalized === "ROLLBACK") {
            return "คืนสต็อกจากการลบรายการนมค้าง (ซิงก์ค้าง)";
        }
        return Number(difference) > 0
            ? "หักสต็อกจากการเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)"
            : "คืนสต็อกจากการแก้ไขเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)";
    }

    backoffForAttempts(attempts) {
        const normalized = Math.max(1, this.nonNegativeInteger(attempts, 1));
        return this.backoffSteps[Math.min(normalized - 1, this.backoffSteps.length - 1)];
    }

    getStatus() {
        const queue = this.ensureQueueStorage().snapshot();
        return {
            count: queue.length,
            entries: queue,
            maxAttempts: queue.reduce(
                (maximum, entry) => Math.max(maximum, this.nonNegativeInteger(entry.attempts)),
                0
            )
        };
    }

    roomIdFromAttendanceKey(key) {
        const match = String(key || "").match(/^(.*)_\d{4}-\d{2}-\d{2}$/);
        return match ? match[1] : "";
    }

    nonNegativeInteger(value, fallback = 0) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : fallback;
    }

    timestamp(value, fallback = this.clock()) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : fallback;
    }
}

window.SyncService = new SyncService();
