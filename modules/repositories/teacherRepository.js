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

    async loadTeacherCoreSnapshot(roomId) {
        const [settings, rooms, roomStock, attendance, updatedAt] = await Promise.all([
            this.loadSettings(),
            this.loadRooms(),
            this.loadRoomStock(roomId),
            this.loadAttendanceForRoom(roomId),
            this.loadUpdatedAt()
        ]);

        return {
            settings: settings || {},
            rooms: rooms || [],
            roomStock,
            attendance: attendance || {},
            updatedAt: updatedAt || {},
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
            const core = await this.loadTeacherCoreSnapshot(roomId);
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
            this.loadTeacherCoreSnapshot(roomId),
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
