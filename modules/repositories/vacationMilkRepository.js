class VacationMilkRepository extends BaseRepository {
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

    requireRecordId(recordId) {
        const normalized = String(recordId || "").trim();
        if (!normalized) {
            throw new Error("A Vacation Milk record id is required.");
        }
        return normalized;
    }

    loadRoomRecords(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path("vacationMilk"), {
            orderBy: "roomId",
            equalTo: normalizedRoomId
        });
    }

    loadRecord(recordId) {
        const normalizedId = String(recordId || "").trim();
        if (!normalizedId) {
            return Promise.resolve(null);
        }
        return this.get(this.path(`vacationMilk/${normalizedId}`));
    }

    async createRecord(record) {
        const result = await this.push(this.path("vacationMilk"), record);
        const id = String(result?.name || "").trim();
        if (!id) {
            throw new Error("Firebase did not return a Vacation Milk record id.");
        }
        return { id, record };
    }

    deleteRecord(recordId) {
        return this.remove(this.path(`vacationMilk/${this.requireRecordId(recordId)}`));
    }

    updateRecord(recordId, changes = {}) {
        return this.update(this.path(`vacationMilk/${this.requireRecordId(recordId)}`), changes);
    }
}

window.VacationMilkRepository = new VacationMilkRepository();
