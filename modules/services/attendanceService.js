class AttendanceService {
    constructor(
        repository = window.AttendanceRepository,
        teacherService = window.TeacherService,
        options = {}
    ) {
        this.repository = repository;
        this.teacherService = teacherService;
        this.clock = options.clock || (() => new Date());
        this.idFactory = options.idFactory || (() => (
            Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
        ));
        this.sleep = options.sleep || (milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds)));
        this.maxStockRetries = Number.isInteger(options.maxStockRetries)
            ? Math.max(1, options.maxStockRetries)
            : 6;
        this.stockRetryDelayMs = Number(options.stockRetryDelayMs) || 120;
        this.auditRetries = Number.isInteger(options.auditRetries)
            ? Math.max(1, options.auditRetries)
            : 3;
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.AttendanceRepository;
        }

        const requiredMethods = [
            "loadAttendanceRecord",
            "saveAttendanceRecord",
            "deleteAttendanceRecord",
            "loadRoomStockVersioned",
            "setRoomStockIfMatch",
            "appendAttendanceAudit"
        ];
        const missing = requiredMethods.find(method => !this.repository?.[method]);
        if (missing) {
            throw this.businessError(
                "ATTENDANCE_REPOSITORY_UNAVAILABLE",
                `AttendanceRepository method ${missing} is not available.`
            );
        }

        return this.repository;
    }

    ensureTeacherService() {
        if (!this.teacherService) {
            this.teacherService = window.TeacherService;
        }

        if (!this.teacherService?.assertRoomAccess) {
            throw this.businessError("TEACHER_SERVICE_UNAVAILABLE", "TeacherService is not available.");
        }

        return this.teacherService;
    }

    businessError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) {
            error.details = details;
        }
        return error;
    }

    createId() {
        return String(this.idFactory());
    }

    nowIso() {
        return this.clock().toISOString();
    }

    toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    requireDate(date) {
        const normalized = String(date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            throw this.businessError("ATTENDANCE_DATE_INVALID", "Attendance date must use YYYY-MM-DD format.");
        }
        return normalized;
    }

    assertRoomAccess(session, targetRoomId = null) {
        return this.ensureTeacherService().assertRoomAccess(session, targetRoomId);
    }

    attendanceKey(roomId, date) {
        return `${roomId}_${this.requireDate(date)}`;
    }

    normalizeAttendanceData(rawData = {}) {
        if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
            throw this.businessError("ATTENDANCE_DATA_INVALID", "Attendance data must be an object keyed by student id.");
        }

        const normalized = {};
        Object.entries(rawData).forEach(([studentId, status]) => {
            const normalizedId = String(studentId || "").trim();
            const normalizedStatus = String(status || "").trim().toLowerCase();

            if (!normalizedId || !normalizedStatus) {
                return;
            }

            if (normalizedStatus !== "present" && normalizedStatus !== "absent") {
                throw this.businessError(
                    "ATTENDANCE_STATUS_INVALID",
                    `Attendance status for student ${normalizedId} must be present or absent.`
                );
            }

            normalized[normalizedId] = normalizedStatus;
        });

        return normalized;
    }

    normalizeNotes(rawNotes = {}) {
        if (!rawNotes || typeof rawNotes !== "object" || Array.isArray(rawNotes)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(rawNotes)
                .map(([studentId, note]) => [String(studentId), String(note || "").trim()])
                .filter(([studentId, note]) => studentId && note)
        );
    }

    normalizePhotos(rawPhotos = []) {
        return Array.isArray(rawPhotos) ? [...rawPhotos] : [];
    }

    countStatuses(data = {}) {
        const values = Object.values(data || {});
        const present = values.filter(status => status === "present").length;
        const absent = values.filter(status => status === "absent").length;

        return {
            present,
            absent,
            checked: present + absent
        };
    }

    buildAttendanceRecord(session, input = {}) {
        const roomId = this.assertRoomAccess(session, input.roomId);
        const date = this.requireDate(input.date);
        const data = this.normalizeAttendanceData(input.data || {});
        const notes = this.normalizeNotes(input.notes);

        return {
            clsId: roomId,
            roomName: String(input.roomName || session.roomName || roomId),
            date,
            year: input.year ?? "",
            term: input.term ?? "",
            teacher: String(input.teacher || session.teacher || "ครูประจำชั้น"),
            data,
            notes,
            photos: this.normalizePhotos(input.photos),
            signature: String(input.signature || ""),
            savedAt: String(input.savedAt || this.nowIso())
        };
    }

    buildLedgerEntry({ roomId, type, quantity, stockBefore, stockAfter, referenceId, user }) {
        return {
            id: this.createId(),
            timestamp: this.nowIso(),
            roomId,
            type,
            quantity,
            stockBefore,
            stockAfter,
            source: "teacher",
            user: String(user || "teacher"),
            referenceId
        };
    }

    buildStockLog({ type, roomId, roomName, date, quantity, balanceAfter, note }) {
        return {
            id: this.createId(),
            type,
            roomId,
            roomName,
            date,
            qty: quantity,
            balanceAfter,
            note,
            savedAt: this.nowIso()
        };
    }

    async loadDay(session, date, targetRoomId = null) {
        const roomId = this.assertRoomAccess(session, targetRoomId);
        const record = await this.ensureRepository().loadAttendanceRecord(roomId, this.requireDate(date));
        return record || null;
    }

    async loadHistory(session, targetRoomId = null) {
        const roomId = this.assertRoomAccess(session, targetRoomId);
        const repository = this.ensureRepository();
        if (!repository.loadRoomAttendance) {
            throw this.businessError("ATTENDANCE_HISTORY_UNAVAILABLE", "Room attendance history is not available.");
        }
        const records = await repository.loadRoomAttendance(roomId);
        return records || {};
    }

    async atomicRoomStockDifference(roomId, difference, options = {}) {
        const normalizedDifference = Number(difference);
        if (!Number.isFinite(normalizedDifference) || normalizedDifference === 0) {
            throw this.businessError(
                "ROOM_STOCK_DIFFERENCE_INVALID",
                "Room Stock difference must be a non-zero number."
            );
        }

        const repository = this.ensureRepository();
        const maxRetries = Number.isInteger(options.maxRetries)
            ? Math.max(1, options.maxRetries)
            : this.maxStockRetries;

        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
            let versioned;
            try {
                versioned = await repository.loadRoomStockVersioned(roomId);
            } catch (error) {
                throw this.businessError(
                    "ROOM_STOCK_ETAG_READ_FAILED",
                    "Unable to read Room Stock with an ETag.",
                    { roomId, difference: normalizedDifference, cause: error?.message || String(error) }
                );
            }

            const roomStockBefore = this.toNumber(versioned?.value);
            const roomStockAfter = roomStockBefore - normalizedDifference;
            let writeResult;

            try {
                writeResult = await repository.setRoomStockIfMatch(
                    roomId,
                    roomStockAfter,
                    versioned?.etag
                );
            } catch (error) {
                throw this.businessError(
                    "ROOM_STOCK_CONDITIONAL_WRITE_FAILED",
                    "Unable to write Room Stock with ETag protection.",
                    {
                        roomId,
                        difference: normalizedDifference,
                        roomStockBefore,
                        roomStockAfter,
                        attempt,
                        cause: error?.message || String(error)
                    }
                );
            }

            if (writeResult?.status === "ok") {
                return {
                    roomId,
                    difference: normalizedDifference,
                    roomStockBefore,
                    roomStockAfter,
                    attempts: attempt,
                    conflictCount: attempt - 1,
                    etag: writeResult.etag || ""
                };
            }

            if (writeResult?.status !== "conflict") {
                throw this.businessError(
                    "ROOM_STOCK_CONDITIONAL_WRITE_FAILED",
                    "Firebase returned an unexpected conditional-write result.",
                    { roomId, difference: normalizedDifference, attempt, writeResult }
                );
            }

            if (attempt < maxRetries) {
                await this.sleep(this.stockRetryDelayMs * attempt);
            }
        }

        throw this.businessError(
            "ROOM_STOCK_CONFLICT_RETRY_EXHAUSTED",
            "Room Stock changed repeatedly and could not be updated safely.",
            { roomId, difference: normalizedDifference, maxRetries }
        );
    }

    async writeAuditWithRetry(ledger, stockLog) {
        const repository = this.ensureRepository();
        let lastError = null;

        for (let attempt = 1; attempt <= this.auditRetries; attempt += 1) {
            try {
                await repository.appendAttendanceAudit(ledger, stockLog);
                return { ok: true, attempts: attempt, error: null };
            } catch (error) {
                lastError = error;
                if (attempt < this.auditRetries) {
                    await this.sleep(this.stockRetryDelayMs * attempt);
                }
            }
        }

        return {
            ok: false,
            attempts: this.auditRetries,
            error: {
                code: lastError?.code || "ATTENDANCE_AUDIT_WRITE_FAILED",
                message: lastError?.message || "Attendance audit write failed."
            }
        };
    }

    stockAdjustmentError(operation, details, cause) {
        return this.businessError(
            "ROOM_STOCK_ADJUSTMENT_REQUIRED",
            "Attendance data was saved, but Room Stock still requires a protected retry.",
            {
                operation,
                ...details,
                cause: {
                    code: cause?.code || "ROOM_STOCK_UPDATE_FAILED",
                    message: cause?.message || "Room Stock update failed."
                },
                mainStockDelta: 0
            }
        );
    }

    async saveAttendance(session, input = {}) {
        const repository = this.ensureRepository();
        const roomId = this.assertRoomAccess(session, input.roomId);
        const record = this.buildAttendanceRecord(session, { ...input, roomId });
        const key = this.attendanceKey(roomId, record.date);
        const previousRecord = await repository.loadAttendanceRecord(roomId, record.date);
        const previousCounts = this.countStatuses(previousRecord?.data || {});
        const currentCounts = this.countStatuses(record.data);
        const baselinePresent = input.baselinePresent === undefined
            ? previousCounts.present
            : this.toNumber(input.baselinePresent, previousCounts.present);
        const presentDifference = currentCounts.present - baselinePresent;

        // Preserve the operational legacy order: save attendance first, then use
        // ETag compare-and-retry for Room Stock. A stock failure is queued by the
        // Manager without rewriting or losing the attendance record.
        await repository.saveAttendanceRecord(roomId, record.date, record);

        let stockResult = null;
        let ledger = null;
        let stockLog = null;
        let audit = { ok: true, attempts: 0, error: null };

        if (presentDifference !== 0) {
            try {
                stockResult = await this.atomicRoomStockDifference(roomId, presentDifference);
            } catch (error) {
                throw this.stockAdjustmentError("save", {
                    key,
                    record,
                    roomId,
                    difference: presentDifference,
                    referenceId: key,
                    roomName: record.roomName,
                    date: record.date,
                    previousPresent: baselinePresent,
                    present: currentCounts.present,
                    absent: currentCounts.absent,
                    attendanceSaved: true
                }, error);
            }

            ledger = this.buildLedgerEntry({
                roomId,
                type: "ATTENDANCE",
                quantity: -presentDifference,
                stockBefore: stockResult.roomStockBefore,
                stockAfter: stockResult.roomStockAfter,
                referenceId: key,
                user: session.teacher || record.teacher
            });
            stockLog = this.buildStockLog({
                type: presentDifference > 0 ? "OUT" : "IN",
                roomId,
                roomName: record.roomName,
                date: record.date,
                quantity: Math.abs(presentDifference),
                balanceAfter: stockResult.roomStockAfter,
                note: presentDifference > 0
                    ? "หักสต็อกจากการเช็คดื่มนมรายวัน"
                    : "คืนสต็อกจากการแก้ไขเช็คดื่มนมรายวัน"
            });
            audit = await this.writeAuditWithRetry(ledger, stockLog);
        }

        const updates = {
            [`mcAttendance/${key}`]: record
        };
        if (stockResult) {
            updates[`roomStock/${roomId}`] = stockResult.roomStockAfter;
        }
        if (ledger) {
            updates[`stockTransactions/${ledger.id}`] = ledger;
        }
        if (stockLog) {
            updates[`stockLog/${stockLog.id}`] = stockLog;
        }

        return {
            key,
            record,
            previousPresent: baselinePresent,
            present: currentCounts.present,
            absent: currentCounts.absent,
            presentDifference,
            roomStockBefore: stockResult?.roomStockBefore ?? null,
            roomStockAfter: stockResult?.roomStockAfter ?? null,
            stockAttempts: stockResult?.attempts || 0,
            stockConflictCount: stockResult?.conflictCount || 0,
            ledger,
            stockLog,
            audit,
            updates,
            mainStockDelta: 0
        };
    }

    async adjustRoomStock(session, input = {}) {
        const roomId = this.assertRoomAccess(session, input.roomId);
        const difference = Number(input.difference);

        if (!Number.isFinite(difference) || difference === 0) {
            throw this.businessError(
                "ROOM_STOCK_DIFFERENCE_INVALID",
                "Room Stock adjustment difference must be a non-zero number."
            );
        }

        const stockResult = await this.atomicRoomStockDifference(roomId, difference);
        const referenceId = String(input.referenceId || "").trim();
        const ledger = this.buildLedgerEntry({
            roomId,
            type: "ATTENDANCE",
            quantity: -difference,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId,
            user: session.teacher || input.teacher
        });
        const stockLog = this.buildStockLog({
            type: difference > 0 ? "OUT" : "IN",
            roomId,
            roomName: String(input.roomName || session.roomName || roomId),
            date: String(input.date || ""),
            quantity: Math.abs(difference),
            balanceAfter: stockResult.roomStockAfter,
            note: difference > 0
                ? "หักสต็อกจากการเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)"
                : "คืนสต็อกจากการแก้ไขเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)"
        });
        const audit = await this.writeAuditWithRetry(ledger, stockLog);
        const updates = {
            [`roomStock/${roomId}`]: stockResult.roomStockAfter,
            [`stockTransactions/${ledger.id}`]: ledger,
            [`stockLog/${stockLog.id}`]: stockLog
        };

        return {
            roomId,
            difference,
            referenceId,
            roomStockBefore: stockResult.roomStockBefore,
            roomStockAfter: stockResult.roomStockAfter,
            stockAttempts: stockResult.attempts,
            stockConflictCount: stockResult.conflictCount,
            ledger,
            stockLog,
            audit,
            updates,
            mainStockDelta: 0
        };
    }

    async deleteAttendance(session, input = {}) {
        const repository = this.ensureRepository();
        const roomId = this.assertRoomAccess(session, input.roomId);
        const date = this.requireDate(input.date);
        const key = this.attendanceKey(roomId, date);
        const previousRecord = await repository.loadAttendanceRecord(roomId, date);

        if (!previousRecord) {
            throw this.businessError("ATTENDANCE_NOT_FOUND", "Attendance record was not found.");
        }

        const previousCounts = this.countStatuses(previousRecord.data || {});
        await repository.deleteAttendanceRecord(roomId, date);

        let stockResult = null;
        let ledger = null;
        let stockLog = null;
        let audit = { ok: true, attempts: 0, error: null };

        if (previousCounts.present > 0) {
            const difference = -previousCounts.present;
            try {
                stockResult = await this.atomicRoomStockDifference(roomId, difference);
            } catch (error) {
                throw this.stockAdjustmentError("delete", {
                    key,
                    deletedRecord: previousRecord,
                    roomId,
                    difference,
                    referenceId: key,
                    roomName: String(previousRecord.roomName || session.roomName || roomId),
                    date,
                    restoredQuantity: previousCounts.present,
                    attendanceDeleted: true
                }, error);
            }

            ledger = this.buildLedgerEntry({
                roomId,
                type: "ROLLBACK",
                quantity: previousCounts.present,
                stockBefore: stockResult.roomStockBefore,
                stockAfter: stockResult.roomStockAfter,
                referenceId: key,
                user: session.teacher || previousRecord.teacher
            });
            stockLog = this.buildStockLog({
                type: "IN",
                roomId,
                roomName: String(previousRecord.roomName || session.roomName || roomId),
                date,
                quantity: previousCounts.present,
                balanceAfter: stockResult.roomStockAfter,
                note: "คืนสต็อกจากการลบประวัติเช็คดื่มนมรายวัน"
            });
            audit = await this.writeAuditWithRetry(ledger, stockLog);
        }

        const updates = {
            [`mcAttendance/${key}`]: null
        };
        if (stockResult) {
            updates[`roomStock/${roomId}`] = stockResult.roomStockAfter;
        }
        if (ledger) {
            updates[`stockTransactions/${ledger.id}`] = ledger;
        }
        if (stockLog) {
            updates[`stockLog/${stockLog.id}`] = stockLog;
        }

        return {
            key,
            deletedRecord: previousRecord,
            restoredQuantity: previousCounts.present,
            roomStockBefore: stockResult?.roomStockBefore ?? null,
            roomStockAfter: stockResult?.roomStockAfter ?? null,
            stockAttempts: stockResult?.attempts || 0,
            stockConflictCount: stockResult?.conflictCount || 0,
            ledger,
            stockLog,
            audit,
            updates,
            mainStockDelta: 0
        };
    }
}

window.AttendanceService = new AttendanceService();
