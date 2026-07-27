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

    async loadTeacherSnapshot(roomId) {
        const [
            settings,
            rooms,
            roomStock,
            distributes,
            attendance,
            absentMilk,
            retroMilk,
            vacationMilk,
            stockTransactions,
            updatedAt
        ] = await Promise.all([
            this.loadSettings(),
            this.loadRooms(),
            this.loadRoomStock(roomId),
            this.loadDistributions(),
            this.loadAttendanceForRoom(roomId),
            this.loadAbsentMilk(),
            this.loadRetroMilk(),
            this.loadVacationMilk(),
            this.loadStockTransactions(),
            this.loadUpdatedAt()
        ]);

        return {
            settings: settings || {},
            rooms: rooms || [],
            roomStock,
            distributes: distributes || [],
            attendance: attendance || {},
            absentMilk: absentMilk || {},
            retroMilk: retroMilk || {},
            vacationMilk: vacationMilk || {},
            stockTransactions: stockTransactions || [],
            updatedAt: updatedAt || {}
        };
    }
}

window.TeacherRepository = new TeacherRepository();
