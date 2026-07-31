class AdminOperationalReportService {
    constructor(repository = window.OperationalReportRepository, options = {}) {
        this.repository = repository;
        this.clock = options.clock || (() => new Date());
        this.periodTypes = new Set(["day", "week", "fortnight", "month", "semester"]);
        this.views = new Set(["room", "grade", "school"]);
    }

    ensureRepository() {
        this.repository ||= window.OperationalReportRepository;
        if (!this.repository?.loadPeriodSnapshot) {
            throw new Error("OperationalReportRepository is not available.");
        }
        return this.repository;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            const error = new Error("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
            error.code = "ADMIN_SESSION_REQUIRED";
            throw error;
        }
    }

    entries(collection) {
        if (Array.isArray(collection)) {
            return collection.map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }
        return Object.entries(collection || {})
            .filter(([, record]) => record && typeof record === "object");
    }

    number(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    isoDate(value) {
        const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
        if (!match) return "";
        const [year, month, day] = match[0].split("-").map(Number);
        const date = new Date(Date.UTC(year, month - 1, day));
        return date.getUTCFullYear() === year
            && date.getUTCMonth() === month - 1
            && date.getUTCDate() === day ? match[0] : "";
    }

    dateObject(value) {
        const normalized = this.isoDate(value);
        if (!normalized) throw new Error("กรุณาระบุวันที่อ้างอิงให้ถูกต้อง");
        const [year, month, day] = normalized.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
    }

    formatDate(date) {
        return date.toISOString().slice(0, 10);
    }

    today() {
        const now = this.clock();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
        return local.toISOString().slice(0, 10);
    }

    resolvePeriod(input = {}) {
        const type = String(input.type || "day").toLowerCase();
        if (!this.periodTypes.has(type)) throw new Error("รูปแบบช่วงรายงานไม่ถูกต้อง");
        const anchorDate = this.isoDate(input.anchorDate) || this.today();
        const anchor = this.dateObject(anchorDate);
        let start = new Date(anchor);
        let end = new Date(anchor);

        if (type === "week") {
            const mondayOffset = (anchor.getUTCDay() + 6) % 7;
            start.setUTCDate(anchor.getUTCDate() - mondayOffset);
            end = new Date(start);
            end.setUTCDate(start.getUTCDate() + 6);
        } else if (type === "fortnight") {
            start.setUTCDate(anchor.getUTCDate() <= 15 ? 1 : 16);
            if (anchor.getUTCDate() <= 15) {
                end.setUTCDate(15);
            } else {
                end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
            }
        } else if (type === "month") {
            start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1));
            end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0));
        } else if (type === "semester") {
            const startDate = this.isoDate(input.startDate);
            const endDate = this.isoDate(input.endDate);
            if (!startDate || !endDate || startDate > endDate) {
                throw new Error("กรุณาระบุวันเริ่มและวันสิ้นสุดภาคเรียนให้ถูกต้อง");
            }
            start = this.dateObject(startDate);
            end = this.dateObject(endDate);
        }

        const labels = {
            day: "รายวัน",
            week: "รายสัปดาห์",
            fortnight: "รอบ 15 วัน",
            month: "รายเดือน",
            semester: "รายภาคเรียน"
        };
        return {
            type,
            label: labels[type],
            anchorDate,
            startDate: this.formatDate(start),
            endDate: this.formatDate(end)
        };
    }

    normalizeView(view) {
        const normalized = String(view || "room").toLowerCase();
        if (!this.views.has(normalized)) throw new Error("มุมมองรายงานไม่ถูกต้อง");
        return normalized;
    }

    roomId(record = {}, key = "") {
        const explicit = record.roomId || record.classId || record.clsId;
        if (String(explicit || "").trim()) return String(explicit);
        return String(key).replace(/_\d{4}-\d{2}-\d{2}$/, "");
    }

    realStudentCount(room = {}) {
        const students = room.students;
        if (Array.isArray(students)) {
            return students.filter((student, index) => {
                const id = String(student?.id || student?.studentId || index);
                return !/^student_/i.test(id) && student?.generated !== true;
            }).length;
        }
        if (students && typeof students === "object") {
            return Object.entries(students).filter(([id, student]) => (
                !/^student_/i.test(id) && student?.generated !== true
            )).length;
        }
        return Math.max(0, this.number(room.count ?? room.studentCount));
    }

    parseGrade(roomName) {
        const match = String(roomName || "").trim().match(/^([ปอมพ])\.?\s*(\d+)/);
        return match ? `${match[1]}.${match[2]}` : "ไม่ระบุชั้น";
    }

    compareGrade(first, second) {
        if (first === "ไม่ระบุชั้น") return second === "ไม่ระบุชั้น" ? 0 : 1;
        if (second === "ไม่ระบุชั้น") return -1;
        const order = { "อ": 0, "ป": 1, "ม": 2 };
        const firstParts = String(first || "").match(/^([ปอมพ])\.?\s*(\d+)/);
        const secondParts = String(second || "").match(/^([ปอมพ])\.?\s*(\d+)/);
        if (!firstParts || !secondParts) {
            return String(first).localeCompare(String(second), "th", { numeric: true });
        }
        const levelOrder = (order[firstParts[1]] ?? 9) - (order[secondParts[1]] ?? 9);
        return levelOrder || this.number(firstParts[2]) - this.number(secondParts[2]);
    }

    roomSequence(roomName = "") {
        const match = String(roomName).trim().match(/^[ปอมพ]\.?\s*\d+\s*[-/]?\s*(\d+)/);
        return match ? this.number(match[1], Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;
    }

    compareRooms(first = {}, second = {}) {
        const gradeOrder = this.compareGrade(first.grade, second.grade);
        if (gradeOrder !== 0) return gradeOrder;
        const sequenceOrder = this.roomSequence(first.roomName) - this.roomSequence(second.roomName);
        if (sequenceOrder !== 0) return sequenceOrder;
        return String(first.roomName).localeCompare(String(second.roomName), "th", {
            numeric: true,
            sensitivity: "base"
        });
    }

    normalizeRooms(collection = {}) {
        return this.entries(collection).map(([key, room]) => ({
            id: String(room.id || key),
            name: String(room.name || room.roomName || key),
            grade: String(room.level || "").trim() || this.parseGrade(room.name || room.roomName),
            students: this.realStudentCount(room)
        }));
    }

    quantity(record = {}, fields = ["totalBoxes", "total", "boxes", "quantity"], fallback = 0) {
        for (const field of fields) {
            const value = Number(record[field]);
            if (Number.isFinite(value)) return Math.max(0, value);
        }
        return Math.max(0, fallback);
    }

    attendanceQuantity(record = {}) {
        if (record.data && typeof record.data === "object") {
            return Object.values(record.data).filter(status => status === "present").length;
        }
        return this.quantity(record, ["presentCount", "consumed", "totalBoxes"]);
    }

    pendingQuantity(record = {}) {
        for (const field of ["totalBoxes", "total", "boxes"]) {
            const value = Number(record[field]);
            if (Number.isFinite(value)) return Math.max(0, value);
        }
        if (record.students && typeof record.students === "object") {
            return Object.values(record.students).reduce((total, info) => (
                total + (Array.isArray(info?.days) ? info.days.length : 0)
            ), 0);
        }
        return record.studentId ? 1 : 0;
    }

    recordDate(record = {}, fields = []) {
        for (const field of fields) {
            const date = this.isoDate(record[field]);
            if (date) return date;
        }
        return "";
    }

    filterRecords(collection, period, fields) {
        return this.entries(collection)
            .filter(([, record]) => {
                const date = this.recordDate(record, fields);
                return date >= period.startDate && date <= period.endDate;
            })
            .map(([, record]) => record);
    }

    withPeriodLocalSources(snapshot = {}, period = {}) {
        const localPending = this.filterRecords(
            snapshot.localPending,
            period,
            ["dispenseDate", "date", "issueDate", "absentDate"]
        );
        const localRetro = this.filterRecords(
            snapshot.localRetro,
            period,
            ["date", "issueDate", "retroEnd", "retroStart"]
        );
        const localVacation = this.filterRecords(
            snapshot.localVacation,
            period,
            ["date", "issueDate"]
        );
        return {
            ...snapshot,
            localPending,
            localRetro,
            localVacation,
            reportLocalDiagnostics: {
                ...(snapshot.reportLocalDiagnostics || {}),
                counts: {
                    pending: localPending.length,
                    retro: localRetro.length,
                    vacation: localVacation.length
                }
            }
        };
    }

    add(index, roomId, quantity) {
        const id = String(roomId || "").trim();
        if (id) index[id] = (index[id] || 0) + this.number(quantity);
    }

    index(collection, resolver) {
        const result = {};
        this.entries(collection).forEach(([key, record]) => {
            this.add(result, this.roomId(record, key), resolver(record));
        });
        return result;
    }

    mergeIndexes(...indexes) {
        const result = {};
        indexes.forEach(index => Object.entries(index || {}).forEach(([roomId, quantity]) => {
            this.add(result, roomId, quantity);
        }));
        return result;
    }

    buildRoomRows(snapshot = {}) {
        const distributed = this.index(snapshot.distributes, record => this.quantity(record, ["total"]));
        const attendance = this.index(snapshot.attendance, record => this.attendanceQuantity(record));
        const pending = this.mergeIndexes(
            this.index(snapshot.absentMilk, record => this.pendingQuantity(record)),
            this.index(snapshot.localPending, record => this.quantity(record, ["boxes", "totalBoxes", "total"], 1))
        );
        const retro = this.mergeIndexes(
            this.index(snapshot.retroMilk, record => this.quantity(record, ["totalBoxes", "total"])),
            this.index(snapshot.localRetro, record => this.quantity(record, ["total", "totalBoxes"]))
        );
        const vacation = this.mergeIndexes(
            this.index(snapshot.vacationMilk, record => this.quantity(record, ["totalBoxes", "total"])),
            this.index(snapshot.localVacation, record => this.quantity(record, ["total", "totalBoxes"]))
        );

        return this.normalizeRooms(snapshot.rooms).map(room => {
            const row = {
                roomId: room.id,
                roomName: room.name,
                grade: room.grade,
                students: room.students,
                distributed: this.number(distributed[room.id]),
                attendance: this.number(attendance[room.id]),
                pending: this.number(pending[room.id]),
                retro: this.number(retro[room.id]),
                vacation: this.number(vacation[room.id])
            };
            row.used = row.attendance + row.pending + row.retro + row.vacation;
            row.netMovement = row.distributed - row.used;
            return row;
        }).filter(row => row.distributed || row.used)
            .sort((left, right) => this.compareRooms(left, right));
    }

    aggregateRows(rows = [], keyName = "grade") {
        const groups = new Map();
        rows.forEach(row => {
            const key = row[keyName] || "ไม่ระบุ";
            const current = groups.get(key) || {
                [keyName]: key, roomName: key, roomCount: 0, students: 0,
                distributed: 0, attendance: 0, pending: 0, retro: 0,
                vacation: 0, used: 0, netMovement: 0
            };
            current.roomCount += 1;
            ["students", "distributed", "attendance", "pending", "retro", "vacation", "used", "netMovement"]
                .forEach(field => { current[field] += this.number(row[field]); });
            groups.set(key, current);
        });
        return [...groups.values()].sort((left, right) => keyName === "grade"
            ? this.compareGrade(left.grade, right.grade)
            : String(left[keyName]).localeCompare(String(right[keyName]), "th", { numeric: true }));
    }

    schoolTotal(rows = [], snapshot = {}) {
        const total = {
            roomName: "ทั้งโรงเรียน",
            grade: "ทั้งโรงเรียน",
            roomCount: rows.length,
            students: 0,
            distributed: 0,
            attendance: 0,
            pending: 0,
            retro: 0,
            vacation: 0,
            used: 0,
            netMovement: 0
        };
        rows.forEach(row => {
            ["students", "distributed", "attendance", "pending", "retro", "vacation", "used", "netMovement"]
                .forEach(field => { total[field] += this.number(row[field]); });
        });
        total.received = this.entries(snapshot.receives)
            .reduce((sum, [, record]) => sum + this.quantity(record, ["total"]), 0);
        return total;
    }

    normalizeDistributions(snapshot = {}) {
        const records = this.entries(snapshot.distributes).map(([id, record]) => ({
            id: String(record.id || id),
            date: this.isoDate(record.date || record.createdAt),
            createdAt: String(record.createdAt || ""),
            roomId: this.roomId(record, id),
            roomName: String(record.roomName || this.roomId(record, id) || "—"),
            students: this.number(record.students),
            days: this.number(record.days),
            crates: this.number(record.crates),
            boxes: this.number(record.boxes),
            perCrate: Math.max(1, this.number(record.perCrate, 36)),
            total: this.quantity(record, ["total"]),
            stockBefore: this.number(record.stockBefore),
            stockAfter: this.number(record.stockAfter),
            note: String(record.note || "")
        }));
        return this.sortDistributionChronology(records).map(record => {
            const expectedStockAfter = this.number(record.stockBefore) - this.number(record.total);
            const stockDifference = this.number(record.stockAfter) - expectedStockAfter;
            return {
                ...record,
                expectedStockAfter,
                stockDifference,
                stockValid: stockDifference === 0
            };
        });
    }

    distributionTime(record = {}) {
        const timestamp = Date.parse(record.createdAt || "");
        return Number.isFinite(timestamp) ? timestamp : null;
    }

    compareDistributionFallback(left = {}, right = {}) {
        const dateOrder = String(left.date).localeCompare(String(right.date));
        if (dateOrder !== 0) return dateOrder;
        const stockOrder = this.number(right.stockBefore) - this.number(left.stockBefore);
        if (stockOrder !== 0) return stockOrder;
        return String(left.id).localeCompare(String(right.id), "th", { numeric: true });
    }

    sortDistributionChain(records = []) {
        const remaining = [...records];
        const ordered = [];
        while (remaining.length) {
            const afterBalances = new Set(remaining.map(record => this.number(record.stockAfter)));
            const starts = remaining.filter(record => !afterBalances.has(this.number(record.stockBefore)));
            const candidates = starts.length ? starts : remaining;
            candidates.sort((left, right) => this.compareDistributionFallback(left, right));
            let current = candidates[0];
            while (current) {
                ordered.push(current);
                remaining.splice(remaining.indexOf(current), 1);
                const next = remaining.filter(record => (
                    this.number(record.stockBefore) === this.number(current.stockAfter)
                )).sort((left, right) => this.compareDistributionFallback(left, right))[0];
                current = next || null;
            }
        }
        return ordered;
    }

    sortDistributionChronology(records = []) {
        const byDate = new Map();
        records.forEach(record => {
            const date = String(record.date || "");
            if (!byDate.has(date)) byDate.set(date, []);
            byDate.get(date).push(record);
        });
        return [...byDate.keys()].sort().flatMap(date => {
            const datedRecords = byDate.get(date);
            const timed = datedRecords.filter(record => this.distributionTime(record) !== null)
                .sort((left, right) => (
                    this.distributionTime(left) - this.distributionTime(right)
                    || this.compareDistributionFallback(left, right)
                ));
            const untimed = this.sortDistributionChain(
                datedRecords.filter(record => this.distributionTime(record) === null)
            );
            return [...timed, ...untimed];
        });
    }

    build(snapshot = {}, period = {}, view = "room") {
        snapshot = this.withPeriodLocalSources(snapshot, period);
        const normalizedView = this.normalizeView(view);
        const roomRows = this.buildRoomRows(snapshot);
        const gradeRows = this.aggregateRows(roomRows, "grade");
        const schoolTotal = this.schoolTotal(roomRows, snapshot);
        const rows = normalizedView === "grade"
            ? gradeRows
            : normalizedView === "school" ? [schoolTotal] : roomRows;
        const settings = snapshot.settings || {};
        const roomStockTotal = Object.values(snapshot.roomStock || {})
            .reduce((sum, value) => sum + this.number(value), 0);
        return {
            period,
            view: normalizedView,
            schoolName: String(settings.school || settings.schoolName || "โรงเรียน"),
            academicYear: String(settings.year || settings.academicYear || ""),
            semester: String(settings.semester || settings.term || ""),
            currentStock: {
                main: this.number(snapshot.mainStock),
                rooms: roomStockTotal
            },
            roomRows,
            gradeRows,
            schoolTotal,
            rows,
            distributions: this.normalizeDistributions(snapshot),
            generatedAt: this.clock().toISOString(),
            sourceDiagnostics: snapshot.reportLocalDiagnostics || {
                missing: [], invalid: [], counts: { pending: 0, retro: 0, vacation: 0 }
            }
        };
    }

    async generate(session, periodInput = {}, view = "room", extraSources = {}) {
        this.assertAdmin(session);
        const period = this.resolvePeriod(periodInput);
        const snapshot = await this.ensureRepository().loadPeriodSnapshot(period);
        return this.build({ ...snapshot, ...extraSources }, period, view);
    }

    summaryExportRows(report) {
        const rows = report.rows.length ? report.rows : [report.schoolTotal];
        return rows.map((row, index) => ({
            "ห้อง/ระดับ": report.view === "school" ? report.schoolName : row.roomName,
            "นักเรียน": row.students,
            "รับเข้า (ทั้งโรงเรียน)": index === 0 ? report.schoolTotal.received : "",
            "จ่ายให้ห้อง": row.distributed,
            "ดื่มปกติ": row.attendance,
            "นมค้าง": row.pending,
            "ย้อนหลัง": row.retro,
            "ปิดเทอม": row.vacation,
            "ใช้รวม": row.used,
            "สุทธิช่วง": row.netMovement,
            "Main Stock ปัจจุบัน": index === 0 ? report.currentStock.main : "",
            "Room Stock รวมปัจจุบัน": index === 0 ? report.currentStock.rooms : ""
        }));
    }

    distributionExportRows(report) {
        return report.distributions.map((record, index) => ({
            "ลำดับ": index + 1,
            "วันที่": record.date,
            "ห้องเรียน": record.roomName,
            "นักเรียน": record.students,
            "จำนวนวัน": record.days,
            "ลัง": record.crates,
            "กล่องเศษ": record.boxes,
            "รวมกล่อง": record.total,
            "Main Stock ก่อน": record.stockBefore,
            "Main Stock หลัง": record.stockAfter,
            "ตรวจยอด": record.stockValid
                ? "ถูกต้อง"
                : `ผิดปกติ: ควรเหลือ ${record.expectedStockAfter}`,
            "หมายเหตุ": record.note
        }));
    }

    buildExportModel(report, kind = "summary") {
        const rows = kind === "distribution"
            ? this.distributionExportRows(report)
            : this.summaryExportRows(report);
        const label = kind === "distribution" ? "รายงานการจ่ายนม" : "สรุปบริหารจัดการนม";
        return {
            filename: `${label}-${report.period.startDate}-ถึง-${report.period.endDate}.csv`,
            rows
        };
    }

    buildPrintModel(report, kind = "summary") {
        return {
            title: kind === "distribution" ? "รายงานการจ่ายนมให้ห้องเรียน" : "สรุปการบริหารจัดการนมโรงเรียน",
            schoolName: report.schoolName,
            academicYear: report.academicYear,
            periodLabel: `${report.period.label} ${report.period.startDate} ถึง ${report.period.endDate}`,
            rows: kind === "distribution"
                ? this.distributionExportRows(report)
                : this.summaryExportRows(report)
        };
    }
}

window.AdminOperationalReportService = new AdminOperationalReportService();
