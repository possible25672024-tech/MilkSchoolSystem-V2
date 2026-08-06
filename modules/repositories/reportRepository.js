class ReportRepository extends BaseRepository {
    constructor(
        firebaseService = window.FirebaseService,
        stockRepository = window.StockRepository
    ) {
        super(firebaseService);
        this.appRoot = "milkApp";
        this.stockRepository = stockRepository;
    }

    path(child = "") {
        const cleanChild = String(child).replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    ensureStockRepository() {
        if (!this.stockRepository) {
            this.stockRepository = window.StockRepository;
        }

        if (!this.stockRepository?.loadStockSnapshot) {
            throw new Error("StockRepository is not available for report reads.");
        }

        return this.stockRepository;
    }

    loadSettings() {
        return this.get(this.path("settings"));
    }

    async loadCompactCollection(child, fields = [], options = {}) {
        const cleanChild = String(child || "").replace(/^\/+|\/+$/g, "");
        const normalizedFields = [...new Set(
            (Array.isArray(fields) ? fields : [])
                .map(field => String(field || "").replace(/^\/+|\/+$/g, ""))
                .filter(Boolean)
        )];
        const concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, Math.min(16, options.concurrency))
            : 8;
        if (!cleanChild || !normalizedFields.length) {
            return {};
        }

        const keyIndex = await this.get(this.path(cleanChild), { shallow: true });
        const keys = Object.keys(keyIndex || {}).sort((left, right) => left.localeCompare(right));
        const records = Object.fromEntries(keys.map(key => [key, { id: key }]));
        const tasks = keys.flatMap(key => (
            normalizedFields.map(field => ({ key, field }))
        ));
        let cursor = 0;

        const worker = async () => {
            while (cursor < tasks.length) {
                const index = cursor;
                cursor += 1;
                const { key, field } = tasks[index];
                const value = await this.get(this.path(`${cleanChild}/${key}/${field}`));
                if (value !== null && value !== undefined) {
                    records[key][field] = value;
                }
            }
        };

        await Promise.all(
            Array.from(
                { length: Math.min(concurrency, tasks.length || 1) },
                () => worker()
            )
        );

        return records;
    }

    async loadReportSnapshot() {
        const [settings, rooms, distributes, attendance, absentMilk, retroMilk, vacationMilk] = await Promise.all([
            this.loadSettings(),
            this.get(this.path("rooms")),
            this.get(this.path("distributes")),
            this.loadCompactCollection("mcAttendance", ["data"], { concurrency: 12 }),
            this.loadCompactCollection("absentMilk", [
                "roomId", "classId", "totalBoxes", "total", "boxes",
                "students", "studentId", "absentDate", "date"
            ]),
            this.loadCompactCollection("retroMilk", [
                "roomId", "classId", "totalBoxes", "total",
                "academicYear", "year", "semester", "term",
                "retroStart", "fromDate", "retroEnd", "toDate", "date", "issueDate"
            ]),
            this.loadCompactCollection("vacationMilk", [
                "roomId", "classId", "totalBoxes", "total",
                "academicYear", "year", "semester", "term",
                "date", "issueDate", "days"
            ])
        ]);

        return {
            rooms: rooms || [],
            distributes: distributes || [],
            attendance: attendance || {},
            absentMilk: absentMilk || {},
            retroMilk: retroMilk || {},
            vacationMilk: vacationMilk || {},
            settings: settings || {}
        };
    }
}

window.ReportRepository = new ReportRepository();
