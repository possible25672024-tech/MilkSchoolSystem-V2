class RetroactiveMilkService {
    constructor(
        repository = window.RetroactiveMilkRepository,
        teacherService = window.TeacherService,
        attendanceService = window.AttendanceService,
        options = {}
    ) {
        this.repository = repository;
        this.teacherService = teacherService;
        this.attendanceService = attendanceService;
        this.clock = options.clock || (() => new Date());
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.RetroactiveMilkRepository;
        }
        const required = ["loadRoomRecords", "loadRecord", "createRecord", "deleteRecord"];
        const missing = required.find(method => !this.repository?.[method]);
        if (missing) {
            throw this.businessError(
                "RETRO_REPOSITORY_UNAVAILABLE",
                `RetroactiveMilkRepository method ${missing} is not available.`
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

    ensureAttendanceService() {
        if (!this.attendanceService) {
            this.attendanceService = window.AttendanceService;
        }
        const required = [
            "atomicRoomStockDifference",
            "buildLedgerEntry",
            "buildStockLog",
            "writeAuditWithRetry"
        ];
        const missing = required.find(method => !this.attendanceService?.[method]);
        if (missing) {
            throw this.businessError(
                "RETRO_STOCK_SERVICE_UNAVAILABLE",
                `AttendanceService shared stock method ${missing} is not available.`
            );
        }
        return this.attendanceService;
    }

    businessError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) {
            error.details = details;
        }
        return error;
    }

    assertRoomAccess(session, targetRoomId = null) {
        return this.ensureTeacherService().assertRoomAccess(session, targetRoomId);
    }

    dateParts(value, field = "date") {
        const normalized = String(value || "").trim();
        const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            throw this.businessError(
                "RETRO_DATE_INVALID",
                `${field} must use YYYY-MM-DD format.`
            );
        }
        const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
        if (
            date.getUTCFullYear() !== Number(match[1]) ||
            date.getUTCMonth() !== Number(match[2]) - 1 ||
            date.getUTCDate() !== Number(match[3])
        ) {
            throw this.businessError("RETRO_DATE_INVALID", `${field} is not a valid calendar date.`);
        }
        return { normalized, date };
    }

    formatUtc(date) {
        return [
            date.getUTCFullYear(),
            String(date.getUTCMonth() + 1).padStart(2, "0"),
            String(date.getUTCDate()).padStart(2, "0")
        ].join("-");
    }

    today() {
        const date = this.clock();
        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
        ].join("-");
    }

    nowIso() {
        return this.clock().toISOString();
    }

    weekdayRange(startValue, endValue) {
        const start = this.dateParts(startValue, "retroStart");
        const end = this.dateParts(endValue, "retroEnd");
        if (start.date.getTime() > end.date.getTime()) {
            throw this.businessError(
                "RETRO_RANGE_REVERSED",
                "Retroactive Milk start date must not be after the end date."
            );
        }

        const dates = [];
        const cursor = new Date(start.date);
        while (cursor.getTime() <= end.date.getTime()) {
            const weekday = cursor.getUTCDay();
            if (weekday >= 1 && weekday <= 5) {
                dates.push(this.formatUtc(cursor));
            }
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        if (!dates.length) {
            throw this.businessError(
                "RETRO_WEEKDAY_REQUIRED",
                "The selected Retroactive Milk range contains no Monday–Friday date."
            );
        }
        return {
            retroStart: start.normalized,
            retroEnd: end.normalized,
            dates,
            days: dates.length
        };
    }

    academicYear(value) {
        const normalized = String(value || "").trim();
        if (!/^\d{4}$/.test(normalized) || Number(normalized) < 2500) {
            throw this.businessError(
                "RETRO_ACADEMIC_YEAR_INVALID",
                "Retroactive Milk academic year must use a four-digit Buddhist year."
            );
        }
        return normalized;
    }

    semester(value) {
        const normalized = String(value || "").trim();
        if (!["1", "2"].includes(normalized)) {
            throw this.businessError("RETRO_SEMESTER_INVALID", "Retroactive Milk semester must be 1 or 2.");
        }
        return normalized;
    }

    normalizeStudents(rawStudents = []) {
        const values = Array.isArray(rawStudents) ? rawStudents : Object.values(rawStudents || {});
        return values
            .filter(student => student && typeof student === "object")
            .map((student, index) => ({
                ...student,
                id: String(student.id || student.studentId || student["รหัส"] || `student_${index + 1}`),
                num: String(student.num || student.no || student["เลขที่"] || index + 1),
                name: String(student.name || student["ชื่อ-นามสกุล"] || student["ชื่อ"] || `นักเรียนคนที่ ${index + 1}`)
            }));
    }

    normalizeRecords(rawRecords = {}) {
        if (Array.isArray(rawRecords)) {
            return rawRecords
                .filter(record => record && typeof record === "object")
                .map((record, index) => ({ id: String(record.id || index), ...record }));
        }
        return Object.entries(rawRecords || {})
            .filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => ({ id: String(record.id || id), ...record }));
    }

    duplicateKey(record = {}) {
        return [
            String(record.roomId || ""),
            String(record.academicYear || ""),
            String(record.semester || ""),
            String(record.retroStart || ""),
            String(record.retroEnd || "")
        ].join("|");
    }

    preview(session, input = {}) {
        const roomId = this.assertRoomAccess(session, input.roomId);
        const students = this.normalizeStudents(input.students || []);
        if (!students.length) {
            throw this.businessError("RETRO_STUDENTS_REQUIRED", "The authenticated room has no student roster.");
        }
        const range = this.weekdayRange(input.retroStart, input.retroEnd);
        const academicYear = this.academicYear(input.academicYear);
        const semester = this.semester(input.semester);
        const issueDate = this.dateParts(input.issueDate || this.today(), "issueDate").normalized;
        const totalBoxes = range.days * students.length;

        return {
            roomId,
            roomName: String(input.roomName || session.roomName || roomId),
            teacher: String(input.teacher || session.teacher || "ครูประจำชั้น"),
            academicYear,
            semester,
            issueDate,
            ...range,
            students,
            studentCount: students.length,
            totalBoxes,
            debtBoxes: totalBoxes,
            mainStockDelta: 0
        };
    }

    buildRecord(session, preview, input = {}) {
        return {
            academicYear: preview.academicYear,
            semester: preview.semester,
            date: preview.issueDate,
            retroStart: preview.retroStart,
            retroEnd: preview.retroEnd,
            roomId: preview.roomId,
            roomName: preview.roomName,
            teacher: preview.teacher,
            studentCount: preview.studentCount,
            days: preview.days,
            totalBoxes: preview.totalBoxes,
            debtBoxes: preview.debtBoxes,
            status: "debt",
            note: String(input.note || "").trim(),
            signature: String(input.signature || ""),
            signatures: input.signatures && typeof input.signatures === "object"
                ? { ...input.signatures }
                : {},
            photos: Array.isArray(input.photos) ? [...input.photos] : [],
            savedAt: this.nowIso()
        };
    }

    async loadHistory(session) {
        const roomId = this.assertRoomAccess(session);
        const records = this.normalizeRecords(await this.ensureRepository().loadRoomRecords(roomId))
            .filter(record => String(record.roomId || "") === roomId)
            .sort((a, b) => String(b.savedAt || "").localeCompare(String(a.savedAt || "")));
        return {
            roomId,
            roomName: String(session.roomName || roomId),
            teacher: String(session.teacher || "ครูประจำชั้น"),
            records,
            totalBoxes: records.reduce((sum, record) => sum + Math.max(0, Number(record.totalBoxes) || 0), 0),
            debtBoxes: records.reduce((sum, record) => sum + Math.max(0, Number(record.debtBoxes) || 0), 0)
        };
    }

    stockAdjustmentError(operation, details, cause) {
        return this.businessError(
            "RETRO_STOCK_ADJUSTMENT_REQUIRED",
            "Retroactive Milk data changed, but Room Stock still requires a protected retry.",
            {
                operation,
                operationType: operation === "delete" ? "ROLLBACK" : "RETRO",
                ...details,
                cause: {
                    code: cause?.code || "ROOM_STOCK_UPDATE_FAILED",
                    message: cause?.message || "Room Stock update failed."
                },
                mainStockDelta: 0
            }
        );
    }

    async issue(session, input = {}) {
        const preview = this.preview(session, input);
        const repository = this.ensureRepository();
        const current = this.normalizeRecords(await repository.loadRoomRecords(preview.roomId))
            .filter(record => String(record.roomId || "") === preview.roomId);
        const candidate = {
            roomId: preview.roomId,
            academicYear: preview.academicYear,
            semester: preview.semester,
            retroStart: preview.retroStart,
            retroEnd: preview.retroEnd
        };
        if (current.some(record => this.duplicateKey(record) === this.duplicateKey(candidate))) {
            throw this.businessError(
                "RETRO_DUPLICATE_RANGE",
                "This room already has a Retroactive Milk record for the selected academic period and date range."
            );
        }

        const record = this.buildRecord(session, preview, input);
        const saved = await repository.createRecord(record);
        const referenceId = saved.id;
        const quantity = record.totalBoxes;
        const stockService = this.ensureAttendanceService();
        let stockResult;

        try {
            stockResult = await stockService.atomicRoomStockDifference(preview.roomId, quantity);
        } catch (error) {
            throw this.stockAdjustmentError("issue", {
                retroSaved: true,
                recordId: referenceId,
                referenceId,
                record,
                roomId: preview.roomId,
                roomName: preview.roomName,
                date: record.date,
                difference: quantity,
                quantity
            }, error);
        }

        const ledger = stockService.buildLedgerEntry({
            roomId: preview.roomId,
            type: "RETRO",
            quantity: -quantity,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId,
            user: session.teacher || record.teacher
        });
        const stockLog = stockService.buildStockLog({
            type: "OUT",
            roomId: preview.roomId,
            roomName: preview.roomName,
            date: record.date,
            quantity,
            balanceAfter: stockResult.roomStockAfter,
            note: "หักสต็อกจากการจ่ายนมย้อนหลัง"
        });
        const audit = await stockService.writeAuditWithRetry(ledger, stockLog);

        return {
            id: referenceId,
            referenceId,
            record,
            quantity,
            roomId: preview.roomId,
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

    async remove(session, input = {}) {
        const roomId = this.assertRoomAccess(session, input.roomId);
        const recordId = String(input.recordId || input.id || "").trim();
        if (!recordId) {
            throw this.businessError("RETRO_RECORD_ID_REQUIRED", "A Retroactive Milk record id is required.");
        }
        const repository = this.ensureRepository();
        const record = await repository.loadRecord(recordId);
        if (!record) {
            throw this.businessError("RETRO_RECORD_NOT_FOUND", "Retroactive Milk record was not found.");
        }
        this.assertRoomAccess(session, record.roomId);
        if (String(record.roomId || "") !== roomId) {
            throw this.businessError("RETRO_ROOM_MISMATCH", "Retroactive Milk record belongs to another room.");
        }
        const quantity = Math.max(0, Number(record.totalBoxes) || 0);
        await repository.deleteRecord(recordId);
        if (!quantity) {
            return {
                id: recordId,
                referenceId: recordId,
                record,
                quantity: 0,
                roomId,
                roomStockBefore: null,
                roomStockAfter: null,
                audit: { ok: true, attempts: 0, error: null },
                mainStockDelta: 0
            };
        }

        const stockService = this.ensureAttendanceService();
        let stockResult;
        try {
            stockResult = await stockService.atomicRoomStockDifference(roomId, -quantity);
        } catch (error) {
            throw this.stockAdjustmentError("delete", {
                retroDeleted: true,
                recordId,
                referenceId: recordId,
                record,
                roomId,
                roomName: String(record.roomName || session.roomName || roomId),
                date: String(record.date || this.today()),
                difference: -quantity,
                quantity
            }, error);
        }

        const ledger = stockService.buildLedgerEntry({
            roomId,
            type: "ROLLBACK",
            quantity,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId: recordId,
            user: session.teacher || record.teacher
        });
        const stockLog = stockService.buildStockLog({
            type: "IN",
            roomId,
            roomName: String(record.roomName || session.roomName || roomId),
            date: String(record.date || this.today()),
            quantity,
            balanceAfter: stockResult.roomStockAfter,
            note: "คืนสต็อกจากการลบรายการนมย้อนหลัง"
        });
        const audit = await stockService.writeAuditWithRetry(ledger, stockLog);

        return {
            id: recordId,
            referenceId: recordId,
            record,
            quantity,
            roomId,
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
}

window.RetroactiveMilkService = new RetroactiveMilkService();
