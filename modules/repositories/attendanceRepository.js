class AttendanceRepository extends BaseRepository {
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
            throw new Error("Attendance date must use YYYY-MM-DD format.");
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

    loadRoomAttendance(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path("mcAttendance"), {
            orderBy: "$key",
            startAt: `${normalizedRoomId}_`,
            endAt: `${normalizedRoomId}_\uf8ff`
        });
    }

    async loadAttendanceSummaries(options = {}) {
        const roomId = String(options.roomId || "").trim();
        if (roomId) this.requireRoomId(roomId);
        const startDate = options.startDate ? this.requireDate(options.startDate) : "";
        const endDate = options.endDate ? this.requireDate(options.endDate) : "";
        if (startDate && endDate && startDate > endDate) {
            throw new Error("Attendance start date must not be after end date.");
        }
        const concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, Math.min(16, options.concurrency))
            : 10;
        const keyIndex = await this.get(this.path("mcAttendance"), { shallow: true });
        const keys = Object.keys(keyIndex || {})
            .map(key => {
                const match = String(key).match(/^(.*)_(\d{4}-\d{2}-\d{2})$/);
                return match ? { key, roomId: match[1], date: match[2] } : null;
            })
            .filter(item => item
                && (!roomId || item.roomId === roomId)
                && (!startDate || item.date >= startDate)
                && (!endDate || item.date <= endDate))
            .sort((left, right) => left.key.localeCompare(right.key));
        const summaries = new Array(keys.length);
        let cursor = 0;

        const worker = async () => {
            while (cursor < keys.length) {
                const index = cursor;
                cursor += 1;
                const item = keys[index];
                const recordPath = this.path(`mcAttendance/${item.key}`);
                const [data, teacher, roomName, savedAt] = await Promise.all([
                    this.get(`${recordPath}/data`),
                    this.get(`${recordPath}/teacher`),
                    this.get(`${recordPath}/roomName`),
                    this.get(`${recordPath}/savedAt`)
                ]);
                if (!data || typeof data !== "object" || Array.isArray(data)) {
                    summaries[index] = null;
                    continue;
                }
                summaries[index] = {
                    id: item.key,
                    key: item.key,
                    roomId: item.roomId,
                    date: item.date,
                    data,
                    teacher: String(teacher || ""),
                    roomName: String(roomName || ""),
                    savedAt: String(savedAt || "")
                };
            }
        };

        await Promise.all(Array.from(
            { length: Math.min(concurrency, keys.length || 1) },
            () => worker()
        ));
        return summaries.filter(Boolean);
    }

    async loadRoomAttendanceSummaries(roomId, options = {}) {
        const normalizedRoomId = this.requireRoomId(roomId);
        const concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, Math.min(12, options.concurrency))
            : 6;

        // Attendance records may contain several base64 photos and a signature.
        // A room-prefix query still returns those children and can exceed the
        // Firebase response limit. Read only the shallow key index first, then
        // hydrate the small `/data` child for each matching room/date.
        const keyIndex = await this.get(this.path("mcAttendance"), { shallow: true });
        const prefix = `${normalizedRoomId}_`;
        const keys = Object.keys(keyIndex || {})
            .filter(key => (
                key.startsWith(prefix) &&
                /^\d{4}-\d{2}-\d{2}$/.test(key.slice(prefix.length))
            ))
            .sort((left, right) => left.localeCompare(right));
        const summaries = new Array(keys.length);
        let cursor = 0;

        const worker = async () => {
            while (cursor < keys.length) {
                const index = cursor;
                cursor += 1;
                const key = keys[index];
                const date = key.slice(prefix.length);
                const data = await this.get(this.path(`mcAttendance/${key}/data`));
                if (!data || typeof data !== "object" || Array.isArray(data)) {
                    summaries[index] = null;
                    continue;
                }
                summaries[index] = [
                    key,
                    {
                        clsId: normalizedRoomId,
                        roomId: normalizedRoomId,
                        date,
                        data
                    }
                ];
            }
        };

        await Promise.all(
            Array.from(
                { length: Math.min(concurrency, keys.length || 1) },
                () => worker()
            )
        );

        return Object.fromEntries(summaries.filter(Boolean));
    }

    async loadAttendanceHistoryRecord(roomId, date) {
        const normalizedRoomId = this.requireRoomId(roomId);
        const normalizedDate = this.requireDate(date);
        const key = this.attendanceKey(normalizedRoomId, normalizedDate);
        const recordPath = this.path(`mcAttendance/${key}`);

        // Read Attendance facts first. A missing data child means there is no
        // reportable Attendance record for this room/date. Historical photo and
        // signature children are intentionally never requested by this method.
        const data = await this.get(`${recordPath}/data`);
        if (data === null || data === undefined) {
            return null;
        }

        const [notes, year, term, roomName, teacher, savedAt] = await Promise.all([
            this.get(`${recordPath}/notes`),
            this.get(`${recordPath}/year`),
            this.get(`${recordPath}/term`),
            this.get(`${recordPath}/roomName`),
            this.get(`${recordPath}/teacher`),
            this.get(`${recordPath}/savedAt`)
        ]);

        return {
            key,
            clsId: normalizedRoomId,
            roomName: String(roomName || ""),
            date: normalizedDate,
            year: year ?? "",
            term: term ?? "",
            teacher: String(teacher || ""),
            data: data && typeof data === "object" && !Array.isArray(data) ? data : {},
            notes: notes && typeof notes === "object" && !Array.isArray(notes) ? notes : {},
            savedAt: String(savedAt || ""),
            evidence: {
                loaded: false,
                photoCount: null,
                hasSignature: null
            }
        };
    }

    saveAttendanceRecord(roomId, date, record) {
        const key = this.attendanceKey(roomId, date);
        return this.firebaseService.set(this.path(`mcAttendance/${key}`), record);
    }

    deleteAttendanceRecord(roomId, date) {
        const key = this.attendanceKey(roomId, date);
        return this.firebaseService.remove(this.path(`mcAttendance/${key}`));
    }

    loadRoomStock(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        return this.get(this.path(`roomStock/${normalizedRoomId}`));
    }

    loadRoomStockVersioned(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        if (!this.firebaseService?.getWithEtag) {
            throw new Error("Firebase ETag reads are not available.");
        }
        return this.firebaseService.getWithEtag(this.path(`roomStock/${normalizedRoomId}`));
    }

    setRoomStockIfMatch(roomId, value, etag) {
        const normalizedRoomId = this.requireRoomId(roomId);
        if (!this.firebaseService?.setIfMatch) {
            throw new Error("Firebase conditional writes are not available.");
        }
        return this.firebaseService.setIfMatch(
            this.path(`roomStock/${normalizedRoomId}`),
            value,
            etag
        );
    }

    async loadMutationState(roomId, date) {
        const [attendance, roomStock] = await Promise.all([
            this.loadAttendanceRecord(roomId, date),
            this.loadRoomStock(roomId)
        ]);

        return {
            attendance: attendance || null,
            roomStock: roomStock ?? 0
        };
    }

    appendAttendanceAudit(ledger, stockLog) {
        const updates = {};

        if (ledger?.id) {
            updates[`stockTransactions/${ledger.id}`] = ledger;
        }
        if (stockLog?.id) {
            updates[`stockLog/${stockLog.id}`] = stockLog;
        }

        if (!Object.keys(updates).length) {
            return Promise.resolve(null);
        }

        return this.update(this.path(), updates);
    }

    applyAttendanceMutation(updates) {
        if (!updates || typeof updates !== "object" || Array.isArray(updates)) {
            throw new Error("Attendance updates must be an object.");
        }

        return this.update(this.path(), updates);
    }
}

window.AttendanceRepository = new AttendanceRepository();
