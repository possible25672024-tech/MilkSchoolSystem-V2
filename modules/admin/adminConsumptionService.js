class AdminConsumptionService {
    constructor(
        attendanceRepository = window.AttendanceRepository,
        stockRepository = window.StockRepository,
        options = {}
    ) {
        this.attendanceRepository = attendanceRepository;
        this.stockRepository = stockRepository;
        this.clock = options.clock || (() => new Date());
    }

    ensureDependencies() {
        this.attendanceRepository ||= window.AttendanceRepository;
        this.stockRepository ||= window.StockRepository;
        if (!this.attendanceRepository?.loadAttendanceSummaries) {
            throw new Error("Attendance summary repository is not available.");
        }
        if (!this.stockRepository?.loadRooms) {
            throw new Error("Room repository is not available for the drinking overview.");
        }
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            const error = new Error("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
            error.code = "ADMIN_SESSION_REQUIRED";
            throw error;
        }
    }

    entries(collection = {}) {
        if (Array.isArray(collection)) {
            return collection
                .map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }
        return Object.entries(collection || {})
            .filter(([, record]) => record && typeof record === "object");
    }

    realStudents(room = {}) {
        const students = Array.isArray(room.students)
            ? room.students
            : Object.values(room.students || {});
        return students.filter((student, index) => {
            if (!student || typeof student !== "object") return false;
            const id = String(
                student.id || student.studentId || student.code || student["รหัส"] || index
            );
            return !/^student[_-]\d+$/i.test(id);
        });
    }

    normalizeRooms(collection = {}) {
        return this.entries(collection)
            .map(([key, room]) => {
                const students = this.realStudents(room);
                return {
                    id: String(room.id || room.roomId || key),
                    name: String(room.name || room.roomName || room.className || key),
                    teacher: String(room.teacher || room.teacherName || "ครูประจำชั้น"),
                    students: students.length || Math.max(0, Number(room.count ?? room.studentCount) || 0)
                };
            })
            .filter(room => room.id)
            .sort((left, right) => left.name.localeCompare(right.name, "th", { numeric: true }));
    }

    counts(record = {}, room = {}) {
        const values = Object.values(record.data || {});
        const present = values.filter(value => value === "present").length;
        const absent = values.filter(value => value === "absent").length;
        const checked = present + absent;
        const students = Math.max(0, Number(room.students) || checked);
        return {
            present,
            absent,
            checked,
            unchecked: Math.max(0, students - checked),
            students
        };
    }

    normalizeRecords(records = [], rooms = []) {
        const roomIndex = new Map(rooms.map(room => [room.id, room]));
        return (records || []).map(record => {
            const room = roomIndex.get(String(record.roomId || "")) || {
                id: String(record.roomId || ""),
                name: String(record.roomName || record.roomId || "—"),
                teacher: String(record.teacher || "ครูประจำชั้น"),
                students: Object.keys(record.data || {}).length
            };
            return {
                ...record,
                roomName: String(record.roomName || room.name),
                teacher: String(record.teacher || room.teacher),
                ...this.counts(record, room)
            };
        }).sort((left, right) => (
            String(right.savedAt || right.date).localeCompare(String(left.savedAt || left.date))
                || left.roomName.localeCompare(right.roomName, "th", { numeric: true })
        ));
    }

    monthRange(month) {
        const normalized = String(month || "").trim();
        if (!/^\d{4}-\d{2}$/.test(normalized)) {
            throw new Error("กรุณาเลือกเดือนที่ถูกต้อง");
        }
        const [year, monthNumber] = normalized.split("-").map(Number);
        const end = new Date(year, monthNumber, 0);
        return {
            startDate: `${normalized}-01`,
            endDate: `${year}-${String(monthNumber).padStart(2, "0")}-${String(end.getDate()).padStart(2, "0")}`
        };
    }

    today() {
        const date = this.clock();
        const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
        return local.toISOString().slice(0, 10);
    }

    async loadOverview(session, date = this.today()) {
        this.assertAdmin(session);
        this.ensureDependencies();
        const month = String(date).slice(0, 7);
        const range = this.monthRange(month);
        const [rawRooms, rawRecords] = await Promise.all([
            this.stockRepository.loadRooms(),
            this.attendanceRepository.loadAttendanceSummaries(range)
        ]);
        const rooms = this.normalizeRooms(rawRooms);
        const records = this.normalizeRecords(rawRecords, rooms);
        const todayRecords = records.filter(record => record.date === date);
        const todayIndex = new Map(todayRecords.map(record => [record.roomId, record]));
        const presentToday = todayRecords.reduce((sum, record) => sum + record.present, 0);
        const absentToday = todayRecords.reduce((sum, record) => sum + record.absent, 0);
        const monthPresent = records.reduce((sum, record) => sum + record.present, 0);
        const monthChecked = records.reduce((sum, record) => sum + record.checked, 0);
        const roomStatuses = rooms.map(room => {
            const record = todayIndex.get(room.id);
            const checked = record?.checked || 0;
            const status = !record ? "missing" : checked >= room.students ? "complete" : "partial";
            return {
                roomId: room.id,
                roomName: room.name,
                teacher: room.teacher,
                students: room.students,
                present: record?.present || 0,
                absent: record?.absent || 0,
                unchecked: record?.unchecked ?? room.students,
                savedAt: record?.savedAt || "",
                status
            };
        });
        return {
            date,
            rooms: rooms.length,
            students: rooms.reduce((sum, room) => sum + room.students, 0),
            presentToday,
            absentToday,
            monthlyRate: monthChecked ? Math.round((monthPresent / monthChecked) * 1000) / 10 : 0,
            latest: records.slice(0, 10),
            roomStatuses
        };
    }

    async loadHistory(session, filters = {}) {
        this.assertAdmin(session);
        this.ensureDependencies();
        const range = this.monthRange(filters.month || this.today().slice(0, 7));
        const roomId = String(filters.roomId || "").trim();
        const [rawRooms, rawRecords] = await Promise.all([
            this.stockRepository.loadRooms(),
            this.attendanceRepository.loadAttendanceSummaries({ ...range, roomId })
        ]);
        const rooms = this.normalizeRooms(rawRooms);
        return {
            rooms,
            month: String(filters.month || this.today().slice(0, 7)),
            records: this.normalizeRecords(rawRecords, rooms)
        };
    }
}

window.AdminConsumptionService = new AdminConsumptionService();
