class PendingMilkService {
    constructor(
        repository = window.PendingMilkRepository,
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
            this.repository = window.PendingMilkRepository;
        }
        const required = [
            "loadAttendanceDates",
            "loadRoomPendingRecords",
            "loadPendingRecord",
            "createPendingRecord",
            "deletePendingRecord"
        ];
        const missing = required.find(method => !this.repository?.[method]);
        if (missing) {
            throw this.businessError(
                "PENDING_REPOSITORY_UNAVAILABLE",
                `PendingMilkRepository method ${missing} is not available.`
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
                "PENDING_STOCK_SERVICE_UNAVAILABLE",
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

    dateParts(date) {
        const normalized = String(date || "").trim();
        const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!match) {
            throw this.businessError("PENDING_DATE_INVALID", "Pending Milk date must use YYYY-MM-DD format.");
        }
        return {
            normalized,
            year: Number(match[1]),
            month: Number(match[2]),
            day: Number(match[3])
        };
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

    weekRange(anchorDate) {
        const parts = this.dateParts(anchorDate);
        const anchor = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
        const weekday = anchor.getUTCDay();
        const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
        const monday = new Date(anchor);
        monday.setUTCDate(anchor.getUTCDate() + mondayOffset);
        const friday = new Date(monday);
        friday.setUTCDate(monday.getUTCDate() + 4);
        const dates = [];
        for (let offset = 0; offset < 5; offset += 1) {
            const date = new Date(monday);
            date.setUTCDate(monday.getUTCDate() + offset);
            dates.push(this.formatUtc(date));
        }
        return {
            weekStart: this.formatUtc(monday),
            weekEnd: this.formatUtc(friday),
            dates
        };
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

    pairKey(studentId, date) {
        return `${String(studentId || "").trim()}_${this.dateParts(date).normalized}`;
    }

    issuedPairSet(records = []) {
        const issued = new Set();
        for (const record of this.normalizeRecords(records)) {
            Object.entries(record.students || {}).forEach(([studentId, info]) => {
                const days = Array.isArray(info?.days) ? info.days : [];
                days.forEach(date => issued.add(this.pairKey(studentId, date)));
            });
        }
        return issued;
    }

    buildEligibility({ roomId, students, attendance, pendingRecords, range }) {
        const normalizedStudents = this.normalizeStudents(students);
        const issued = this.issuedPairSet(pendingRecords);
        const eligible = [];
        const alreadyIssued = [];

        for (const date of range.dates) {
            const key = `${roomId}_${date}`;
            const record = attendance?.[key];
            if (!record?.data || typeof record.data !== "object") {
                continue;
            }
            for (const student of normalizedStudents) {
                if (record.data[student.id] !== "absent") {
                    continue;
                }
                const pair = {
                    key: this.pairKey(student.id, date),
                    studentId: student.id,
                    studentNumber: student.num,
                    name: student.name,
                    date,
                    quantity: 1
                };
                if (issued.has(pair.key)) {
                    alreadyIssued.push(pair);
                } else {
                    eligible.push(pair);
                }
            }
        }

        return {
            eligible,
            alreadyIssued,
            eligibleBoxes: eligible.length,
            alreadyIssuedBoxes: alreadyIssued.length
        };
    }

    async loadWeek(session, anchorDate, students = []) {
        const roomId = this.assertRoomAccess(session);
        const range = this.weekRange(anchorDate);
        const repository = this.ensureRepository();
        const [attendance, pendingRecords] = await Promise.all([
            repository.loadAttendanceDates(roomId, range.dates),
            repository.loadRoomPendingRecords(roomId)
        ]);
        const records = this.normalizeRecords(pendingRecords)
            .filter(record => String(record.roomId || "") === roomId);
        const eligibility = this.buildEligibility({
            roomId,
            students,
            attendance: attendance || {},
            pendingRecords: records,
            range
        });

        return {
            roomId,
            roomName: String(session.roomName || roomId),
            teacher: String(session.teacher || "ครูประจำชั้น"),
            ...range,
            attendance: attendance || {},
            records,
            ...eligibility
        };
    }

    normalizeSelection(rawSelection = []) {
        const values = Array.isArray(rawSelection) ? rawSelection : [];
        const unique = new Map();
        for (const item of values) {
            const studentId = String(item?.studentId || "").trim();
            const date = String(item?.date || "").trim();
            if (!studentId || !date) {
                continue;
            }
            unique.set(this.pairKey(studentId, date), { studentId, date });
        }
        return [...unique.values()];
    }

    buildRecord(session, state, selectedPairs, input = {}) {
        const selectedKeys = new Set(selectedPairs.map(pair => this.pairKey(pair.studentId, pair.date)));
        const selected = state.eligible.filter(pair => selectedKeys.has(pair.key));
        if (selected.length !== selectedPairs.length || !selected.length) {
            throw this.businessError(
                "PENDING_SELECTION_INVALID",
                "Selected Pending Milk entries are no longer eligible or have already been issued."
            );
        }

        const students = {};
        selected.forEach(pair => {
            if (!students[pair.studentId]) {
                students[pair.studentId] = { name: pair.name, days: [] };
            }
            students[pair.studentId].days.push(pair.date);
        });

        return {
            record: {
                weekStart: state.weekStart,
                weekEnd: state.weekEnd,
                roomId: state.roomId,
                roomName: String(input.roomName || state.roomName || state.roomId),
                teacher: String(input.teacher || state.teacher || session.teacher || "ครูประจำชั้น"),
                date: String(input.issueDate || this.today()),
                students,
                totalBoxes: selected.length,
                note: String(input.note || "").trim(),
                signature: "",
                signatures: {},
                photos: [],
                savedAt: this.nowIso()
            },
            selected
        };
    }

    stockAdjustmentError(operation, details, cause) {
        return this.businessError(
            "PENDING_STOCK_ADJUSTMENT_REQUIRED",
            "Pending Milk data changed, but Room Stock still requires a protected retry.",
            {
                operation,
                operationType: operation === "delete" ? "ROLLBACK" : "PENDING",
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
        const roomId = this.assertRoomAccess(session, input.roomId);
        const students = input.students || [];
        const state = await this.loadWeek(session, input.weekDate, students);
        const selectedPairs = this.normalizeSelection(input.selectedPairs);
        const { record, selected } = this.buildRecord(session, state, selectedPairs, input);
        const repository = this.ensureRepository();
        const saved = await repository.createPendingRecord(record);
        const referenceId = saved.id;
        const quantity = record.totalBoxes;
        const sharedStock = this.ensureAttendanceService();
        let stockResult;

        try {
            stockResult = await sharedStock.atomicRoomStockDifference(roomId, quantity);
        } catch (error) {
            throw this.stockAdjustmentError("issue", {
                pendingSaved: true,
                recordId: referenceId,
                referenceId,
                record,
                roomId,
                roomName: record.roomName,
                date: record.date,
                difference: quantity,
                quantity
            }, error);
        }

        const ledger = sharedStock.buildLedgerEntry({
            roomId,
            type: "PENDING",
            quantity: -quantity,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId,
            user: session.teacher || record.teacher
        });
        const stockLog = sharedStock.buildStockLog({
            type: "OUT",
            roomId,
            roomName: record.roomName,
            date: record.date,
            quantity,
            balanceAfter: stockResult.roomStockAfter,
            note: "หักสต็อกจากการจ่ายนมค้าง"
        });
        const audit = await sharedStock.writeAuditWithRetry(ledger, stockLog);

        return {
            id: referenceId,
            referenceId,
            record,
            selected,
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

    async remove(session, input = {}) {
        const roomId = this.assertRoomAccess(session, input.roomId);
        const recordId = String(input.recordId || input.id || "").trim();
        if (!recordId) {
            throw this.businessError("PENDING_RECORD_ID_REQUIRED", "A Pending Milk record id is required.");
        }
        const repository = this.ensureRepository();
        const record = await repository.loadPendingRecord(recordId);
        if (!record) {
            throw this.businessError("PENDING_RECORD_NOT_FOUND", "Pending Milk record was not found.");
        }
        if (String(record.roomId || "") !== roomId) {
            throw this.businessError("TEACHER_CROSS_ROOM_ACCESS_DENIED", "A teacher may delete only the authenticated room record.");
        }
        const quantity = Number(record.totalBoxes) || 0;
        await repository.deletePendingRecord(recordId);

        if (quantity <= 0) {
            return {
                id: recordId,
                referenceId: recordId,
                deletedRecord: record,
                restoredQuantity: 0,
                roomId,
                roomStockBefore: null,
                roomStockAfter: null,
                ledger: null,
                stockLog: null,
                audit: { ok: true, attempts: 0, error: null },
                mainStockDelta: 0
            };
        }

        const sharedStock = this.ensureAttendanceService();
        let stockResult;
        try {
            stockResult = await sharedStock.atomicRoomStockDifference(roomId, -quantity);
        } catch (error) {
            throw this.stockAdjustmentError("delete", {
                pendingDeleted: true,
                recordId,
                referenceId: recordId,
                deletedRecord: record,
                roomId,
                roomName: String(record.roomName || session.roomName || roomId),
                date: String(record.date || record.weekStart || ""),
                difference: -quantity,
                quantity
            }, error);
        }

        const ledger = sharedStock.buildLedgerEntry({
            roomId,
            type: "ROLLBACK",
            quantity,
            stockBefore: stockResult.roomStockBefore,
            stockAfter: stockResult.roomStockAfter,
            referenceId: recordId,
            user: session.teacher || record.teacher
        });
        const stockLog = sharedStock.buildStockLog({
            type: "IN",
            roomId,
            roomName: String(record.roomName || session.roomName || roomId),
            date: String(record.date || record.weekStart || ""),
            quantity,
            balanceAfter: stockResult.roomStockAfter,
            note: "คืนสต็อกจากการลบรายการนมค้าง"
        });
        const audit = await sharedStock.writeAuditWithRetry(ledger, stockLog);

        return {
            id: recordId,
            referenceId: recordId,
            deletedRecord: record,
            restoredQuantity: quantity,
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

window.PendingMilkService = new PendingMilkService();
