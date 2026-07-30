class AttendanceHistoryService {
    constructor(
        repository = window.AttendanceRepository,
        teacherService = window.TeacherService,
        options = {}
    ) {
        this.repository = repository;
        this.teacherService = teacherService;
        this.maxRangeDays = Number.isInteger(options.maxRangeDays)
            ? Math.max(1, options.maxRangeDays)
            : 93;
        this.concurrency = Number.isInteger(options.concurrency)
            ? Math.max(1, options.concurrency)
            : 6;
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.AttendanceRepository;
        }
        if (!this.repository?.loadAttendanceHistoryRecord) {
            throw this.businessError(
                "ATTENDANCE_HISTORY_REPOSITORY_UNAVAILABLE",
                "AttendanceRepository media-free history reads are not available."
            );
        }
        return this.repository;
    }

    ensureEvidenceRepository() {
        const repository = this.ensureRepository();
        if (!repository?.loadAttendanceRecord) {
            throw this.businessError(
                "ATTENDANCE_EVIDENCE_REPOSITORY_UNAVAILABLE",
                "AttendanceRepository selected-record evidence reads are not available."
            );
        }
        return repository;
    }

    ensureTeacherService() {
        if (!this.teacherService) {
            this.teacherService = window.TeacherService;
        }
        if (!this.teacherService?.assertRoomAccess) {
            throw this.businessError(
                "TEACHER_SERVICE_UNAVAILABLE",
                "TeacherService is not available."
            );
        }
        return this.teacherService;
    }

    businessError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) {
            error.details = details;
        }
        return error;
    }

    requireDate(value, label = "date") {
        const normalized = String(value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            throw this.businessError(
                "ATTENDANCE_HISTORY_DATE_INVALID",
                `${label} must use YYYY-MM-DD format.`,
                { label, value: normalized }
            );
        }

        const parsed = new Date(`${normalized}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
            throw this.businessError(
                "ATTENDANCE_HISTORY_DATE_INVALID",
                `${label} is not a valid calendar date.`,
                { label, value: normalized }
            );
        }

        return normalized;
    }

    normalizeRange(input = {}) {
        const source = typeof input === "string" ? { date: input } : (input || {});
        const startDate = this.requireDate(source.date || source.startDate, "startDate");
        const endDate = this.requireDate(source.date || source.endDate || startDate, "endDate");

        if (endDate < startDate) {
            throw this.businessError(
                "ATTENDANCE_HISTORY_RANGE_REVERSED",
                "Attendance history endDate must not be earlier than startDate.",
                { startDate, endDate }
            );
        }

        const days = this.daysInclusive(startDate, endDate);
        if (days > this.maxRangeDays) {
            throw this.businessError(
                "ATTENDANCE_HISTORY_RANGE_TOO_LARGE",
                `Attendance history is limited to ${this.maxRangeDays} days per request.`,
                { startDate, endDate, days, maxRangeDays: this.maxRangeDays }
            );
        }

        return { startDate, endDate, days };
    }

    daysInclusive(startDate, endDate) {
        const start = Date.parse(`${startDate}T00:00:00.000Z`);
        const end = Date.parse(`${endDate}T00:00:00.000Z`);
        return Math.floor((end - start) / 86400000) + 1;
    }

    enumerateDates(startDate, endDate) {
        const dates = [];
        const cursor = new Date(`${startDate}T00:00:00.000Z`);
        const end = new Date(`${endDate}T00:00:00.000Z`);

        while (cursor <= end) {
            dates.push(cursor.toISOString().slice(0, 10));
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }

        return dates;
    }

    normalizeData(rawData = {}) {
        if (!rawData || typeof rawData !== "object" || Array.isArray(rawData)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(rawData)
                .map(([studentId, status]) => [
                    String(studentId || "").trim(),
                    String(status || "").trim().toLowerCase()
                ])
                .filter(([studentId, status]) => (
                    studentId && (status === "present" || status === "absent")
                ))
        );
    }

    normalizeNotes(rawNotes = {}) {
        if (!rawNotes || typeof rawNotes !== "object" || Array.isArray(rawNotes)) {
            return {};
        }

        return Object.fromEntries(
            Object.entries(rawNotes)
                .map(([studentId, note]) => [
                    String(studentId || "").trim(),
                    String(note || "").trim()
                ])
                .filter(([studentId, note]) => studentId && note)
        );
    }

    normalizeRecord(session, roomId, date, rawRecord = {}) {
        const source = rawRecord && typeof rawRecord === "object" ? rawRecord : {};
        return {
            key: `${roomId}_${date}`,
            clsId: roomId,
            roomName: String(source.roomName || session?.roomName || roomId),
            date,
            year: source.year ?? "",
            term: source.term ?? "",
            teacher: String(source.teacher || session?.teacher || "ครูประจำชั้น"),
            data: this.normalizeData(source.data),
            notes: this.normalizeNotes(source.notes),
            savedAt: String(source.savedAt || ""),
            evidence: {
                loaded: false,
                photoCount: null,
                hasSignature: null
            }
        };
    }

    normalizeEvidenceRecord(session, roomId, date, rawRecord = {}) {
        const record = this.normalizeRecord(session, roomId, date, rawRecord);
        const photos = (Array.isArray(rawRecord?.photos) ? rawRecord.photos : [])
            .filter(value => typeof value === "string" && value.startsWith("data:image/"))
            .slice(0, 5);
        const signature = typeof rawRecord?.signature === "string" &&
            rawRecord.signature.startsWith("data:image/")
            ? rawRecord.signature
            : "";

        return {
            ...record,
            photos,
            signature,
            evidence: {
                loaded: true,
                photoCount: photos.length,
                hasSignature: Boolean(signature)
            }
        };
    }

    async mapWithConcurrency(values, worker) {
        const results = new Array(values.length);
        let cursor = 0;

        const run = async () => {
            while (cursor < values.length) {
                const index = cursor;
                cursor += 1;
                results[index] = await worker(values[index], index);
            }
        };

        await Promise.all(
            Array.from(
                { length: Math.min(this.concurrency, values.length || 1) },
                () => run()
            )
        );

        return results;
    }

    async loadRange(session, input = {}) {
        const roomId = this.ensureTeacherService().assertRoomAccess(session, input?.roomId);
        const range = this.normalizeRange(input);
        const dates = this.enumerateDates(range.startDate, range.endDate);
        const repository = this.ensureRepository();

        const rawRecords = await this.mapWithConcurrency(
            dates,
            date => repository.loadAttendanceHistoryRecord(roomId, date)
        );

        const records = rawRecords
            .map((record, index) => (
                record ? this.normalizeRecord(session, roomId, dates[index], record) : null
            ))
            .filter(Boolean)
            .sort((left, right) => left.date.localeCompare(right.date));

        return {
            roomId,
            roomName: String(session?.roomName || records[0]?.roomName || roomId),
            teacher: String(session?.teacher || records[0]?.teacher || "ครูประจำชั้น"),
            startDate: range.startDate,
            endDate: range.endDate,
            requestedDays: range.days,
            recordCount: records.length,
            records
        };
    }

    async loadEvidence(session, input = {}) {
        const roomId = this.ensureTeacherService().assertRoomAccess(session, input?.roomId);
        const range = this.normalizeRange(input);
        const requestedDates = Array.isArray(input?.dates)
            ? [...new Set(input.dates.map(date => this.requireDate(date, "date")))]
            : this.enumerateDates(range.startDate, range.endDate);
        const dates = requestedDates.filter(date => (
            date >= range.startDate && date <= range.endDate
        ));
        const repository = this.ensureEvidenceRepository();
        const rawRecords = await this.mapWithConcurrency(
            dates,
            date => repository.loadAttendanceRecord(roomId, date)
        );
        const records = rawRecords
            .map((record, index) => (
                record ? this.normalizeEvidenceRecord(session, roomId, dates[index], record) : null
            ))
            .filter(Boolean)
            .sort((left, right) => left.date.localeCompare(right.date));

        return {
            roomId,
            startDate: range.startDate,
            endDate: range.endDate,
            recordCount: records.length,
            records
        };
    }
}

window.AttendanceHistoryServiceClass = AttendanceHistoryService;
window.AttendanceHistoryService = new AttendanceHistoryService();
