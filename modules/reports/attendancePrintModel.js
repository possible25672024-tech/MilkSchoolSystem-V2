class AttendancePrintModel {
    constructor(options = {}) {
        this.locale = String(options.locale || "th-TH");
        this.timeZone = String(options.timeZone || "Asia/Bangkok");
        this.defaultRowsPerPage = this.normalizeRowsPerPage(options.rowsPerPage, 24);
        this.defaultTitle = String(options.title || "รายงานการเช็กดื่มนมรายวัน").trim();
    }

    text(value, fallback = "") {
        const normalized = String(value ?? "").trim();
        return normalized || fallback;
    }

    number(value, fallback = 0) {
        const normalized = Number(value);
        return Number.isFinite(normalized) ? normalized : fallback;
    }

    normalizeRowsPerPage(value, fallback = this.defaultRowsPerPage || 24) {
        const normalized = Number(value);
        if (!Number.isInteger(normalized)) {
            return fallback;
        }
        return Math.min(40, Math.max(1, normalized));
    }

    requireTimestamp(value) {
        const normalized = this.text(value, new Date().toISOString());
        const parsed = new Date(normalized);
        if (Number.isNaN(parsed.getTime())) {
            const error = new Error("Attendance print timestamp is invalid.");
            error.code = "ATTENDANCE_PRINT_TIMESTAMP_INVALID";
            throw error;
        }
        return parsed.toISOString();
    }

    formatIsoDate(value) {
        const normalized = this.text(value);
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);
        if (!match) {
            return normalized;
        }
        return `${match[3]}/${match[2]}/${match[1]}`;
    }

    formatTimestamp(value) {
        const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone: this.timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hourCycle: "h23"
        });
        const parts = Object.fromEntries(
            formatter.formatToParts(new Date(value))
                .filter(part => part.type !== "literal")
                .map(part => [part.type, part.value])
        );
        return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
    }

    formatRange(startDate, endDate) {
        const start = this.text(startDate);
        const end = this.text(endDate || startDate);
        if (!start && !end) {
            return "ไม่ระบุช่วงวันที่";
        }
        if (start === end) {
            return this.formatIsoDate(start);
        }
        return `${this.formatIsoDate(start)} ถึง ${this.formatIsoDate(end)}`;
    }

    formatAcademic(year, term) {
        const normalizedYear = this.text(year);
        const normalizedTerm = this.text(term);
        if (!normalizedYear && !normalizedTerm) {
            return "ไม่ระบุปีการศึกษา/ภาคเรียน";
        }
        if (normalizedYear && normalizedTerm) {
            return `ปีการศึกษา ${normalizedYear} ภาคเรียนที่ ${normalizedTerm}`;
        }
        return normalizedYear
            ? `ปีการศึกษา ${normalizedYear}`
            : `ภาคเรียนที่ ${normalizedTerm}`;
    }

    normalizeMetadata(report = {}) {
        const metadata = report?.metadata && typeof report.metadata === "object"
            ? report.metadata
            : {};
        return {
            schoolName: this.text(metadata.schoolName, "โรงเรียน"),
            roomId: this.text(metadata.roomId),
            roomName: this.text(metadata.roomName, "ห้องเรียน"),
            teacher: this.text(metadata.teacher, "ครูประจำชั้น"),
            startDate: this.text(metadata.startDate),
            endDate: this.text(metadata.endDate || metadata.startDate),
            year: this.text(metadata.year),
            term: this.text(metadata.term)
        };
    }

    normalizeTotals(report = {}) {
        const totals = report?.totals && typeof report.totals === "object"
            ? report.totals
            : {};
        const attendanceRate = totals.attendanceRate === null || totals.attendanceRate === undefined
            ? null
            : this.number(totals.attendanceRate, null);
        return {
            requestedDays: Math.max(0, this.number(totals.requestedDays)),
            schoolDays: Math.max(0, this.number(totals.schoolDays)),
            completeDays: Math.max(0, this.number(totals.completeDays)),
            incompleteDays: Math.max(0, this.number(totals.incompleteDays)),
            students: Math.max(0, this.number(totals.students)),
            studentRows: Math.max(0, this.number(totals.studentRows)),
            present: Math.max(0, this.number(totals.present)),
            absent: Math.max(0, this.number(totals.absent)),
            unchecked: Math.max(0, this.number(totals.unchecked)),
            checked: Math.max(0, this.number(totals.checked)),
            attendanceRate
        };
    }

    normalizeRows(report = {}) {
        return (Array.isArray(report?.students) ? report.students : [])
            .filter(student => student && typeof student === "object")
            .map((student, index) => ({
                rowNumber: index + 1,
                id: this.text(student.id),
                num: this.text(student.num),
                name: this.text(student.name, this.text(student.id, `นักเรียนคนที่ ${index + 1}`)),
                gender: this.text(student.gender),
                present: Math.max(0, this.number(student.present)),
                absent: Math.max(0, this.number(student.absent)),
                unchecked: Math.max(0, this.number(student.unchecked)),
                checked: Math.max(0, this.number(student.checked)),
                totalDays: Math.max(0, this.number(student.totalDays)),
                notesCount: Math.max(0, this.number(student.notesCount)),
                attendanceRate: student.attendanceRate === null || student.attendanceRate === undefined
                    ? null
                    : this.number(student.attendanceRate, null)
            }));
    }

    columns() {
        return [
            { key: "rowNumber", label: "ลำดับ" },
            { key: "num", label: "เลขที่" },
            { key: "id", label: "รหัสนักเรียน" },
            { key: "name", label: "ชื่อ-นามสกุล" },
            { key: "gender", label: "เพศ" },
            { key: "present", label: "ดื่มนม" },
            { key: "absent", label: "ไม่ดื่มนม" },
            { key: "unchecked", label: "ยังไม่ตรวจ" },
            { key: "attendanceRate", label: "อัตราดื่มนม (%)" },
            { key: "notesCount", label: "หมายเหตุ" }
        ];
    }

    paginate(rows, rowsPerPage) {
        if (!rows.length) {
            return [[]];
        }
        const pages = [];
        for (let index = 0; index < rows.length; index += rowsPerPage) {
            pages.push(rows.slice(index, index + rowsPerPage));
        }
        return pages;
    }

    build(report = {}, options = {}) {
        const printedAt = this.requireTimestamp(options.printedAt);
        const rowsPerPage = this.normalizeRowsPerPage(options.rowsPerPage, this.defaultRowsPerPage);
        const title = this.text(options.title, this.defaultTitle);
        const metadata = this.normalizeMetadata(report);
        const totals = this.normalizeTotals(report);
        const rows = this.normalizeRows(report);
        const columns = this.columns();
        const pageRows = this.paginate(rows, rowsPerPage);
        const totalPages = pageRows.length;
        const rangeLabel = this.formatRange(metadata.startDate, metadata.endDate);
        const academicLabel = this.formatAcademic(metadata.year, metadata.term);
        const printedAtLabel = this.formatTimestamp(printedAt);

        const pages = pageRows.map((currentRows, index) => ({
            pageNumber: index + 1,
            totalPages,
            pageBreakAfter: index + 1 < totalPages,
            title,
            header: {
                schoolName: metadata.schoolName,
                roomName: metadata.roomName,
                teacher: metadata.teacher,
                rangeLabel,
                academicLabel
            },
            columns: columns.map(column => ({ ...column })),
            rows: currentRows.map(row => ({ ...row })),
            footer: {
                printedAtLabel,
                pageLabel: `หน้า ${index + 1} / ${totalPages}`
            }
        }));

        return {
            format: "A4",
            orientation: "portrait",
            locale: this.locale,
            timeZone: this.timeZone,
            title,
            printedAt,
            printedAtLabel,
            metadata: {
                ...metadata,
                rangeLabel,
                academicLabel
            },
            totals,
            columns,
            pages,
            source: {
                rowsPerPage,
                pageCount: totalPages,
                studentCount: rows.length,
                reportRecordCount: Math.max(0, this.number(report?.source?.recordCount)),
                evidenceHydrated: report?.source?.evidenceHydrated === true
            }
        };
    }
}

window.AttendancePrintModelClass = AttendancePrintModel;
window.AttendancePrintModel = new AttendancePrintModel();
