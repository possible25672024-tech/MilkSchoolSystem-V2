class TeacherRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child) {
        return `${this.appRoot}/${String(child || "").replace(/^\/+/, "")}`;
    }

    loadSettings() {
        return this.get(this.path("public/appSettings"));
    }

    loadRoom(roomId) {
        return this.get(this.path(`rooms/${String(roomId || "")}`));
    }

    loadRoomStock(roomId) {
        return this.get(this.path(`roomStock/${String(roomId || "")}`));
    }

    loadRoomCollection(child, roomId) {
        const normalizedRoomId = String(roomId || "").trim();
        if (!normalizedRoomId) return Promise.resolve({});
        return this.get(this.path(child), { orderBy: "roomId", equalTo: normalizedRoomId });
    }

    loadDistributions(roomId) {
        return this.loadRoomCollection("distributes", roomId);
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

    loadAbsentMilk(roomId) {
        return this.loadRoomCollection("absentMilk", roomId);
    }

    loadRetroMilk(roomId) {
        return this.loadRoomCollection("retroMilk", roomId);
    }

    loadVacationMilk(roomId) {
        return this.loadRoomCollection("vacationMilk", roomId);
    }

    loadStockTransactions(roomId) {
        return this.loadRoomCollection("stockTransactions", roomId);
    }

    loadUpdatedAt() {
        return this.get(this.path("updatedAt"));
    }

    async loadTeacherCoreSnapshot(roomId, options = {}) {
        const attendanceDate = String(options?.attendanceDate || "").trim();
        const attendancePromise = options?.attendanceMode === "none"
            ? Promise.resolve({})
            : attendanceDate
                ? this.loadAttendanceSummaryForDate(roomId, attendanceDate)
                : this.loadAttendanceForRoom(roomId);
        const roomSnapshot = options?.roomSnapshot && typeof options.roomSnapshot === "object"
            ? options.roomSnapshot
            : null;
        const roomsPromise = roomSnapshot
            ? Promise.resolve([roomSnapshot])
            : this.loadRoom(roomId).then(room => room ? [room] : []);

        const [settings, rooms, roomStock, attendance, updatedAt] = await Promise.all([
            this.loadSettings(),
            roomsPromise,
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
            attendanceScope: options?.attendanceMode === "none"
                ? { mode: "deferred", date: null }
                : attendanceDate
                    ? { mode: "date-summary", date: attendanceDate }
                    : { mode: "room-history", date: null },
            roomSource: roomSnapshot ? "session" : "firebase-fallback",
            extrasLoaded: false
        };
    }

    async loadTeacherExtraSnapshot(roomId) {
        const [distributes, absentMilk, retroMilk, vacationMilk, stockTransactions] = await Promise.all([
            this.loadDistributions(roomId),
            this.loadAbsentMilk(roomId),
            this.loadRetroMilk(roomId),
            this.loadVacationMilk(roomId),
            this.loadStockTransactions(roomId)
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
            this.loadTeacherExtraSnapshot(roomId)
        ]);

        return {
            ...core,
            ...extras,
            extrasLoaded: true
        };
    }
}

window.TeacherRepository = new TeacherRepository();
