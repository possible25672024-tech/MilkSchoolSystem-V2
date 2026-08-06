class RetroactiveMilkRepository extends BaseRepository {
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
            throw new Error("A Retroactive Milk record id is required.");
        }
        return normalized;
    }

    loadRoomRecords(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path("retroMilk"), {
            orderBy: "roomId",
            equalTo: normalizedRoomId
        });
    }

    loadRecord(recordId) {
        const normalizedId = String(recordId || "").trim();
        if (!normalizedId) {
            return Promise.resolve(null);
        }
        return this.get(this.path(`retroMilk/${normalizedId}`));
    }

    async createRecord(record) {
        const result = await this.push(this.path("retroMilk"), record);
        const id = String(result?.name || "").trim();
        if (!id) {
            throw new Error("Firebase did not return a Retroactive Milk record id.");
        }
        return { id, record };
    }

    deleteRecord(recordId) {
        return this.remove(this.path(`retroMilk/${this.requireRecordId(recordId)}`));
    }

    updateRecord(recordId, changes = {}) {
        return this.update(this.path(`retroMilk/${this.requireRecordId(recordId)}`), changes);
    }
}

window.RetroactiveMilkRepository = new RetroactiveMilkRepository();
