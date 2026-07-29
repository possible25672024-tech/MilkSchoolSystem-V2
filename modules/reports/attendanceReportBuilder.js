class AttendanceReportBuilder {
    constructor(options = {}) {
        this.locale = String(options.locale || "th-TH");
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
        const status = this.text(value).toLowerCase();
        if (status === "present" || status === "absent") {
            return status;
        }
        return "unchecked";
    }

    normalizeStudent(student = {}, index = 0, sourceKey = "") {
        const source = student && typeof student === "object" ? student : {};
        const firstName = this.text(source["ชื่อ"] || source.firstName);
        const lastName = this.text(source["นามสกุล"] || source.lastName || source.surname);
        const combinedName = this.text(
            source["ชื่อ-นามสกุล"] || source.name || `${firstName} ${lastName}`
        );
        const id = this.text(
            source["รหัส"] ||
            source["รหัสประจำตัว"] ||
            source.id ||
            source.studentId ||
            sourceKey,
            `student_${index + 1}`
        );

        return {
            id,
            num: this.text(source["เลขที่"] || source.no || source.num || source.order),
            name: combinedName || id,
            gender: this.text(source["เพศ"] || source.gender || source.sex),
            roster: true,
            sourceOrder: index
        };
    }

    normalizeRoster(rawStudents) {
        const entries = Array.isArray(rawStudents)
            ? rawStudents.map((student, index) => ["", student, index])
            : Object.entries(rawStudents || {}).map(([key, student], index) => [key, student, index]);
        const seen = new Set();
        const students = [];

        entries.forEach(([key, student, index]) => {
            if (!student || typeof student !== "object") {
                return;
            }
            const normalized = this.normalizeStudent(student, index, key);
            if (!normalized.id || seen.has(normalized.id)) {
                return;
            }
            seen.add(normalized.id);
            students.push(normalized);
        });

        return { students, seen };
    }

    normalizeRecords(rawRecords) {
        return (Array.isArray(rawRecords) ? rawRecords : [])
            .filter(record => record && typeof record === "object")
            .map(record => ({
                key: this.text(record.key),
                clsId: this.text(record.clsId || record.roomId || record.classId),
                roomName: this.text(record.roomName),
                date: this.text(record.date),
                year: record.year ?? "",
                term: record.term ?? "",
                teacher: this.text(record.teacher),
                data: record.data && typeof record.data === "object" && !Array.isArray(record.data)
                    ? { ...record.data }
                    : {},
                notes: record.notes && typeof record.notes === "object" && !Array.isArray(record.notes)
                    ? { ...record.notes }
                    : {},
                savedAt: this.text(record.savedAt),
                evidence: {
                    loaded: record.evidence?.loaded === true,
                    photoCount: Number.isInteger(record.evidence?.photoCount)
                        ? Math.max(0, record.evidence.photoCount)
                        : null,
                    hasSignature: typeof record.evidence?.hasSignature === "boolean"
                        ? record.evidence.hasSignature
                        : null
                }
            }))
            .filter(record => record.date)
            .sort((left, right) => left.date.localeCompare(right.date));
    }

    collectStudents(rawStudents, records) {
        const { students, seen } = this.normalizeRoster(rawStudents);

        records.forEach(record => {
            Object.keys(record.data).forEach(studentId => {
                const id = this.text(studentId);
                if (!id || seen.has(id)) {
                    return;
                }
                seen.add(id);
                students.push({
                    id,
                    num: "",
                    name: id,
                    gender: "",
                    roster: false,
                    sourceOrder: students.length
                });
            });
        });

        return students.sort((left, right) => this.compareStudents(left, right));
    }

    compareStudents(left, right) {
        if (left.roster !== right.roster) {
            return left.roster ? -1 : 1;
        }

        const leftNumber = Number(left.num);
        const rightNumber = Number(right.num);
        const leftHasNumber = left.num !== "" && Number.isFinite(leftNumber);
        const rightHasNumber = right.num !== "" && Number.isFinite(rightNumber);

        if (leftHasNumber && rightHasNumber && leftNumber !== rightNumber) {
            return leftNumber - rightNumber;
        }
        if (leftHasNumber !== rightHasNumber) {
            return leftHasNumber ? -1 : 1;
        }

        const numberCompare = left.num.localeCompare(right.num, this.locale, { numeric: true });
        if (numberCompare) {
            return numberCompare;
        }
        const nameCompare = left.name.localeCompare(right.name, this.locale, { numeric: true });
        if (nameCompare) {
            return nameCompare;
        }
        return left.id.localeCompare(right.id, this.locale, { numeric: true });
    }

    uniqueValues(records, field) {
        return [...new Set(
            records
                .map(record => this.text(record[field]))
                .filter(Boolean)
        )].sort((left, right) => left.localeCompare(right, this.locale, { numeric: true }));
    }

    chooseMetadataValue(explicitValue, values) {
        const explicit = this.text(explicitValue);
        if (explicit) {
            return explicit;
        }
        if (values.length === 1) {
            return values[0];
        }
        return values.length > 1 ? "mixed" : "";
    }

    percentage(numerator, denominator) {
        if (!denominator) {
            return null;
        }
        return Math.round((numerator / denominator) * 10000) / 100;
    }

    buildDaily(records, students) {
        return records.map(record => {
            let present = 0;
            let absent = 0;
            let unchecked = 0;

            students.forEach(student => {
                const status = this.normalizeStatus(record.data[student.id]);
                if (status === "present") {
                    present += 1;
                } else if (status === "absent") {
                    absent += 1;
                } else {
                    unchecked += 1;
                }
            });

            const checked = present + absent;
            return {
                key: record.key,
                date: record.date,
                year: record.year,
                term: record.term,
                present,
                absent,
                unchecked,
                checked,
                totalStudents: students.length,
                complete: unchecked === 0,
                attendanceRate: this.percentage(present, checked),
                savedAt: record.savedAt,
                evidence: { ...record.evidence }
            };
        });
    }

    buildStudents(records, students) {
        return students.map(student => {
            let present = 0;
            let absent = 0;
            let unchecked = 0;
            let notesCount = 0;

            records.forEach(record => {
                const status = this.normalizeStatus(record.data[student.id]);
                if (status === "present") {
                    present += 1;
                } else if (status === "absent") {
                    absent += 1;
                } else {
                    unchecked += 1;
                }
                if (this.text(record.notes[student.id])) {
                    notesCount += 1;
                }
            });

            const checked = present + absent;
            return {
                id: student.id,
                num: student.num,
                name: student.name,
                gender: student.gender,
                roster: student.roster,
                present,
                absent,
                unchecked,
                checked,
                totalDays: records.length,
                notesCount,
                attendanceRate: this.percentage(present, checked)
            };
        });
    }

    build(history = {}, context = {}) {
        const source = history && typeof history === "object" ? history : {};
        const records = this.normalizeRecords(source.records);
        const rawStudents = context.students || context.room?.students || source.students || [];
        const students = this.collectStudents(rawStudents, records);
        const daily = this.buildDaily(records, students);
        const studentRows = this.buildStudents(records, students);
        const yearValues = this.uniqueValues(records, "year");
        const termValues = this.uniqueValues(records, "term");

        const totals = daily.reduce((summary, day) => {
            summary.present += day.present;
            summary.absent += day.absent;
            summary.unchecked += day.unchecked;
            summary.checked += day.checked;
            summary.completeDays += day.complete ? 1 : 0;
            return summary;
        }, {
            requestedDays: Math.max(0, this.number(source.requestedDays)),
            schoolDays: records.length,
            completeDays: 0,
            incompleteDays: 0,
            students: students.length,
            studentRows: records.length * students.length,
            present: 0,
            absent: 0,
            unchecked: 0,
            checked: 0,
            attendanceRate: null
        });
        totals.incompleteDays = totals.schoolDays - totals.completeDays;
        totals.attendanceRate = this.percentage(totals.present, totals.checked);

        return {
            metadata: {
                schoolName: this.text(
                    context.schoolName ||
                    context.settings?.schoolName ||
                    context.settings?.school,
                    "โรงเรียน"
                ),
                roomId: this.text(source.roomId || context.roomId || context.room?.id),
                roomName: this.text(source.roomName || context.roomName || context.room?.name),
                teacher: this.text(source.teacher || context.teacher, "ครูประจำชั้น"),
                startDate: this.text(source.startDate),
                endDate: this.text(source.endDate || source.startDate),
                year: this.chooseMetadataValue(context.year, yearValues),
                term: this.chooseMetadataValue(context.term, termValues),
                yearValues,
                termValues
            },
            totals,
            daily,
            students: studentRows,
            source: {
                requestedDays: totals.requestedDays,
                recordCount: records.length,
                evidenceHydrated: records.some(record => record.evidence.loaded)
            }
        };
    }
}

window.AttendanceReportBuilderClass = AttendanceReportBuilder;
window.AttendanceReportBuilder = new AttendanceReportBuilder();
