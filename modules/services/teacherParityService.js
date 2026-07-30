class TeacherParityService {
    constructor(options = {}) {
        this.allowedReportDays = new Set(options.allowedReportDays || [15, 30, 90]);
        this.defaultReportDays = Number(options.defaultReportDays) || 30;
    }

    text(value, fallback = "") {
        const normalized = String(value ?? "").trim();
        return normalized || fallback;
    }

    number(value, fallback = 0) {
        const normalized = Number(value);
        return Number.isFinite(normalized) ? normalized : fallback;
    }

    normalizeStatus(value) {
        const normalized = this.text(value).toLowerCase();
        return normalized === "present" || normalized === "absent"
            ? normalized
            : "unchecked";
    }

    normalizePreferences(raw = {}) {
        const requestedDays = Number(raw.defaultReportDays);
        const defaultReportDays = this.allowedReportDays.has(requestedDays)
            ? requestedDays
            : this.defaultReportDays;
        const allowedSections = new Set([
            "overview",
            "attendance",
            "history",
            "summary",
            "print",
            "pending",
            "retroactive",
            "vacation",
            "student-report",
            "room-stock",
            "settings"
        ]);
        const lastSection = allowedSections.has(this.text(raw.lastSection))
            ? this.text(raw.lastSection)
            : "overview";

        return {
            defaultReportDays,
            compactMode: raw.compactMode === true,
            rememberLastSection: raw.rememberLastSection !== false,
            lastSection
        };
    }

    defaultRange(days = this.defaultReportDays, today = this.today()) {
        const normalizedDays = this.allowedReportDays.has(Number(days))
            ? Number(days)
            : this.defaultReportDays;
        const end = this.requireDate(today);
        const start = new Date(`${end}T00:00:00.000Z`);
        start.setUTCDate(start.getUTCDate() - (normalizedDays - 1));
        return {
            startDate: start.toISOString().slice(0, 10),
            endDate: end,
            days: normalizedDays
        };
    }

    buildOverview(snapshot = {}) {
        const students = Array.isArray(snapshot.students)
            ? snapshot.students
            : Object.values(snapshot.students || {});
        const records = Object.values(snapshot.attendance || {})
            .filter(record => record && typeof record === "object")
            .sort((left, right) => this.text(right.date).localeCompare(this.text(left.date)));
        const current = records[0] || null;
        const statuses = current?.data && typeof current.data === "object"
            ? Object.values(current.data)
            : [];
        const present = statuses.filter(value => this.normalizeStatus(value) === "present").length;
        const absent = statuses.filter(value => this.normalizeStatus(value) === "absent").length;
        const checked = present + absent;

        return {
            roomId: this.text(snapshot.session?.roomId || snapshot.room?.id),
            roomName: this.text(snapshot.session?.roomName || snapshot.room?.name, "—"),
            teacher: this.text(snapshot.session?.teacher || snapshot.room?.teacher, "ครูประจำชั้น"),
            schoolName: this.text(snapshot.session?.schoolName, "โรงเรียน"),
            date: this.text(current?.date),
            students: students.length || Math.max(0, this.number(snapshot.room?.count)),
            present,
            absent,
            unchecked: Math.max(0, (students.length || this.number(snapshot.room?.count)) - checked),
            roomStock: this.number(snapshot.roomStock)
        };
    }

    buildRoomStock(snapshot = {}) {
        const roomId = this.text(snapshot.session?.roomId || snapshot.room?.id);
        return {
            roomId,
            roomName: this.text(snapshot.session?.roomName || snapshot.room?.name, "—"),
            teacher: this.text(snapshot.session?.teacher || snapshot.room?.teacher, "ครูประจำชั้น"),
            balance: this.number(snapshot.roomStock),
            updatedAt: this.findRoomUpdatedAt(snapshot.updatedAt, roomId),
            source: "roomStock-scoped-read",
            readOnly: true
        };
    }

    buildMonthlyPaperRoster(snapshot = {}, month) {
        const normalizedMonth = this.requireMonth(month);
        const [year, monthNumber] = normalizedMonth.split("-").map(Number);
        const students = (Array.isArray(snapshot.students)
            ? snapshot.students
            : Object.values(snapshot.students || {}))
            .map((student, index) => {
                const source = student && typeof student === "object" ? student : {};
                const id = this.text(source.id || source.studentId || source["รหัส"], `student-${index + 1}`);
                return {
                    id,
                    num: this.text(source.num || source.no || source["เลขที่"], String(index + 1)),
                    name: this.text(source.name || source["ชื่อ-นามสกุล"], id),
                    gender: this.text(source.gender || source.sex || source["เพศ"])
                };
            })
            .sort((left, right) => {
                const leftNumber = Number(left.num);
                const rightNumber = Number(right.num);
                if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
                    return leftNumber - rightNumber;
                }
                return left.num.localeCompare(right.num, "th");
            });
        const schoolDays = [];
        const cursor = new Date(Date.UTC(year, monthNumber - 1, 1));
        while (cursor.getUTCFullYear() === year && cursor.getUTCMonth() === monthNumber - 1) {
            const weekday = cursor.getUTCDay();
            if (weekday >= 1 && weekday <= 5) {
                schoolDays.push(cursor.toISOString().slice(0, 10));
            }
            cursor.setUTCDate(cursor.getUTCDate() + 1);
        }
        const thaiMonths = [
            "มกราคม",
            "กุมภาพันธ์",
            "มีนาคม",
            "เมษายน",
            "พฤษภาคม",
            "มิถุนายน",
            "กรกฎาคม",
            "สิงหาคม",
            "กันยายน",
            "ตุลาคม",
            "พฤศจิกายน",
            "ธันวาคม"
        ];
        const session = snapshot.session || {};
        const room = snapshot.room || session.roomSnapshot || {};
        const settings = snapshot.settings || {};

        return {
            metadata: {
                schoolName: this.text(session.schoolName || settings.schoolName, "โรงเรียน"),
                roomId: this.text(session.roomId || room.id),
                roomName: this.text(session.roomName || room.name, "ห้องเรียน"),
                teacher: this.text(session.teacher || room.teacher, "ครูประจำชั้น"),
                month: normalizedMonth,
                monthLabel: `${thaiMonths[monthNumber - 1]} ${year + 543}`
            },
            schoolDays,
            students,
            source: {
                studentCount: students.length,
                schoolDayCount: schoolDays.length,
                readOnly: true
            }
        };
    }

    findRoomUpdatedAt(rawUpdatedAt, roomId) {
        const source = rawUpdatedAt && typeof rawUpdatedAt === "object" ? rawUpdatedAt : {};
        const candidates = [
            source.roomStock?.[roomId],
            source[`roomStock/${roomId}`],
            source[roomId],
            source.roomStock
        ];

        for (const candidate of candidates) {
            if (candidate === null || candidate === undefined || candidate === "") {
                continue;
            }
            if (typeof candidate === "object") {
                const nested = candidate.updatedAt || candidate.savedAt || candidate.timestamp || candidate.value;
                if (nested !== null && nested !== undefined && nested !== "") {
                    return this.text(nested);
                }
                continue;
            }
            return this.text(candidate);
        }
        return "";
    }

    buildStudentReport(history = {}, report = {}, studentId) {
        const normalizedStudentId = this.text(studentId);
        if (!normalizedStudentId) {
            throw this.businessError(
                "STUDENT_REPORT_STUDENT_REQUIRED",
                "กรุณาเลือกนักเรียนก่อนโหลดรายงาน"
            );
        }

        const student = (report.students || []).find(item =>
            this.text(item?.id) === normalizedStudentId
        );
        if (!student) {
            throw this.businessError(
                "STUDENT_REPORT_STUDENT_NOT_FOUND",
                "ไม่พบนักเรียนที่เลือกในห้องที่เข้าสู่ระบบ"
            );
        }

        const timeline = (history.records || []).map(record => ({
            date: this.text(record?.date),
            status: this.normalizeStatus(record?.data?.[normalizedStudentId]),
            note: this.text(record?.notes?.[normalizedStudentId]),
            savedAt: this.text(record?.savedAt)
        })).sort((left, right) => left.date.localeCompare(right.date));
        const evidence = (history.records || [])
            .filter(record => record?.evidence?.loaded)
            .map(record => ({
                date: this.text(record.date),
                teacher: this.text(record.teacher, report.metadata?.teacher || "ครูประจำชั้น"),
                photos: (Array.isArray(record.photos) ? record.photos : [])
                    .filter(value => typeof value === "string" && value.startsWith("data:image/"))
                    .slice(0, 5),
                signature: typeof record.signature === "string" &&
                    record.signature.startsWith("data:image/")
                    ? record.signature
                    : ""
            }));

        return {
            metadata: {
                ...(report.metadata || {}),
                studentId: normalizedStudentId,
                studentNumber: this.text(student.num),
                studentName: this.text(student.name, normalizedStudentId),
                gender: this.text(student.gender)
            },
            totals: {
                schoolDays: Math.max(0, this.number(report.totals?.schoolDays)),
                present: Math.max(0, this.number(student.present)),
                absent: Math.max(0, this.number(student.absent)),
                unchecked: Math.max(0, this.number(student.unchecked)),
                attendanceRate: student.attendanceRate === null
                    ? null
                    : this.number(student.attendanceRate)
            },
            timeline,
            evidence,
            source: {
                recordCount: timeline.length,
                evidenceHydrated: evidence.length > 0,
                readOnly: true
            }
        };
    }

    businessError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    requireDate(value) {
        const normalized = this.text(value);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
            throw this.businessError("TEACHER_PARITY_DATE_INVALID", "วันที่ต้องอยู่ในรูปแบบ YYYY-MM-DD");
        }
        const parsed = new Date(`${normalized}T00:00:00.000Z`);
        if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== normalized) {
            throw this.businessError("TEACHER_PARITY_DATE_INVALID", "วันที่ไม่ถูกต้อง");
        }
        return normalized;
    }

    requireMonth(value) {
        const normalized = this.text(value);
        if (!/^\d{4}-\d{2}$/.test(normalized)) {
            throw this.businessError(
                "MONTHLY_PAPER_ROSTER_MONTH_INVALID",
                "กรุณาเลือกเดือนในรูปแบบ YYYY-MM"
            );
        }
        const [year, month] = normalized.split("-").map(Number);
        if (year < 2000 || year > 2200 || month < 1 || month > 12) {
            throw this.businessError(
                "MONTHLY_PAPER_ROSTER_MONTH_INVALID",
                "เดือนที่เลือกไม่ถูกต้อง"
            );
        }
        return normalized;
    }

    today() {
        const date = new Date();
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }
}

window.TeacherParityServiceClass = TeacherParityService;
window.TeacherParityService = new TeacherParityService();
