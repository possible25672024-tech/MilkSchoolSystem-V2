class RoomService {
    constructor(repository = window.RoomRepository, options = {}) {
        this.repository = repository;
        this.idFactory = options.idFactory || (() => `room_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.RoomRepository;
        }

        if (!this.repository?.loadRooms || !this.repository?.saveRooms) {
            throw new Error("RoomRepository is not available.");
        }

        return this.repository;
    }

    normalizeCollection(rawRooms) {
        const entries = Array.isArray(rawRooms)
            ? rawRooms.map((room, index) => [String(room?.id || index), room])
            : Object.entries(rawRooms || {});

        return entries
            .filter(([, room]) => room && typeof room === "object")
            .map(([key, room]) => this.normalizeRoom({ ...room, id: String(room.id || key) }, room));
    }

    normalizeRoom(input = {}, existingRoom = null) {
        const existing = existingRoom && typeof existingRoom === "object" ? existingRoom : {};
        const hasStudents = Array.isArray(input.students);
        const students = hasStudents
            ? input.students.map(student => this.normalizeStudent(student)).filter(Boolean)
            : Array.isArray(existing.students)
                ? existing.students.map(student => this.normalizeStudent(student)).filter(Boolean)
                : [];

        const requestedCount = input.count !== undefined ? Number(input.count) : Number(existing.count);
        const count = hasStudents
            ? students.length
            : Number.isInteger(requestedCount) && requestedCount >= 0
                ? requestedCount
                : students.length;

        const existingId = String(existing.id || "").trim();
        const requestedId = String(input.id || "").trim();
        const id = existingId || requestedId || this.idFactory();

        return {
            ...existing,
            ...input,
            id,
            name: String(input.name ?? existing.name ?? "").trim(),
            level: String(input.level ?? existing.level ?? "").trim(),
            teacher: String(input.teacher ?? existing.teacher ?? "").trim(),
            count,
            students,
            stock: this.numberOrZero(existing.stock ?? input.stock)
        };
    }

    normalizeStudent(student) {
        if (!student || typeof student !== "object" || Array.isArray(student)) {
            return null;
        }

        const normalized = {};
        Object.entries(student).forEach(([key, value]) => {
            const cleanKey = String(key || "").trim();
            if (!cleanKey) {
                return;
            }

            normalized[cleanKey] = typeof value === "string" ? value.trim() : value;
        });

        return Object.keys(normalized).length ? normalized : null;
    }

    validateRoom(room, rooms = [], ignoreRoomId = null) {
        const errors = [];
        const roomId = String(room?.id || "").trim();
        const roomName = String(room?.name || "").trim();
        const roomCount = Number(room?.count);

        if (!roomId) {
            errors.push({ field: "id", code: "ROOM_ID_REQUIRED", message: "Room id is required." });
        }

        if (!roomName) {
            errors.push({ field: "name", code: "ROOM_NAME_REQUIRED", message: "Room name is required." });
        }

        if (!Number.isInteger(roomCount) || roomCount < 0) {
            errors.push({ field: "count", code: "ROOM_COUNT_INVALID", message: "Student count must be a non-negative integer." });
        }

        const comparableName = this.comparableText(roomName);
        const duplicateId = rooms.find(candidate =>
            String(candidate?.id || "") === roomId &&
            String(candidate?.id || "") !== String(ignoreRoomId || "")
        );
        const duplicateName = rooms.find(candidate =>
            this.comparableText(candidate?.name) === comparableName &&
            String(candidate?.id || "") !== String(ignoreRoomId || "")
        );

        if (duplicateId) {
            errors.push({ field: "id", code: "ROOM_ID_DUPLICATE", message: "Room id already exists." });
        }

        if (comparableName && duplicateName) {
            errors.push({ field: "name", code: "ROOM_NAME_DUPLICATE", message: "Room name already exists." });
        }

        const duplicateStudents = this.findDuplicateStudents(room?.students || []);
        if (duplicateStudents.length) {
            errors.push({
                field: "students",
                code: "STUDENT_DUPLICATE",
                message: "Duplicate students were found in the room.",
                duplicates: duplicateStudents
            });
        }

        return { valid: errors.length === 0, errors };
    }

    findDuplicateStudents(students = []) {
        const seen = new Map();
        const duplicates = [];

        students.forEach((student, index) => {
            const identity = this.studentIdentity(student);
            if (!identity) {
                return;
            }

            if (seen.has(identity)) {
                duplicates.push({ identity, firstIndex: seen.get(identity), duplicateIndex: index });
            } else {
                seen.set(identity, index);
            }
        });

        return duplicates;
    }

    studentIdentity(student = {}) {
        const preferredFields = [
            "id",
            "studentId",
            "รหัสประจำตัว",
            "รหัสนักเรียน",
            "เลขประจำตัว 13 หลัก",
            "เลขประจำตัวประชาชน",
            "citizenId"
        ];

        for (const field of preferredFields) {
            const value = this.comparableText(student[field]);
            if (value) {
                return `${field}:${value}`;
            }
        }

        const firstName = this.comparableText(student["ชื่อ"] ?? student.firstName ?? student.name);
        const lastName = this.comparableText(student["นามสกุล"] ?? student.lastName ?? student.surname);
        return firstName || lastName ? `name:${firstName}|${lastName}` : "";
    }

    async loadRooms() {
        return this.normalizeCollection(await this.ensureRepository().loadRooms());
    }

    async createRoom(input = {}) {
        const repository = this.ensureRepository();
        const rooms = this.normalizeCollection(await repository.loadRooms());
        const createInput = { ...input, stock: 0 };
        if (!Array.isArray(input.students)) {
            delete createInput.students;
        }
        const room = this.normalizeRoom(createInput);
        const validation = this.validateRoom(room, rooms);

        if (!validation.valid) {
            return { ok: false, code: "ROOM_VALIDATION_FAILED", errors: validation.errors };
        }

        const nextRooms = [...rooms, room];
        await repository.saveRooms(nextRooms);
        return { ok: true, room, rooms: nextRooms };
    }

    async updateRoom(roomId, changes = {}) {
        const normalizedRoomId = String(roomId || "").trim();
        if (!normalizedRoomId) {
            return { ok: false, code: "ROOM_ID_REQUIRED", errors: [{ field: "id", message: "Room id is required." }] };
        }

        if (changes.id !== undefined && String(changes.id) !== normalizedRoomId) {
            return { ok: false, code: "ROOM_ID_IMMUTABLE", errors: [{ field: "id", message: "Existing room ids cannot be changed." }] };
        }

        const repository = this.ensureRepository();
        const rooms = this.normalizeCollection(await repository.loadRooms());
        const roomIndex = rooms.findIndex(room => room.id === normalizedRoomId);

        if (roomIndex < 0) {
            return { ok: false, code: "ROOM_NOT_FOUND", errors: [{ field: "id", message: "Room was not found." }] };
        }

        const existing = rooms[roomIndex];
        const room = this.normalizeRoom({ ...changes, id: normalizedRoomId }, existing);
        room.id = existing.id;
        room.stock = this.numberOrZero(existing.stock);

        const validation = this.validateRoom(room, rooms, existing.id);
        if (!validation.valid) {
            return { ok: false, code: "ROOM_VALIDATION_FAILED", errors: validation.errors };
        }

        const nextRooms = [...rooms];
        nextRooms[roomIndex] = room;
        await repository.saveRooms(nextRooms);
        return { ok: true, room, rooms: nextRooms };
    }

    prepareImport(sheets = [], existingRooms = []) {
        const rooms = this.normalizeCollection(existingRooms);
        const nextRooms = [...rooms];
        const items = [];
        const errors = [];
        const warnings = [];
        const sheetNames = new Set();
        let importedStudents = 0;

        (Array.isArray(sheets) ? sheets : []).forEach((sheet, sheetIndex) => {
            const roomName = String(sheet?.name ?? sheet?.roomName ?? "").trim();
            const comparableName = this.comparableText(roomName);

            if (!roomName) {
                errors.push({ sheetIndex, code: "IMPORT_ROOM_NAME_REQUIRED", message: "Every imported sheet must have a room name." });
                return;
            }

            if (sheetNames.has(comparableName)) {
                errors.push({ sheetIndex, roomName, code: "IMPORT_ROOM_DUPLICATE", message: "The import contains duplicate room names." });
                return;
            }
            sheetNames.add(comparableName);

            const parsed = sheet.parsed || sheet;
            const students = (Array.isArray(parsed.students) ? parsed.students : [])
                .map(student => this.normalizeStudent(student))
                .filter(Boolean);
            const duplicateStudents = this.findDuplicateStudents(students);

            if (duplicateStudents.length) {
                errors.push({
                    sheetIndex,
                    roomName,
                    code: "IMPORT_STUDENT_DUPLICATE",
                    message: "The imported room contains duplicate students.",
                    duplicates: duplicateStudents
                });
                return;
            }

            const existingIndex = nextRooms.findIndex(room => this.comparableText(room.name) === comparableName);
            const existing = existingIndex >= 0 ? nextRooms[existingIndex] : null;
            const room = this.normalizeRoom({
                id: existing?.id,
                name: roomName,
                level: String(parsed.level ?? existing?.level ?? "").trim(),
                teacher: String(parsed.teacher ?? existing?.teacher ?? "").trim(),
                students,
                count: students.length,
                stock: existing?.stock ?? 0
            }, existing);

            const validation = this.validateRoom(room, nextRooms, existing?.id || null);
            if (!validation.valid) {
                errors.push({ sheetIndex, roomName, code: "IMPORT_ROOM_INVALID", errors: validation.errors });
                return;
            }

            if (existingIndex >= 0) {
                room.id = existing.id;
                room.stock = this.numberOrZero(existing.stock);
                nextRooms[existingIndex] = room;
                warnings.push({ roomId: room.id, roomName, code: "IMPORT_ROOM_UPDATED", message: "Existing room data will be updated while preserving its id and stock." });
            } else {
                nextRooms.push(room);
            }

            importedStudents += students.length;
            items.push({ room, isUpdate: existingIndex >= 0, studentCount: students.length });
        });

        return {
            valid: errors.length === 0,
            rooms: nextRooms,
            items,
            errors,
            warnings,
            importedStudents,
            roomCount: items.length
        };
    }

    async importRooms(sheets = []) {
        const repository = this.ensureRepository();
        const rawRooms = await repository.loadRooms();
        const preview = this.prepareImport(sheets, rawRooms);

        if (!preview.valid) {
            return { ok: false, code: "ROOM_IMPORT_INVALID", ...preview };
        }

        await repository.saveRooms(preview.rooms);
        return { ok: true, ...preview };
    }

    buildDeletionReport(roomId, context = {}) {
        const normalizedRoomId = String(roomId || "").trim();
        const rooms = this.normalizeCollection(context.rooms);
        const room = rooms.find(candidate => candidate.id === normalizedRoomId) || null;
        const roomStock = context.roomStock && typeof context.roomStock === "object" ? context.roomStock : {};
        const roomStockRecordExists = Object.prototype.hasOwnProperty.call(roomStock, normalizedRoomId);
        const roomStockValue = this.numberOrZero(roomStock[normalizedRoomId] ?? room?.stock);

        const dependencies = {
            roomStock: roomStockRecordExists || roomStockValue !== 0 ? 1 : 0,
            distributes: this.countRoomRecords(context.distributes, normalizedRoomId),
            attendance: this.countAttendanceRecords(context.attendance, normalizedRoomId),
            absentMilk: this.countRoomRecords(context.absentMilk, normalizedRoomId),
            retroMilk: this.countRoomRecords(context.retroMilk, normalizedRoomId),
            vacationMilk: this.countRoomRecords(context.vacationMilk, normalizedRoomId),
            stockTransactions: this.countRoomRecords(context.stockTransactions, normalizedRoomId)
        };

        const totalReferences = Object.values(dependencies).reduce((sum, count) => sum + count, 0);

        return {
            roomId: normalizedRoomId,
            roomName: room?.name || "",
            roomFound: Boolean(room),
            roomStockRecordExists,
            roomStockValue,
            dependencies,
            totalReferences,
            blocked: !room || totalReferences > 0
        };
    }

    async deleteRoom(roomId) {
        const repository = this.ensureRepository();
        const context = await repository.loadRoomContext();
        const report = this.buildDeletionReport(roomId, context);

        if (!report.roomFound) {
            return { ok: false, code: "ROOM_NOT_FOUND", report };
        }

        if (report.blocked) {
            return { ok: false, code: "ROOM_HAS_DEPENDENCIES", report };
        }

        const rooms = this.normalizeCollection(context.rooms);
        const nextRooms = rooms.filter(room => room.id !== String(roomId));
        await repository.saveRooms(nextRooms);

        return { ok: true, deletedRoomId: String(roomId), rooms: nextRooms, report };
    }

    countRoomRecords(rawRecords, roomId) {
        return this.normalizeRecords(rawRecords).filter(record =>
            String(record?.roomId ?? record?.classId ?? "") === String(roomId)
        ).length;
    }

    countAttendanceRecords(rawAttendance, roomId) {
        if (!rawAttendance || typeof rawAttendance !== "object") {
            return 0;
        }

        return Object.entries(rawAttendance).filter(([key, record]) => {
            const recordRoomId = String(record?.roomId ?? record?.classId ?? "");
            if (recordRoomId === String(roomId)) {
                return true;
            }

            const attendanceKey = String(key || "");
            return attendanceKey === String(roomId) || attendanceKey.startsWith(`${roomId}_`);
        }).length;
    }

    normalizeRecords(rawRecords) {
        if (Array.isArray(rawRecords)) {
            return rawRecords.filter(Boolean);
        }

        if (!rawRecords || typeof rawRecords !== "object") {
            return [];
        }

        return Object.values(rawRecords).filter(Boolean);
    }

    comparableText(value) {
        return String(value || "").trim().replace(/\s+/g, " ").toLocaleLowerCase("th-TH");
    }

    numberOrZero(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }
}

window.RoomService = new RoomService();
