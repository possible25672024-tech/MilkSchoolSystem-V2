class AdminRoomService {
    constructor(
        loginService = window.LoginService,
        teacherService = window.TeacherService,
        attendanceService = window.AttendanceService,
        pendingMilkService = window.PendingMilkService,
        retroactiveMilkService = window.RetroactiveMilkService,
        vacationMilkService = window.VacationMilkService,
        repositories = {}
    ) {
        this.loginService = loginService;
        this.teacherService = teacherService;
        this.attendanceService = attendanceService;
        this.pendingMilkService = pendingMilkService;
        this.retroactiveMilkService = retroactiveMilkService;
        this.vacationMilkService = vacationMilkService;
        this.repositories = {
            attendance: repositories.attendance || window.AttendanceRepository,
            pending: repositories.pending || window.PendingMilkRepository,
            retroactive: repositories.retroactive || window.RetroactiveMilkRepository,
            vacation: repositories.vacation || window.VacationMilkRepository
        };
        this.quarantinedRoomId = "mqn0z13eyx5b";
        this.quarantinedAttendanceDate = "2026-07-28";
    }

    businessError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            throw this.businessError(
                "ADMIN_SESSION_REQUIRED",
                "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ"
            );
        }
        return session;
    }

    ensureDependencies() {
        this.loginService ||= window.LoginService;
        this.teacherService ||= window.TeacherService;
        this.attendanceService ||= window.AttendanceService;
        this.pendingMilkService ||= window.PendingMilkService;
        this.retroactiveMilkService ||= window.RetroactiveMilkService;
        this.vacationMilkService ||= window.VacationMilkService;
        this.repositories.attendance ||= window.AttendanceRepository;
        this.repositories.pending ||= window.PendingMilkRepository;
        this.repositories.retroactive ||= window.RetroactiveMilkRepository;
        this.repositories.vacation ||= window.VacationMilkRepository;

        const required = [
            [this.loginService, "loadLoginOptions"],
            [this.teacherService, "loadTeacherView"],
            [this.teacherService, "buildDashboard"],
            [this.attendanceService, "saveAttendance"],
            [this.attendanceService, "deleteAttendance"],
            [this.pendingMilkService, "remove"],
            [this.retroactiveMilkService, "remove"],
            [this.vacationMilkService, "remove"]
        ];
        const missing = required.find(([owner, method]) => !owner?.[method]);
        if (missing) {
            throw this.businessError(
                "ADMIN_ROOM_DEPENDENCY_UNAVAILABLE",
                `Admin room dependency ${missing[1]} is not available.`
            );
        }

        const requiredRepositories = [
            [this.repositories.attendance, "loadRoomAttendanceSummaries"],
            [this.repositories.attendance, "loadAttendanceRecord"],
            [this.repositories.pending, "loadRoomPendingRecords"],
            [this.repositories.pending, "loadPendingRecord"],
            [this.repositories.retroactive, "loadRoomRecords"],
            [this.repositories.retroactive, "loadRecord"],
            [this.repositories.vacation, "loadRoomRecords"],
            [this.repositories.vacation, "loadRecord"]
        ];
        const missingRepository = requiredRepositories.find(([owner, method]) => !owner?.[method]);
        if (missingRepository) {
            throw this.businessError(
                "ADMIN_ROOM_REPOSITORY_UNAVAILABLE",
                `Admin room repository method ${missingRepository[1]} is not available.`
            );
        }
    }

    cloneRoom(room = {}) {
        return {
            ...room,
            id: String(room.id || "").trim(),
            name: String(room.name || room.roomName || room.id || "").trim(),
            teacher: String(room.teacher || room.teacherName || "ครูประจำชั้น").trim()
        };
    }

    normalizeRoomStudents(room = {}) {
        const rawStudents = Array.isArray(room.students)
            ? room.students
            : Object.values(room.students || {});
        const hasIdentity = student => {
            if (!student || typeof student !== "object") return false;
            return [
                student["รหัส"],
                student["รหัสประจำตัว"],
                student.id,
                student.studentId,
                student.code,
                student["ชื่อ-นามสกุล"],
                student["ชื่อ"],
                student.name,
                student.fullName,
                student.firstName
            ].some(value => String(value || "").trim());
        };
        const actualStudents = rawStudents.filter(hasIdentity);
        if (this.teacherService?.normalizeStudents) {
            return this.teacherService.normalizeStudents(actualStudents);
        }
        return actualStudents.map(student => ({ ...student }));
    }

    async loadRooms(adminSession, options = {}) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const result = await this.loginService.loadLoginOptions({
            forceReload: options.forceReload === true
        });
        return (result.rooms || [])
            .map(room => this.cloneRoom(room))
            .filter(room => room.id && room.id !== "__admin__")
            .sort((a, b) => a.name.localeCompare(b.name, "th"));
    }

    buildDelegatedSession(adminSession, room) {
        this.assertAdmin(adminSession);
        const normalizedRoom = this.cloneRoom(room);
        if (!normalizedRoom.id) {
            throw this.businessError("ADMIN_ROOM_REQUIRED", "กรุณาเลือกห้องเรียน");
        }
        return {
            classId: normalizedRoom.id,
            className: normalizedRoom.name,
            roomId: normalizedRoom.id,
            roomName: normalizedRoom.name,
            teacher: normalizedRoom.teacher,
            schoolName: String(adminSession.schoolName || "โรงเรียน"),
            role: "teacher",
            isAdmin: false,
            adminOverride: true,
            delegatedByAdmin: true,
            roomSnapshot: normalizedRoom,
            authenticatedAt: new Date().toISOString()
        };
    }

    assertDelegationAllowed(roomId) {
        if (String(roomId || "") === this.quarantinedRoomId) {
            throw this.businessError(
                "ADMIN_ROOM_QUARANTINED",
                "ห้อง อ.3-3 อยู่ระหว่างกักกันข้อมูล จึงยังไม่อนุญาตให้เปิดโหมดแก้ไข"
            );
        }
        return true;
    }

    assertAttendanceMutationAllowed(roomId, date) {
        if (
            String(roomId || "") === this.quarantinedRoomId &&
            String(date || "") === this.quarantinedAttendanceDate
        ) {
            throw this.businessError(
                "ADMIN_ATTENDANCE_QUARANTINED",
                "รายการ อ.3-3 วันที่ 2026-07-28 ถูกกักกันและห้ามแก้ไขหรือลบ"
            );
        }
        return true;
    }

    async resolveRoom(adminSession, roomId, options = {}) {
        const rooms = await this.loadRooms(adminSession, options);
        const normalizedRoomId = String(roomId || "").trim();
        const room = rooms.find(candidate => candidate.id === normalizedRoomId);
        if (!room) {
            throw this.businessError("ADMIN_ROOM_NOT_FOUND", "ไม่พบห้องเรียนที่เลือก");
        }
        return { rooms, room, session: this.buildDelegatedSession(adminSession, room) };
    }

    normalizeCollection(collection) {
        if (Array.isArray(collection)) {
            return collection
                .filter(record => record && typeof record === "object")
                .map((record, index) => ({ id: String(record.id || index), ...record }));
        }
        return Object.entries(collection || {})
            .filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => ({ id: String(record.id || id), ...record }));
    }

    countAttendance(record = {}) {
        const statuses = Object.values(record.data || {});
        return {
            present: statuses.filter(status => status === "present").length,
            absent: statuses.filter(status => status === "absent").length
        };
    }

    normalizeAttendance(attendance = {}, roomId) {
        return Object.entries(attendance || {})
            .filter(([key, record]) => (
                record &&
                (String(record.clsId || record.roomId || "") === roomId || key.startsWith(`${roomId}_`))
            ))
            .map(([key, record]) => ({
                id: key,
                key,
                date: String(record.date || key.slice(roomId.length + 1)),
                teacher: String(record.teacher || ""),
                note: "",
                ...this.countAttendance(record)
            }))
            .sort((a, b) => b.date.localeCompare(a.date));
    }

    normalizeOperations(records = []) {
        return this.normalizeCollection(records)
            .map(record => ({
                ...record,
                id: String(record.id || ""),
                date: String(record.date || record.issueDate || record.weekStart || ""),
                totalBoxes: Math.max(0, Number(record.totalBoxes ?? record.boxes ?? record.total) || 0),
                note: String(record.note || "")
            }))
            .sort((a, b) => String(b.savedAt || b.date || "").localeCompare(String(a.savedAt || a.date || "")));
    }

    async loadRoomDashboard(adminSession, roomId, options = {}) {
        this.ensureDependencies();
        const resolved = await this.resolveRoom(adminSession, roomId, options);
        const [result, attendance, pending, retroactive, vacation] = await Promise.all([
            this.teacherService.loadTeacherView(resolved.session, {
                includeExtras: false,
                attendanceMode: "none",
                roomSnapshot: resolved.room
            }),
            this.repositories.attendance.loadRoomAttendanceSummaries(resolved.room.id),
            this.repositories.pending.loadRoomPendingRecords(resolved.room.id),
            this.repositories.retroactive.loadRoomRecords(resolved.room.id),
            this.repositories.vacation.loadRoomRecords(resolved.room.id)
        ]);
        const snapshot = {
            ...result.snapshot,
            attendance: attendance || {},
            absentMilk: pending || {},
            retroMilk: retroactive || {},
            vacationMilk: vacation || {}
        };
        const dashboard = this.teacherService.buildDashboard(snapshot);
        return {
            rooms: resolved.rooms,
            room: resolved.room,
            delegatedSession: resolved.session,
            dashboard,
            records: {
                attendance: this.normalizeAttendance(snapshot.attendance, resolved.room.id),
                pending: this.normalizeOperations(snapshot.absentMilk),
                retroactive: this.normalizeOperations(snapshot.retroMilk),
                vacation: this.normalizeOperations(snapshot.vacationMilk)
            }
        };
    }

    async loadAttendanceEditor(adminSession, roomId, date) {
        this.ensureDependencies();
        const resolved = await this.resolveRoom(adminSession, roomId);
        const normalizedDate = String(date || "").trim();
        this.assertAttendanceMutationAllowed(resolved.room.id, normalizedDate);
        const record = await this.repositories.attendance.loadAttendanceRecord(
            resolved.room.id,
            normalizedDate
        );
        if (!record) {
            throw this.businessError(
                "ADMIN_ATTENDANCE_NOT_FOUND",
                "ไม่พบข้อมูลเช็กดื่มนมของวันที่เลือก"
            );
        }
        return {
            room: resolved.room,
            delegatedSession: resolved.session,
            date: normalizedDate,
            students: this.normalizeRoomStudents(resolved.room),
            record: {
                ...record,
                clsId: resolved.room.id,
                date: normalizedDate
            }
        };
    }

    async loadRecordDetail(adminSession, roomId, type, input = {}) {
        this.ensureDependencies();
        const resolved = await this.resolveRoom(adminSession, roomId);
        const normalizedType = String(type || "").trim();
        let record;
        let recordId = String(input.recordId || input.id || "").trim();

        if (normalizedType === "attendance") {
            const date = String(input.date || "").trim();
            record = await this.repositories.attendance.loadAttendanceRecord(
                resolved.room.id,
                date
            );
            recordId = `${resolved.room.id}_${date}`;
        } else {
            const loader = {
                pending: [this.repositories.pending, "loadPendingRecord"],
                retroactive: [this.repositories.retroactive, "loadRecord"],
                vacation: [this.repositories.vacation, "loadRecord"]
            }[normalizedType];
            if (!loader) {
                throw this.businessError(
                    "ADMIN_OPERATION_TYPE_INVALID",
                    "ไม่รองรับประเภทรายการนี้"
                );
            }
            record = await loader[0][loader[1]](recordId);
        }

        if (!record) {
            throw this.businessError(
                "ADMIN_OPERATION_NOT_FOUND",
                "ไม่พบรายละเอียดรายการที่เลือก"
            );
        }
        const recordRoomId = normalizedType === "attendance"
            ? resolved.room.id
            : String(record.roomId || record.classId || record.clsId || "");
        if (recordRoomId !== resolved.room.id) {
            throw this.businessError(
                "ADMIN_ROOM_MISMATCH",
                "รายการนี้ไม่ได้อยู่ในห้องที่เลือก"
            );
        }

        return {
            type: normalizedType,
            id: recordId,
            room: resolved.room,
            delegatedSession: resolved.session,
            students: this.normalizeRoomStudents(resolved.room),
            record: {
                ...record,
                roomId: resolved.room.id,
                roomName: String(record.roomName || resolved.room.name),
                teacher: String(record.teacher || resolved.room.teacher)
            }
        };
    }

    async saveAttendanceEditor(adminSession, roomId, input = {}) {
        this.ensureDependencies();
        const resolved = await this.resolveRoom(adminSession, roomId);
        const date = String(input.date || "").trim();
        this.assertAttendanceMutationAllowed(resolved.room.id, date);
        const existing = await this.repositories.attendance.loadAttendanceRecord(
            resolved.room.id,
            date
        );
        if (!existing) {
            throw this.businessError(
                "ADMIN_ATTENDANCE_NOT_FOUND",
                "ไม่พบข้อมูลเช็กดื่มนมของวันที่เลือก"
            );
        }
        return this.attendanceService.saveAttendance(resolved.session, {
            roomId: resolved.room.id,
            roomName: existing.roomName || resolved.room.name,
            date,
            year: existing.year ?? "",
            term: existing.term ?? "",
            teacher: existing.teacher || resolved.room.teacher,
            data: input.data || {},
            notes: input.notes || {},
            photos: Array.isArray(existing.photos) ? [...existing.photos] : [],
            signature: String(existing.signature || ""),
            savedAt: existing.savedAt || undefined
        });
    }

    async deleteRecord(adminSession, roomId, type, input = {}) {
        const resolved = await this.resolveRoom(adminSession, roomId);
        const recordId = String(input.recordId || input.id || "").trim();
        if (type === "attendance") {
            this.assertAttendanceMutationAllowed(resolved.room.id, input.date);
            return this.attendanceService.deleteAttendance(resolved.session, {
                roomId: resolved.room.id,
                date: String(input.date || "").trim()
            });
        }
        const service = {
            pending: this.pendingMilkService,
            retroactive: this.retroactiveMilkService,
            vacation: this.vacationMilkService
        }[type];
        if (!service?.remove) {
            throw this.businessError("ADMIN_OPERATION_TYPE_INVALID", "ไม่รองรับประเภทรายการนี้");
        }
        return service.remove(resolved.session, {
            roomId: resolved.room.id,
            recordId
        });
    }

    async updateRecordNote(adminSession, roomId, type, input = {}) {
        const resolved = await this.resolveRoom(adminSession, roomId);
        const recordId = String(input.recordId || input.id || "").trim();
        const note = String(input.note || "").trim();
        const repository = this.repositories[type];
        const methods = {
            pending: ["loadPendingRecord", "updatePendingRecord"],
            retroactive: ["loadRecord", "updateRecord"],
            vacation: ["loadRecord", "updateRecord"]
        }[type];
        if (!repository || !methods) {
            throw this.businessError("ADMIN_OPERATION_TYPE_INVALID", "ไม่รองรับประเภทรายการนี้");
        }
        const record = await repository[methods[0]](recordId);
        if (!record) {
            throw this.businessError("ADMIN_OPERATION_NOT_FOUND", "ไม่พบรายการที่ต้องการแก้ไข");
        }
        if (String(record.roomId || "") !== resolved.room.id) {
            throw this.businessError("ADMIN_ROOM_MISMATCH", "รายการนี้ไม่ได้อยู่ในห้องที่เลือก");
        }
        await repository[methods[1]](recordId, {
            note,
            teacher: resolved.room.teacher,
            updatedAt: new Date().toISOString(),
            updatedBy: "admin"
        });
        return { id: recordId, roomId: resolved.room.id, type, note, mainStockDelta: 0 };
    }
}

window.AdminRoomService = new AdminRoomService();
