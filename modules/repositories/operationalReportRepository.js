class OperationalReportRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child = "") {
        const cleanChild = String(child || "").replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    normalizeDate(value) {
        const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : "";
    }

    dateFromKey(key) {
        const match = String(key || "").match(/(\d{4}-\d{2}-\d{2})(?:$|_)/);
        return match ? match[1] : "";
    }

    inRange(date, range = {}) {
        const normalized = this.normalizeDate(date);
        return Boolean(normalized && normalized >= range.startDate && normalized <= range.endDate);
    }

    async readFields(child, keys, fields, concurrency = 8, seed = {}) {
        const records = Object.fromEntries(keys.map(key => [key, {
            id: key,
            ...(seed[key] || {})
        }]));
        const tasks = keys.flatMap(key => fields.map(field => ({ key, field })));
        let cursor = 0;
        const worker = async () => {
            while (cursor < tasks.length) {
                const task = tasks[cursor];
                cursor += 1;
                const value = await this.get(this.path(`${child}/${task.key}/${task.field}`));
                if (value !== null && value !== undefined) {
                    records[task.key][task.field] = value;
                }
            }
        };
        await Promise.all(Array.from(
            { length: Math.min(Math.max(1, concurrency), tasks.length || 1) },
            () => worker()
        ));
        return records;
    }

    resolveRecordDate(record = {}, dateFields = []) {
        for (const field of dateFields) {
            const date = this.normalizeDate(record[field]);
            if (date) return date;
        }
        return "";
    }

    async loadPeriodCollection(child, fields, range, options = {}) {
        const keyIndex = await this.get(this.path(child), { shallow: true });
        const keys = Object.keys(keyIndex || {}).sort((left, right) => left.localeCompare(right));
        const keyDate = options.keyDate === true;
        const dateFields = options.dateFields || ["date", "issueDate", "createdAt"];
        const directKeys = keyDate
            ? keys.filter(key => this.inRange(this.dateFromKey(key), range))
            : [];
        if (keyDate) {
            return this.readFields(child, directKeys, fields, options.concurrency || 8);
        }

        const dateRecords = await this.readFields(
            child,
            keys,
            dateFields,
            options.concurrency || 8
        );
        const selectedKeys = keys.filter(key => (
            this.inRange(this.resolveRecordDate(dateRecords[key], dateFields), range)
        ));
        const detailFields = fields.filter(field => !dateFields.includes(field));
        return this.readFields(
            child,
            selectedKeys,
            detailFields,
            options.concurrency || 8,
            dateRecords
        );
    }

    async loadPeriodSnapshot(range = {}) {
        const [settings, rooms, mainStock, roomStock, receives, distributes,
            attendance, absentMilk, retroMilk, vacationMilk] = await Promise.all([
            this.get(this.path("settings")),
            this.get(this.path("rooms")),
            this.get(this.path("stock")),
            this.get(this.path("roomStock")),
            this.loadPeriodCollection("receives", [
                "date", "createdAt", "crates", "extra", "perCrate", "total",
                "supplier", "note"
            ], range, { dateFields: ["date", "createdAt"] }),
            this.loadPeriodCollection("distributes", [
                "date", "createdAt", "roomId", "roomName", "students", "days",
                "perCrate", "crates", "boxes", "total", "year", "note",
                "stockBefore", "stockAfter", "roomStockBefore", "roomStockAfter"
            ], range, { dateFields: ["date", "createdAt"] }),
            this.loadPeriodCollection("mcAttendance", [
                "date", "roomId", "classId", "presentCount", "consumed", "data"
            ], range, { keyDate: true, concurrency: 12 }),
            this.loadPeriodCollection("absentMilk", [
                "dispenseDate", "date", "issueDate", "createdAt", "roomId", "classId",
                "totalBoxes", "total", "boxes", "students", "studentId", "absentDate"
            ], range, {
                dateFields: ["dispenseDate", "date", "issueDate", "createdAt", "absentDate"]
            }),
            this.loadPeriodCollection("retroMilk", [
                "date", "issueDate", "createdAt", "roomId", "classId", "totalBoxes", "total",
                "retroStart", "retroEnd", "fromDate", "toDate"
            ], range, { dateFields: ["date", "issueDate", "createdAt"] }),
            this.loadPeriodCollection("vacationMilk", [
                "date", "issueDate", "createdAt", "roomId", "classId", "totalBoxes", "total", "days"
            ], range, { dateFields: ["date", "issueDate", "createdAt"] })
        ]);

        return {
            range,
            settings: settings || {},
            rooms: rooms || {},
            mainStock: Number(mainStock) || 0,
            roomStock: roomStock || {},
            receives,
            distributes,
            attendance,
            absentMilk,
            retroMilk,
            vacationMilk
        };
    }
}

window.OperationalReportRepository = new OperationalReportRepository();
