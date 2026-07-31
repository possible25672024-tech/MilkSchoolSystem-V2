class AdminStudentService {
    constructor(roomService = window.RoomService) {
        this.roomService = roomService;
    }

    ensureRoomService() {
        if (!this.roomService) {
            this.roomService = window.RoomService;
        }
        const required = [
            "loadRooms",
            "createRoom",
            "updateRoom",
            "deleteRoom",
            "prepareImportSnapshot",
            "confirmImportSnapshot"
        ];
        const missing = required.find(method => !this.roomService?.[method]);
        if (missing) {
            throw new Error(`Admin Student requires RoomService.${missing}.`);
        }
        return this.roomService;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            const error = new Error("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
            error.code = "ADMIN_SESSION_REQUIRED";
            throw error;
        }
        return session;
    }

    async prepareImport(session, sheets = []) {
        this.assertAdmin(session);
        return this.ensureRoomService().prepareImportSnapshot(sheets);
    }

    async confirmImport(session, snapshot = {}) {
        this.assertAdmin(session);
        return this.ensureRoomService().confirmImportSnapshot(snapshot);
    }

    async createRoom(session, input = {}) {
        this.assertAdmin(session);
        return this.ensureRoomService().createRoom(input);
    }

    async updateRoom(session, roomId, changes = {}) {
        this.assertAdmin(session);
        return this.ensureRoomService().updateRoom(roomId, changes);
    }

    async deleteRoom(session, roomId) {
        this.assertAdmin(session);
        return this.ensureRoomService().deleteRoom(roomId);
    }

    async loadReport(session) {
        this.assertAdmin(session);
        const rooms = await this.ensureRoomService().loadRooms();
        return this.buildReport(rooms);
    }

    buildReport(rawRooms = []) {
        const rooms = (Array.isArray(rawRooms) ? rawRooms : [])
            .map(room => this.buildRoomReport(room))
            .sort((left, right) => left.name.localeCompare(right.name, "th"));
        const totals = rooms.reduce((result, room) => {
            result.rooms += 1;
            result.students += room.total;
            result.male += room.male;
            result.female += room.female;
            result.unknown += room.unknown;
            return result;
        }, { rooms: 0, students: 0, male: 0, female: 0, unknown: 0 });

        return {
            generatedAt: new Date().toISOString(),
            totals,
            rooms
        };
    }

    buildRoomReport(room = {}) {
        const students = this.actualStudents(room.students)
            .map((student, index) => this.buildStudentRow(student, index));
        const configuredCount = this.nonNegativeInteger(room.count);
        const total = students.length || configuredCount;
        const counts = students.reduce((result, student) => {
            result[student.genderType] += 1;
            return result;
        }, { male: 0, female: 0, unknown: 0 });
        if (!students.length) {
            counts.unknown = total;
        }

        return {
            id: String(room.id || ""),
            name: String(room.name || room.roomName || room.id || "—").trim(),
            level: String(room.level || "").trim(),
            teacher: String(room.teacher || room.teacherName || "").trim(),
            total,
            male: counts.male,
            female: counts.female,
            unknown: counts.unknown,
            students
        };
    }

    actualStudents(rawStudents) {
        const students = Array.isArray(rawStudents)
            ? rawStudents
            : Object.values(rawStudents || {});
        return students.filter(student =>
            student &&
            typeof student === "object" &&
            !this.isGeneratedStudent(student)
        );
    }

    isGeneratedStudent(student = {}) {
        const id = String(student.id || student.studentId || "").trim();
        const name = String(student.name || student.fullName || "").trim();
        return /^student_\d+$/i.test(id) && /^นักเรียนคนที่\s*\d+$/i.test(name);
    }

    buildStudentRow(student = {}, index = 0) {
        const firstName = String(student["ชื่อ"] || student.firstName || "").trim();
        const lastName = String(
            student["นามสกุล"] || student.lastName || student.surname || ""
        ).trim();
        const name = String(
            student["ชื่อ-นามสกุล"] ||
            student["ชื่อ - นามสกุล"] ||
            student.name ||
            student.fullName ||
            `${firstName} ${lastName}`
        ).replace(/\s+/g, " ").trim();
        const genderType = this.genderType(
            student["เพศ"] ?? student.gender ?? student.sex
        );

        return {
            number: String(
                student["เลขที่"] || student.number || student.no || student.num || index + 1
            ),
            studentId: String(
                student["รหัส"] ||
                student["รหัสประจำตัว"] ||
                student["รหัสนักเรียน"] ||
                student.id ||
                student.studentId ||
                ""
            ).trim(),
            citizenId: String(
                student["เลขประจำตัว 13 หลัก"] ||
                student["เลขประจำตัวประชาชน"] ||
                student.citizenId ||
                ""
            ).trim(),
            name: name || `ไม่ระบุชื่อ ${index + 1}`,
            gender: genderType === "male" ? "ชาย" : genderType === "female" ? "หญิง" : "ไม่ระบุ",
            genderType,
            source: { ...student }
        };
    }

    genderType(rawValue) {
        const value = String(rawValue ?? "").trim();
        const comparable = value.toLocaleLowerCase("th-TH");
        if (
            comparable.includes("หญิง") ||
            comparable.includes("เด็กห") ||
            comparable.includes("ด.ญ") ||
            ["ญ", "ห", "female", "f", "girl", "2"].includes(comparable)
        ) {
            return "female";
        }
        if (
            comparable.includes("ชาย") ||
            comparable.includes("เด็กช") ||
            comparable.includes("ด.ช") ||
            ["ช", "ด", "male", "m", "boy", "1"].includes(comparable)
        ) {
            return "male";
        }
        return "unknown";
    }

    buildCsv(report = {}) {
        const rows = [
            ["ห้องเรียน", "ระดับชั้น", "ครูประจำชั้น", "เลขที่", "รหัสนักเรียน", "เลขประจำตัวประชาชน", "ชื่อ-นามสกุล", "เพศ"]
        ];
        (report.rooms || []).forEach(room => {
            if (!room.students.length) {
                rows.push([room.name, room.level, room.teacher, "", "", "", `ไม่มีรายชื่อ (${room.total} คน)`, "ไม่ระบุ"]);
                return;
            }
            room.students.forEach(student => {
                rows.push([
                    room.name,
                    room.level,
                    room.teacher,
                    student.number,
                    student.studentId,
                    student.citizenId,
                    student.name,
                    student.gender
                ]);
            });
        });
        return `\uFEFF${rows.map(row => row.map(value => this.csvCell(value)).join(",")).join("\r\n")}`;
    }

    csvCell(value) {
        return `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
    }

    nonNegativeInteger(value) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : 0;
    }
}

window.AdminStudentService = new AdminStudentService();
