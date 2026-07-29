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