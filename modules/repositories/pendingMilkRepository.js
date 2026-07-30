class PendingMilkRepository extends BaseRepository {
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
            throw new Error("Pending Milk date must use YYYY-MM-DD format.");
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

    async loadAttendanceDates(roomId, dates = []) {
        const normalizedRoomId = this.requireRoomId(roomId);
        const normalizedDates = [...new Set(
            (Array.isArray(dates) ? dates : []).map(date => this.requireDate(date))
        )];
        const records = await Promise.all(
            normalizedDates.map(date => this.loadAttendanceRecord(normalizedRoomId, date))
        );

        return Object.fromEntries(
            normalizedDates
                .map((date, index) => [this.attendanceKey(normalizedRoomId, date), records[index] || null])
                .filter(([, record]) => Boolean(record))
        );
    }

    loadRoomPendingRecords(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path("absentMilk"), {
            orderBy: "roomId",
            equalTo: normalizedRoomId
        });
    }

    loadPendingRecord(recordId) {
        const normalizedId = String(recordId || "").trim();
        if (!normalizedId) {
            return Promise.resolve(null);
        }
        return this.get(this.path(`absentMilk/${normalizedId}`));
    }

    async createPendingRecord(record) {
        const result = await this.push(this.path("absentMilk"), record);
        const id = String(result?.name || "").trim();
        if (!id) {
            throw new Error("Firebase did not return a Pending Milk record id.");
        }
        return { id, record };
    }

    deletePendingRecord(recordId) {
        const normalizedId = String(recordId || "").trim();
        if (!normalizedId) {
            throw new Error("A Pending Milk record id is required.");
        }
        return this.remove(this.path(`absentMilk/${normalizedId}`));
    }

    updatePendingRecord(recordId, changes = {}) {
        const normalizedId = String(recordId || "").trim();
        if (!normalizedId) {
            throw new Error("A Pending Milk record id is required.");
        }
        return this.update(this.path(`absentMilk/${normalizedId}`), changes);
    }
}

window.PendingMilkRepository = new PendingMilkRepository();
