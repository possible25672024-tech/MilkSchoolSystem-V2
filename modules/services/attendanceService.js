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
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.AttendanceRepository;
        }

        if (!this.repository?.loadMutationState || !this.repository?.applyAttendanceMutation) {
            throw this.businessError("ATTENDANCE_REPOSITORY_UNAVAILABLE", "AttendanceRepository is not available.");
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
        const records = await this.ensureRepository().loadRoomAttendance(roomId);
        return records || {};
    }

    async saveAttendance(session, input = {}) {
        const repository = this.ensureRepository();
        const roomId = this.assertRoomAccess(session, input.roomId);
        const record = this.buildAttendanceRecord(session, { ...input, roomId });
        const key = this.attendanceKey(roomId, record.date);
        const state = await repository.loadMutationState(roomId, record.date);
        const previousCounts = this.countStatuses(state.attendance?.data || {});
        const currentCounts = this.countStatuses(record.data);
        const baselinePresent = input.baselinePresent === undefined
            ? previousCounts.present
            : this.toNumber(input.baselinePresent, previousCounts.present);
        const presentDifference = currentCounts.present - baselinePresent;
        const roomStockBefore = this.toNumber(state.roomStock);
        const roomStockAfter = roomStockBefore - presentDifference;
        const updates = {
            [`mcAttendance/${key}`]: record
        };

        let ledger = null;
        let stockLog = null;

        if (presentDifference !== 0) {
            ledger = this.buildLedgerEntry({
                roomId,
                type: "ATTENDANCE",
                quantity: -presentDifference,
                stockBefore: roomStockBefore,
                stockAfter: roomStockAfter,
                referenceId: key,
                user: session.teacher || record.teacher
            });
            stockLog = this.buildStockLog({
                type: presentDifference > 0 ? "OUT" : "IN",
                roomId,
                roomName: record.roomName,
                date: record.date,
                quantity: Math.abs(presentDifference),
                balanceAfter: roomStockAfter,
                note: presentDifference > 0
                    ? "หักสต็อกจากการเช็คดื่มนมรายวัน"
                    : "คืนสต็อกจากการแก้ไขเช็คดื่มนมรายวัน"
            });

            updates[`roomStock/${roomId}`] = roomStockAfter;
            updates[`stockTransactions/${ledger.id}`] = ledger;
            updates[`stockLog/${stockLog.id}`] = stockLog;
        }

        await repository.applyAttendanceMutation(updates);

        return {
            key,
            record,
            previousPresent: baselinePresent,
            present: currentCounts.present,
            absent: currentCounts.absent,
            presentDifference,
            roomStockBefore,
            roomStockAfter,
            ledger,
            stockLog,
            updates,
            mainStockDelta: 0
        };
    }

    async adjustRoomStock(session, input = {}) {
        const repository = this.ensureRepository();
        const roomId = this.assertRoomAccess(session, input.roomId);
        const difference = Number(input.difference);

        if (!Number.isFinite(difference) || difference === 0) {
            throw this.businessError(
                "ROOM_STOCK_DIFFERENCE_INVALID",
                "Room Stock adjustment difference must be a non-zero number."
            );
        }

        const roomStockBefore = this.toNumber(await repository.loadRoomStock(roomId));
        const roomStockAfter = roomStockBefore - difference;
        const referenceId = String(input.referenceId || "").trim();
        const ledger = this.buildLedgerEntry({
            roomId,
            type: "ATTENDANCE",
            quantity: -difference,
            stockBefore: roomStockBefore,
            stockAfter: roomStockAfter,
            referenceId,
            user: session.teacher || input.teacher
        });
        const stockLog = this.buildStockLog({
            type: difference > 0 ? "OUT" : "IN",
            roomId,
            roomName: String(input.roomName || session.roomName || roomId),
            date: String(input.date || ""),
            quantity: Math.abs(difference),
            balanceAfter: roomStockAfter,
            note: difference > 0
                ? "หักสต็อกจากการเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)"
                : "คืนสต็อกจากการแก้ไขเช็คดื่มนมรายวัน (ซิงก์ค้างจากออฟไลน์)"
        });
        const updates = {
            [`roomStock/${roomId}`]: roomStockAfter,
            [`stockTransactions/${ledger.id}`]: ledger,
            [`stockLog/${stockLog.id}`]: stockLog
        };

        await repository.applyAttendanceMutation(updates);

        return {
            roomId,
            difference,
            referenceId,
            roomStockBefore,
            roomStockAfter,
            ledger,
            stockLog,
            updates,
            mainStockDelta: 0
        };
    }

    async deleteAttendance(session, input = {}) {
        const repository = this.ensureRepository();
        const roomId = this.assertRoomAccess(session, input.roomId);
        const date = this.requireDate(input.date);
        const key = this.attendanceKey(roomId, date);
        const state = await repository.loadMutationState(roomId, date);

        if (!state.attendance) {
            throw this.businessError("ATTENDANCE_NOT_FOUND", "Attendance record was not found.");
        }

        const previousCounts = this.countStatuses(state.attendance.data || {});
        const roomStockBefore = this.toNumber(state.roomStock);
        const roomStockAfter = roomStockBefore + previousCounts.present;
        const updates = {
            [`mcAttendance/${key}`]: null
        };

        let ledger = null;
        let stockLog = null;

        if (previousCounts.present > 0) {
            ledger = this.buildLedgerEntry({
                roomId,
                type: "ROLLBACK",
                quantity: previousCounts.present,
                stockBefore: roomStockBefore,
                stockAfter: roomStockAfter,
                referenceId: key,
                user: session.teacher || state.attendance.teacher
            });
            stockLog = this.buildStockLog({
                type: "IN",
                roomId,
                roomName: String(state.attendance.roomName || session.roomName || roomId),
                date,
                quantity: previousCounts.present,
                balanceAfter: roomStockAfter,
                note: "คืนสต็อกจากการลบประวัติเช็คดื่มนมรายวัน"
            });

            updates[`roomStock/${roomId}`] = roomStockAfter;
            updates[`stockTransactions/${ledger.id}`] = ledger;
            updates[`stockLog/${stockLog.id}`] = stockLog;
        }

        await repository.applyAttendanceMutation(updates);

        return {
            key,
            deletedRecord: state.attendance,
            restoredQuantity: previousCounts.present,
            roomStockBefore,
            roomStockAfter,
            ledger,
            stockLog,
            updates,
            mainStockDelta: 0
        };
    }
}

window.AttendanceService = new AttendanceService();
