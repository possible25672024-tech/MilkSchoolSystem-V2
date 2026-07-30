class RoomRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService, stockRepository = window.StockRepository) {
        super(firebaseService);
        this.stockRepository = stockRepository;
        this.appRoot = "milkApp";
    }

    path(child = "") {
        const cleanChild = String(child).replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    loadRooms() {
        return this.get(this.path("rooms"));
    }

    saveRooms(rooms) {
        return this.set(this.path("rooms"), rooms);
    }

    async loadRoom(roomId) {
        this.requireRoomId(roomId);
        const rooms = await this.loadRooms();

        if (Array.isArray(rooms)) {
            return rooms.find(room => String(room?.id || "") === String(roomId)) || null;
        }

        if (!rooms || typeof rooms !== "object") {
            return null;
        }

        const direct = rooms[roomId];
        if (direct && typeof direct === "object") {
            return { ...direct, id: String(direct.id || roomId) };
        }

        const entry = Object.entries(rooms).find(([, room]) => String(room?.id || "") === String(roomId));
        return entry ? { ...entry[1], id: String(entry[1]?.id || entry[0]) } : null;
    }

    async updateRoomTeacher(roomId, teacher) {
        this.requireRoomId(roomId);
        const normalizedRoomId = String(roomId).trim();
        const rooms = await this.loadRooms();
        const entries = Array.isArray(rooms)
            ? rooms.map((room, index) => [String(index), room])
            : Object.entries(rooms || {});
        const match = entries.find(([key, room]) =>
            String(room?.id || key) === normalizedRoomId
        );

        if (!match) {
            const error = new Error("The authenticated teacher room was not found.");
            error.code = "TEACHER_ROOM_NOT_FOUND";
            throw error;
        }

        const storageKey = match[0];
        await this.set(this.path(`rooms/${storageKey}/teacher`), String(teacher));
        return {
            roomId: normalizedRoomId,
            storageKey
        };
    }

    loadRoomStock(roomId) {
        this.requireRoomId(roomId);
        return this.get(this.path(`roomStock/${roomId}`));
    }

    loadDistributions() {
        return this.get(this.path("distributes"));
    }

    loadAttendance() {
        return this.get(this.path("mcAttendance"));
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

    loadLedger() {
        return this.get(this.path("stockTransactions"));
    }

    async loadRoomDependencies() {
        const [roomStock, distributes, attendance, absentMilk, retroMilk, vacationMilk, stockTransactions] = await Promise.all([
            this.get(this.path("roomStock")),
            this.loadDistributions(),
            this.loadAttendance(),
            this.loadAbsentMilk(),
            this.loadRetroMilk(),
            this.loadVacationMilk(),
            this.loadLedger()
        ]);

        return {
            roomStock: roomStock || {},
            distributes: distributes || [],
            attendance: attendance || {},
            absentMilk: absentMilk || {},
            retroMilk: retroMilk || {},
            vacationMilk: vacationMilk || {},
            stockTransactions: stockTransactions || {}
        };
    }

    async loadRoomContext() {
        const [rooms, dependencies] = await Promise.all([
            this.loadRooms(),
            this.loadRoomDependencies()
        ]);

        return {
            rooms: rooms || [],
            ...dependencies
        };
    }

    applyMultiLocationUpdate(updates) {
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Room updates must be an object.");
        }

        return this.update(this.path(), updates);
    }

    requireRoomId(roomId) {
        if (!String(roomId || "").trim()) {
            throw new Error("A room id is required.");
        }
    }
}

window.RoomRepository = new RoomRepository();
