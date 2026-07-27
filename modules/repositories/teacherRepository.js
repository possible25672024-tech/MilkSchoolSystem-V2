class TeacherRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child) {
        return `${this.appRoot}/${String(child || "").replace(/^\/+/, "")}`;
    }

    loadSettings() {
        return this.get(this.path("settings"));
    }

    loadRooms() {
        return this.get(this.path("rooms"));
    }

    loadRoomById(roomId) {
        const normalizedRoomId = String(roomId || "").trim();
        if (!normalizedRoomId) {
            return Promise.resolve({});
        }

        return this.get(this.path("rooms"), {
            orderBy: "id",
            equalTo: normalizedRoomId
        });
    }

    loadRoomStock(roomId) {
        return this.get(this.path(`roomStock/${String(roomId || "")}`));
    }

    loadDistributions() {
        return this.get(this.path("distributes"));
    }

    loadAttendanceForRoom(roomId) {
        const normalizedRoomId = String(roomId || "").trim();
        if (!normalizedRoomId) {
            return Promise.resolve({});
        }

        return this.get(this.path("mcAttendance"), {
            orderBy: "$key",
            startAt: `${normalizedRoomId}_`,
            endAt: `${normalizedRoomId}_\uf8ff`
        });
    }

    async loadAttendanceSummaryForDate(roomId, date) {
        const normalizedRoomId = String(roomId || "").trim();
        const normalizedDate = String(date || "").trim();
        if (!normalizedRoomId || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
            return {};
        }

        const key = `${normalizedRoomId}_${normalizedDate}`;
        const data = await this.get(this.path(`mcAttendance/${key}/data`));
        if (!data || typeof data !== "object") {
            return {};
        }

        return {
            [key]: {
                roomId: normalizedRoomId,
                classId: normalizedRoomId,
                clsId: normalizedRoomId,
                date: normalizedDate,
                data
            }
        };
    }

    loadAbsentMilk() {
        return this.get(this.path("absentMilk"));
    }

    loadRetroMilk() {
        return this.get(this.path("retroMilk"));
    }

    loadVacationMilk() {
        return this.get(this.path("vacationMilk"));
    }

    loadStockTransactions() {
        return this.get(this.path("stockTransactions"));
    }

    loadUpdatedAt() {
        return this.get(this.path("updatedAt"));
    }

    async loadTeacherCoreSnapshot(roomId, options = {}) {
        const attendanceDate = String(options?.attendanceDate || "").trim();
        const attendancePromise = attendanceDate
            ? this.loadAttendanceSummaryForDate(roomId, attendanceDate)
            : this.loadAttendanceForRoom(roomId);

        const [settings, rooms, roomStock, attendance, updatedAt] = await Promise.all([
            this.loadSettings(),
            this.loadRoomById(roomId),
            this.loadRoomStock(roomId),
            attendancePromise,
            this.loadUpdatedAt()
        ]);

        return {
            settings: settings || {},
            rooms: rooms || [],
            roomStock,
            attendance: attendance || {},
            updatedAt: updatedAt || {},
            attendanceScope: attendanceDate
                ? { mode: "date-summary", date: attendanceDate }
                : { mode: "room-history", date: null },
            extrasLoaded: false
        };
    }

    async loadTeacherExtraSnapshot() {
        const [distributes, absentMilk, retroMilk, vacationMilk, stockTransactions] = await Promise.all([
            this.loadDistributions(),
            this.loadAbsentMilk(),
            this.loadRetroMilk(),
            this.loadVacationMilk(),
            this.loadStockTransactions()
        ]);

        return {
            distributes: distributes || [],
            absentMilk: absentMilk || {},
            retroMilk: retroMilk || {},
            vacationMilk: vacationMilk || {},
            stockTransactions: stockTransactions || [],
            extrasLoaded: true
        };
    }

    async loadTeacherSnapshot(roomId, options = {}) {
        const includeExtras = options?.includeExtras !== false;

        if (!includeExtras) {
            const core = await this.loadTeacherCoreSnapshot(roomId, options);
            return {
                ...core,
                distributes: [],
                absentMilk: {},
                retroMilk: {},
                vacationMilk: {},
                stockTransactions: []
            };
        }

        const [core, extras] = await Promise.all([
            this.loadTeacherCoreSnapshot(roomId, options),
            this.loadTeacherExtraSnapshot()
        ]);

        return {
            ...core,
            ...extras,
            extrasLoaded: true
        };
    }
}

window.TeacherRepository = new TeacherRepository();
