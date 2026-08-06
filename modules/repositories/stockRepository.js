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

    loadReceipt(receiptId) {
        const id = String(receiptId || "").trim();
        if (!id) throw new Error("A receipt id is required.");
        return this.get(this.path(`receives/${encodeURIComponent(id)}`));
    }

    loadReceiptWithEtag(receiptId) {
        const id = String(receiptId || "").trim();
        if (!id) throw new Error("A receipt id is required.");
        return this.ensureService().getWithEtag(
            this.path(`receives/${encodeURIComponent(id)}`)
        );
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
            "year",
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

    loadReceiptLockVersioned() {
        return this.ensureService().getWithEtag(
            this.path("stockOperations/receiptLock")
        );
    }

    setReceiptLockIfMatch(lock, etag) {
        return this.ensureService().setIfMatch(
            this.path("stockOperations/receiptLock"),
            lock,
            etag
        );
    }

    async releaseReceiptLock(owner) {
        const current = await this.loadReceiptLockVersioned();
        if (String(current?.value?.owner || "") !== String(owner || "")) {
            return { status: "not-owner" };
        }
        return this.setReceiptLockIfMatch(null, current.etag);
    }

    applyReceiptUpdate(updates) {
        return this.applyMultiLocationUpdate(updates);
    }

    loadDistributions() {
        return this.get(this.path("distributes"));
    }

    async loadDistributionSummaries(options = {}) {
        const concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, Math.min(12, options.concurrency))
            : 6;
        const fields = [
            "date",
            "createdAt",
            "roomId",
            "roomName",
            "students",
            "days",
            "perCrate",
            "crates",
            "boxes",
            "total",
            "year",
            "note",
            "stockBefore",
            "stockAfter",
            "roomStockBefore",
            "roomStockAfter"
        ];
        const keyIndex = await this.get(this.path("distributes"), { shallow: true });
        const keys = Object.keys(keyIndex || {}).sort((left, right) => left.localeCompare(right));
        const summaries = Object.fromEntries(keys.map(key => [key, { id: key }]));
        const tasks = keys.flatMap(key => fields.map(field => ({ key, field })));
        let cursor = 0;

        const worker = async () => {
            while (cursor < tasks.length) {
                const index = cursor;
                cursor += 1;
                const { key, field } = tasks[index];
                const value = await this.get(this.path(`distributes/${key}/${field}`));
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

    loadDistributionCommand(operationId) {
        return this.get(this.path(`stockOperations/distributionCommands/${operationId}`));
    }

    loadDistributionLockVersioned() {
        return this.ensureService().getWithEtag(
            this.path("stockOperations/distributionLock")
        );
    }

    setDistributionLockIfMatch(lock, etag) {
        return this.ensureService().setIfMatch(
            this.path("stockOperations/distributionLock"),
            lock,
            etag
        );
    }

    async releaseDistributionLock(owner) {
        const current = await this.loadDistributionLockVersioned();
        if (String(current?.value?.owner || "") !== String(owner || "")) {
            return { status: "not-owner" };
        }
        return this.setDistributionLockIfMatch(null, current.etag);
    }

    applyDistributionUpdate(updates, operationId, commandRecord) {
        const normalizedId = String(operationId || "").trim();
        if (!normalizedId) {
            throw new Error("A distribution operation id is required.");
        }
        return this.applyMultiLocationUpdate({
            ...updates,
            [`stockOperations/distributionCommands/${normalizedId}`]: commandRecord
        });
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
