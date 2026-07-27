class AttendanceRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child = "") {
        const cleanChild = String(child).replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    requireRoomId(roomId) {
        const normalized = String(roomId || "").trim();
        if (!normalized || normalized === "__admin__") {
            throw new Error("A valid room id is required.");
        }
        return normalized;
    }

    requireDate(date) {
        const normalized = String(date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            throw new Error("Attendance date must use YYYY-MM-DD format.");
        }
        return normalized;
    }

    attendanceKey(roomId, date) {
        return `${this.requireRoomId(roomId)}_${this.requireDate(date)}`;
    }

    loadAttendanceRecord(roomId, date) {
        const key = this.attendanceKey(roomId, date);
        return this.get(this.path(`mcAttendance/${key}`));
    }

    loadRoomAttendance(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path("mcAttendance"), {
            orderBy: "$key",
            startAt: `${normalizedRoomId}_`,
            endAt: `${normalizedRoomId}_\uf8ff`
        });
    }

    loadRoomStock(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path(`roomStock/${normalizedRoomId}`));
    }

    async loadMutationState(roomId, date) {
        const [attendance, roomStock] = await Promise.all([
            this.loadAttendanceRecord(roomId, date),
            this.loadRoomStock(roomId)
        ]);

        return {
            attendance: attendance || null,
            roomStock: roomStock ?? 0
        };
    }

    applyAttendanceMutation(updates) {
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Attendance updates must be an object.");
        }

        return this.update(this.path(), updates);
    }
}

window.AttendanceRepository = new AttendanceRepository();
