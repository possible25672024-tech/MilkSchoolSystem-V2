class StockRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child = "") {
        const cleanChild = String(child).replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    loadMainStock() {
        return this.get(this.path("stock"));
    }

    saveMainStock(value) {
        return this.set(this.path("stock"), value);
    }

    loadRoomStocks() {
        return this.get(this.path("roomStock"));
    }

    loadRoomStock(roomId) {
        this.requireRoomId(roomId);
        return this.get(this.path(`roomStock/${roomId}`));
    }

    saveRoomStock(roomId, value) {
        this.requireRoomId(roomId);
        return this.set(this.path(`roomStock/${roomId}`), value);
    }

    loadRooms() {
        return this.get(this.path("rooms"));
    }

    loadReceives() {
        return this.get(this.path("receives"));
    }

    async loadReceiptSummaries(options = {}) {
        const concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, Math.min(12, options.concurrency))
            : 6;
        const fields = [
            "date",
            "createdAt",
            "crates",
            "extra",
            "perCrate",
            "total",
            "note",
            "supplier"
        ];
        const keyIndex = await this.get(this.path("receives"), { shallow: true });
        const keys = Object.keys(keyIndex || {}).sort((left, right) => left.localeCompare(right));
        const summaries = Object.fromEntries(keys.map(key => [key, { id: key }]));
        const tasks = keys.flatMap(key => fields.map(field => ({ key, field })));
        let cursor = 0;

        const worker = async () => {
            while (cursor < tasks.length) {
                const index = cursor;
                cursor += 1;
                const { key, field } = tasks[index];
                const value = await this.get(this.path(`receives/${key}/${field}`));
                if (value !== null && value !== undefined) summaries[key][field] = value;
            }
        };
        await Promise.all(
            Array.from(
                { length: Math.min(concurrency, tasks.length || 1) },
                () => worker()
            )
        );
        return summaries;
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

    saveLedgerEntry(entry) {
        if (!entry?.id) {
            throw new Error("A ledger entry id is required.");
        }

        return this.set(this.path(`stockTransactions/${entry.id}`), entry);
    }

    applyMultiLocationUpdate(updates) {
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Stock updates must be an object.");
        }

        return this.update(this.path(), updates);
    }

    async loadStockSnapshot() {
        const [
            stock,
            roomStock,
            rooms,
            receives,
            distributes,
            attendance,
            absentMilk,
            retroMilk,
            vacationMilk,
            stockTransactions
        ] = await Promise.all([
            this.loadMainStock(),
            this.loadRoomStocks(),
            this.loadRooms(),
            this.loadReceives(),
            this.loadDistributions(),
            this.loadAttendance(),
            this.loadAbsentMilk(),
            this.loadRetroMilk(),
            this.loadVacationMilk(),
            this.loadLedger()
        ]);

        return {
            stock: stock ?? 0,
            roomStock: roomStock || {},
            rooms: rooms || [],
            receives: receives || [],
            distributes: distributes || [],
            attendance: attendance || {},
            absentMilk: absentMilk || {},
            retroMilk: retroMilk || {},
            vacationMilk: vacationMilk || {},
            stockTransactions: stockTransactions || {}
        };
    }

    requireRoomId(roomId) {
        if (!String(roomId || "").trim()) {
            throw new Error("A room id is required.");
        }
    }
}

window.StockRepository = new StockRepository();
