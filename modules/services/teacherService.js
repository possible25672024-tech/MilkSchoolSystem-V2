class TeacherService {
    constructor(repository = window.TeacherRepository) {
        this.repository = repository;
        this.roomStockOperationTypes = new Set(["ATTENDANCE", "PENDING", "RETRO", "VACATION"]);
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.TeacherRepository;
        }

        if (!this.repository?.loadTeacherSnapshot) {
            throw new Error("TeacherRepository is not available.");
        }

        return this.repository;
    }

    validateSession(session) {
        const errors = [];
        const roomId = String(session?.roomId || session?.classId || "").trim();

        if (!session || typeof session !== "object") {
            errors.push({ code: "TEACHER_SESSION_REQUIRED", message: "Teacher session is required." });
        } else {
            if (session.role !== "teacher") {
                errors.push({ code: "TEACHER_ROLE_REQUIRED", message: "The active session is not a teacher session." });
            }

            if (!roomId || roomId === "__admin__") {
                errors.push({ code: "TEACHER_ROOM_REQUIRED", message: "The teacher session does not contain a valid room id." });
            }
        }

        return {
            valid: errors.length === 0,
            roomId,
            errors
        };
    }

    requireSession(session) {
        const validation = this.validateSession(session);
        if (!validation.valid) {
            const error = new Error(validation.errors[0]?.message || "Teacher session is invalid.");
            error.code = validation.errors[0]?.code || "TEACHER_SESSION_INVALID";
            error.details = validation.errors;
            throw error;
        }

        return validation.roomId;
    }

    assertRoomAccess(session, targetRoomId) {
        const roomId = this.requireSession(session);
        const normalizedTarget = String(targetRoomId || roomId).trim();

        if (normalizedTarget !== roomId) {
            const error = new Error("A teacher may access only the room in the authenticated session.");
            error.code = "TEACHER_CROSS_ROOM_ACCESS_DENIED";
            throw error;
        }

        return roomId;
    }

    normalizeRooms(rawRooms) {
        const entries = Array.isArray(rawRooms)
            ? rawRooms.map((room, index) => [String(room?.id || index), room])
            : Object.entries(rawRooms || {});

        return entries
            .filter(([, room]) => room && typeof room === "object")
            .map(([key, room]) => this.normalizeRoom({ ...room, id: String(room.id || key) }));
    }

    normalizeRoom(room = {}) {
        const students = this.normalizeStudents(room.students);
        const requestedCount = Number(room.count);

        return {
            ...room,
            id: String(room.id || "").trim(),
            name: String(room.name || room.roomName || room.id || "").trim(),
            level: String(room.level || "").trim(),
            teacher: String(room.teacher || room.teacherName || "ครูประจำชั้น").trim(),
            count: students.length || (Number.isInteger(requestedCount) && requestedCount >= 0 ? requestedCount : 0),
            students,
            stock: this.numberOrZero(room.stock)
        };
    }

    normalizeStudents(rawStudents) {
        const values = Array.isArray(rawStudents)
            ? rawStudents
            : Object.values(rawStudents || {});

        return values
            .filter(student => student && typeof student === "object")
            .map((student, index) => this.normalizeStudent(student, index));
    }

    normalizeStudent(student = {}, index = 0) {
        const firstName = String(student["ชื่อ"] || student.firstName || "").trim();
        const lastName = String(student["นามสกุล"] || student.lastName || student.surname || "").trim();
        const combinedName = String(
            student["ชื่อ-นามสกุล"] || student.name || `${firstName} ${lastName}`
        ).trim();
        const rawGender = String(student["เพศ"] || student.gender || student.sex || "").trim();
        const comparableGender = rawGender.toLocaleLowerCase("th-TH");
        const gender = comparableGender.includes("หญิง") || comparableGender === "f" || comparableGender === "female"
            ? "หญิง"
            : comparableGender.includes("ชาย") || comparableGender === "m" || comparableGender === "male"
                ? "ชาย"
                : "";

        return {
            ...student,
            id: String(
                student["รหัส"] ||
                student["รหัสประจำตัว"] ||
                student.id ||
                student.studentId ||
                `student_${index + 1}`
            ),
            num: String(student["เลขที่"] || student.no || student.num || index + 1),
            name: combinedName || `นักเรียนคนที่ ${index + 1}`,
            gender
        };
    }

    normalizeRecords(rawRecords) {
        if (Array.isArray(rawRecords)) {
            return rawRecords.filter(record => record && typeof record === "object");
        }

        return Object.entries(rawRecords || {})
            .filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => ({ id: record.id || id, ...record }));
    }

    filterRoomRecords(rawRecords, roomId) {
        return this.normalizeRecords(rawRecords).filter(record =>
            String(record.roomId ?? record.classId ?? record.clsId ?? "") === String(roomId)
        );
    }

    normalizeAttendance(rawAttendance, roomId) {
        const result = {};

        Object.entries(rawAttendance || {}).forEach(([key, record]) => {
            if (!record || typeof record !== "object") {
                return;
            }

            const recordRoomId = String(record.roomId ?? record.classId ?? record.clsId ?? "");
            const matchesKey = String(key).startsWith(`${roomId}_`);
            if (recordRoomId === String(roomId) || matchesKey) {
                result[key] = record;
            }
        });

        return result;
    }

    buildScopedSnapshot(rawSnapshot = {}, session) {
        const roomId = this.requireSession(session);
        const rooms = this.normalizeRooms(rawSnapshot.rooms);
        const room = rooms.find(candidate => candidate.id === roomId);

        if (!room) {
            const error = new Error("The authenticated teacher room was not found.");
            error.code = "TEACHER_ROOM_NOT_FOUND";
            throw error;
        }

        const roomStock = rawSnapshot.roomStock === null || rawSnapshot.roomStock === undefined
            ? room.stock
            : this.numberOrZero(rawSnapshot.roomStock?.value ?? rawSnapshot.roomStock);

        return {
            settings: { ...(rawSnapshot.settings || {}) },
            session: {
                roomId,
                roomName: String(session.roomName || room.name),
                teacher: String(session.teacher || room.teacher),
                schoolName: String(
                    session.schoolName ||
                    rawSnapshot.settings?.school ||
                    rawSnapshot.settings?.schoolName ||
                    "โรงเรียน"
                ),
                role: "teacher"
            },
            room,
            students: room.students,
            roomStock,
            distributes: this.filterRoomRecords(rawSnapshot.distributes, roomId),
            attendance: this.normalizeAttendance(rawSnapshot.attendance, roomId),
            absentMilk: this.filterRoomRecords(rawSnapshot.absentMilk, roomId),
            retroMilk: this.filterRoomRecords(rawSnapshot.retroMilk, roomId),
            vacationMilk: this.filterRoomRecords(rawSnapshot.vacationMilk, roomId),
            stockTransactions: this.filterRoomRecords(rawSnapshot.stockTransactions, roomId),
            updatedAt: rawSnapshot.updatedAt || {}
        };
    }

    buildDashboard(snapshot) {
        const distributed = this.sumRecords(snapshot.distributes, ["total", "totalBoxes", "quantity"]);
        const attendanceUsed = Object.values(snapshot.attendance || {}).reduce((total, record) => {
            const present = Object.values(record?.data || {}).filter(status => status === "present").length;
            return total + present;
        }, 0);
        const pendingUsed = this.sumRecords(snapshot.absentMilk, ["totalBoxes", "boxes", "total", "quantity"]);
        const retroUsed = this.sumRecords(snapshot.retroMilk, ["totalBoxes", "boxes", "total", "quantity"]);
        const vacationUsed = this.sumRecords(snapshot.vacationMilk, ["totalBoxes", "boxes", "total", "quantity"]);
        const usedTotal = attendanceUsed + pendingUsed + retroUsed + vacationUsed;
        const expectedRoomStock = distributed - usedTotal;
        const actualRoomStock = this.numberOrZero(snapshot.roomStock);

        return {
            roomId: snapshot.room.id,
            roomName: snapshot.room.name,
            teacher: snapshot.session.teacher,
            students: snapshot.students.length || snapshot.room.count,
            distributed,
            attendanceUsed,
            pendingUsed,
            retroUsed,
            vacationUsed,
            usedTotal,
            expectedRoomStock,
            actualRoomStock,
            variance: actualRoomStock - expectedRoomStock,
            attendanceDays: Object.keys(snapshot.attendance || {}).length,
            recentTransactions: [...(snapshot.stockTransactions || [])]
                .sort((a, b) => String(b.createdAt || b.savedAt || b.date || "").localeCompare(String(a.createdAt || a.savedAt || a.date || "")))
                .slice(0, 10)
        };
    }

    async loadTeacherView(session) {
        const roomId = this.requireSession(session);
        const rawSnapshot = await this.ensureRepository().loadTeacherSnapshot(roomId);
        const snapshot = this.buildScopedSnapshot(rawSnapshot, session);

        return {
            snapshot,
            dashboard: this.buildDashboard(snapshot)
        };
    }

    prepareRoomStockCommand(session, type, quantity, options = {}) {
        const normalizedType = String(type || "").trim().toUpperCase();
        const roomId = this.assertRoomAccess(session, options.roomId);
        const normalizedQuantity = Number(quantity);

        if (!this.roomStockOperationTypes.has(normalizedType)) {
            const error = new Error("Unsupported teacher Room Stock operation type.");
            error.code = "TEACHER_OPERATION_TYPE_INVALID";
            throw error;
        }

        if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            const error = new Error("Teacher Room Stock quantity must be greater than zero.");
            error.code = "TEACHER_OPERATION_QUANTITY_INVALID";
            throw error;
        }

        return {
            roomId,
            type: normalizedType,
            quantity: -normalizedQuantity,
            roomStockDelta: -normalizedQuantity,
            mainStockDelta: 0,
            source: "teacher",
            referenceId: options.referenceId || null,
            metadata: { ...(options.metadata || {}) }
        };
    }

    prepareRollbackCommand(session, quantity, options = {}) {
        const roomId = this.assertRoomAccess(session, options.roomId);
        const normalizedQuantity = Number(quantity);

        if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
            const error = new Error("Rollback quantity must be greater than zero.");
            error.code = "TEACHER_ROLLBACK_QUANTITY_INVALID";
            throw error;
        }

        return {
            roomId,
            type: "ROLLBACK",
            quantity: normalizedQuantity,
            roomStockDelta: normalizedQuantity,
            mainStockDelta: 0,
            source: "teacher",
            referenceId: options.referenceId || null,
            originalType: String(options.originalType || "").toUpperCase() || null
        };
    }

    attendanceKey(roomId, date) {
        return `${String(roomId || "")}_${String(date || "")}`;
    }

    sumRecords(records, fields) {
        return (records || []).reduce((sum, record) => {
            const field = fields.find(candidate => record?.[candidate] !== undefined && record?.[candidate] !== null);
            return sum + this.numberOrZero(field ? record[field] : 0);
        }, 0);
    }

    numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }
}

window.TeacherService = new TeacherService();
