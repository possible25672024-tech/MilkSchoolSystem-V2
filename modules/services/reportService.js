class ReportService {
    constructor(repository = window.ReportRepository, options = {}) {
        this.repository = repository;
        this.clock = options.clock || (() => new Date());
        this.allowedViews = new Set(["room", "grade", "school"]);
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.ReportRepository;
        }

        if (!this.repository?.loadReportSnapshot) {
            throw new Error("ReportRepository is not available.");
        }

        return this.repository;
    }

    toNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    entries(collection) {
        if (Array.isArray(collection)) {
            return collection
                .map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }

        if (collection && typeof collection === "object") {
            return Object.entries(collection)
                .filter(([, record]) => record && typeof record === "object");
        }

        return [];
    }

    values(collection) {
        return this.entries(collection).map(([, record]) => record);
    }

    normalizeRooms(rawRooms) {
        return this.entries(rawRooms).map(([key, room]) => ({
            ...room,
            id: String(room.id || key),
            name: String(room.name || room.roomName || room.id || key),
            count: this.toNumber(room.count ?? room.studentCount ?? room.students?.length)
        }));
    }

    parseGrade(roomName) {
        if (!roomName) {
            return "ไม่ระบุชั้น";
        }

        const match = String(roomName).trim().match(/^([ปอมพ])\.?\s*(\d+)/);
        return match ? `${match[1]}.${match[2]}` : "ไม่ระบุชั้น";
    }

    getRoomGrade(room = {}) {
        const explicitLevel = String(room.level || "").trim();
        return explicitLevel || this.parseGrade(room.name);
    }

    compareGrade(first, second) {
        if (first === "ไม่ระบุชั้น") {
            return second === "ไม่ระบุชั้น" ? 0 : 1;
        }
        if (second === "ไม่ระบุชั้น") {
            return -1;
        }

        const order = { อ: 0, ป: 1, ม: 2 };
        const firstParts = String(first).match(/^([ปอมพ])\.?(\d+)/);
        const secondParts = String(second).match(/^([ปอมพ])\.?(\d+)/);

        if (!firstParts || !secondParts) {
            return String(first).localeCompare(String(second), "th");
        }

        const firstOrder = order[firstParts[1]] ?? 9;
        const secondOrder = order[secondParts[1]] ?? 9;
        if (firstOrder !== secondOrder) {
            return firstOrder - secondOrder;
        }

        return this.toNumber(firstParts[2]) - this.toNumber(secondParts[2]);
    }

    resolveRoomId(record = {}, key = "") {
        const explicit = record.roomId || record.classId || record.clsId;
        if (explicit !== undefined && explicit !== null && String(explicit).trim()) {
            return String(explicit);
        }

        const keyMatch = String(key).match(/^(.*)_\d{4}-\d{2}-\d{2}$/);
        return keyMatch ? keyMatch[1] : "";
    }

    recordQuantity(record = {}, fields = ["totalBoxes", "total", "boxes", "quantity"], fallback = 0) {
        for (const field of fields) {
            const value = Number(record[field]);
            if (Number.isFinite(value)) {
                return value;
            }
        }
        return fallback;
    }

    attendanceQuantity(record = {}) {
        if (record.data && typeof record.data === "object") {
            return Object.values(record.data).filter(status => status === "present").length;
        }

        return this.recordQuantity(record, ["presentCount", "consumed", "totalBoxes"]);
    }

    addQuantity(index, roomId, quantity) {
        const normalizedRoomId = String(roomId || "").trim();
        if (!normalizedRoomId) {
            return;
        }

        index[normalizedRoomId] = (index[normalizedRoomId] || 0) + this.toNumber(quantity);
    }

    indexRecords(collection, quantityResolver) {
        const index = {};
        this.entries(collection).forEach(([key, record]) => {
            const roomId = this.resolveRoomId(record, key);
            this.addQuantity(index, roomId, quantityResolver(record, key));
        });
        return index;
    }

    mergeIndexes(...indexes) {
        const merged = {};
        indexes.forEach(index => {
            Object.entries(index || {}).forEach(([roomId, quantity]) => {
                this.addQuantity(merged, roomId, quantity);
            });
        });
        return merged;
    }

    buildQuantityIndexes(snapshot = {}) {
        const distributed = this.indexRecords(
            snapshot.distributes,
            record => this.recordQuantity(record, ["total"])
        );
        const attendance = this.indexRecords(
            snapshot.mcAttendance || snapshot.attendance,
            record => this.attendanceQuantity(record)
        );
        const cloudPending = this.indexRecords(
            snapshot.absentMilk,
            record => this.recordQuantity(record, ["totalBoxes", "total", "boxes"])
        );
        const localPending = this.indexRecords(
            snapshot.localPending || snapshot.storedMilkDispensed,
            record => this.recordQuantity(record, ["boxes", "totalBoxes", "total"], 1)
        );
        const cloudRetro = this.indexRecords(
            snapshot.retroMilk,
            record => this.recordQuantity(record, ["totalBoxes", "total"])
        );
        const localRetro = this.indexRecords(
            snapshot.localRetro || snapshot.backdatedMilkRecords,
            record => this.recordQuantity(record, ["total", "totalBoxes"])
        );
        const cloudVacation = this.indexRecords(
            snapshot.vacationMilk,
            record => this.recordQuantity(record, ["totalBoxes", "total"])
        );
        const localVacation = this.indexRecords(
            snapshot.localVacation || snapshot.vacationMilkRecords,
            record => this.recordQuantity(record, ["total", "totalBoxes"])
        );

        return {
            distributed,
            attendance,
            pending: this.mergeIndexes(localPending, cloudPending),
            retro: this.mergeIndexes(localRetro, cloudRetro),
            vacation: this.mergeIndexes(localVacation, cloudVacation)
        };
    }

    buildRoomSummary(snapshot = {}) {
        const indexes = this.buildQuantityIndexes(snapshot);

        return this.normalizeRooms(snapshot.rooms)
            .map(room => {
                const roomId = room.id;
                const distTotal = this.toNumber(indexes.distributed[roomId]);
                const usedChk = this.toNumber(indexes.attendance[roomId]);
                const usedPending = this.toNumber(indexes.pending[roomId]);
                const usedRetro = this.toNumber(indexes.retro[roomId]);
                const usedVacation = this.toNumber(indexes.vacation[roomId]);
                const remaining = distTotal
                    - usedChk
                    - usedPending
                    - usedRetro
                    - usedVacation;

                return {
                    room,
                    roomId,
                    roomName: room.name,
                    grade: this.getRoomGrade(room),
                    students: room.count,
                    distTotal,
                    usedChk,
                    usedPending,
                    usedRetro,
                    usedVacation,
                    remaining,
                    usedPercent: this.usedPercent(distTotal, remaining)
                };
            })
            .sort((first, second) => first.roomName.localeCompare(second.roomName, "th"));
    }

    groupByGrade(summary = []) {
        const groups = {};

        summary.forEach(room => {
            const grade = room.grade;
            if (!groups[grade]) {
                groups[grade] = {
                    grade,
                    rooms: [],
                    roomCount: 0,
                    students: 0,
                    distTotal: 0,
                    usedChk: 0,
                    usedPending: 0,
                    usedRetro: 0,
                    usedVacation: 0,
                    remaining: 0,
                    usedPercent: 0
                };
            }

            const group = groups[grade];
            group.rooms.push(room);
            group.roomCount += 1;
            group.students += room.students;
            group.distTotal += room.distTotal;
            group.usedChk += room.usedChk;
            group.usedPending += room.usedPending;
            group.usedRetro += room.usedRetro;
            group.usedVacation += room.usedVacation;
            group.remaining += room.remaining;
        });

        return Object.values(groups)
            .map(group => ({
                ...group,
                usedPercent: this.usedPercent(group.distTotal, group.remaining)
            }))
            .sort((first, second) => this.compareGrade(first.grade, second.grade));
    }

    buildSchoolTotal(summary = []) {
        const total = summary.reduce((result, room) => ({
            roomCount: result.roomCount + 1,
            students: result.students + room.students,
            distTotal: result.distTotal + room.distTotal,
            usedChk: result.usedChk + room.usedChk,
            usedPending: result.usedPending + room.usedPending,
            usedRetro: result.usedRetro + room.usedRetro,
            usedVacation: result.usedVacation + room.usedVacation,
            remaining: result.remaining + room.remaining
        }), {
            roomCount: 0,
            students: 0,
            distTotal: 0,
            usedChk: 0,
            usedPending: 0,
            usedRetro: 0,
            usedVacation: 0,
            remaining: 0
        });

        return {
            ...total,
            usedPercent: this.usedPercent(total.distTotal, total.remaining)
        };
    }

    usedPercent(distTotal, remaining) {
        const normalizedDistributed = this.toNumber(distTotal);
        const used = normalizedDistributed - this.toNumber(remaining);
        return normalizedDistributed > 0
            ? Math.round((used / normalizedDistributed) * 100)
            : 0;
    }

    normalizeView(view) {
        const normalized = String(view || "room").toLowerCase();
        if (!this.allowedViews.has(normalized)) {
            throw new Error(`Unsupported report view: ${view}`);
        }
        return normalized;
    }

    buildReport(snapshot = {}, view = "room") {
        const normalizedView = this.normalizeView(view);
        const roomSummary = this.buildRoomSummary(snapshot);
        const gradeSummary = this.groupByGrade(roomSummary);
        const schoolTotal = this.buildSchoolTotal(roomSummary);
        const settings = snapshot.settings || {};

        const rows = normalizedView === "grade"
            ? gradeSummary
            : normalizedView === "school"
                ? [schoolTotal]
                : roomSummary;

        return {
            view: normalizedView,
            settings,
            schoolName: String(settings.school || settings.schoolName || "โรงเรียน"),
            academicYear: String(settings.year || settings.academicYear || ""),
            roomSummary,
            gradeSummary,
            schoolTotal,
            rows,
            generatedAt: this.clock().toISOString()
        };
    }

    async generate(view = "room", extraSources = {}) {
        const snapshot = await this.ensureRepository().loadReportSnapshot();
        return this.buildReport({ ...snapshot, ...extraSources }, view);
    }

    buildExportRows(report) {
        if (!report || !this.allowedViews.has(report.view)) {
            throw new Error("A generated report is required for export.");
        }

        if (report.view === "grade") {
            return report.gradeSummary.map(group => ({
                "ระดับชั้น": group.grade,
                "จำนวนห้อง": group.roomCount,
                "นักเรียน": group.students,
                "จ่ายทั้งหมด": group.distTotal,
                "ดื่มแล้ว": group.usedChk,
                "นมค้าง": group.usedPending,
                "นมย้อนหลัง": group.usedRetro,
                "นมปิดเทอม": group.usedVacation,
                "คงเหลือ": group.remaining,
                "% ใช้ไป": group.usedPercent
            }));
        }

        if (report.view === "school") {
            const total = report.schoolTotal;
            return [{
                "โรงเรียน": report.schoolName,
                "จำนวนห้อง": total.roomCount,
                "นักเรียน": total.students,
                "จ่ายทั้งหมด": total.distTotal,
                "ดื่มแล้ว": total.usedChk,
                "นมค้าง": total.usedPending,
                "นมย้อนหลัง": total.usedRetro,
                "นมปิดเทอม": total.usedVacation,
                "คงเหลือ": total.remaining,
                "% ใช้ไป": total.usedPercent
            }];
        }

        return report.roomSummary.map(room => ({
            "ห้องเรียน": room.roomName,
            "ระดับชั้น": room.grade,
            "นักเรียน": room.students,
            "จ่ายทั้งหมด": room.distTotal,
            "ดื่มแล้ว": room.usedChk,
            "นมค้าง": room.usedPending,
            "นมย้อนหลัง": room.usedRetro,
            "นมปิดเทอม": room.usedVacation,
            "คงเหลือ": room.remaining,
            "% ใช้ไป": room.usedPercent
        }));
    }

    buildExportModel(report) {
        const viewLabels = {
            room: "รายห้อง",
            grade: "รายระดับชั้น",
            school: "ทั้งโรงเรียน"
        };
        const yearSuffix = report.academicYear ? `-${report.academicYear}` : "";

        return {
            sheetName: "รายงานการจ่ายนม",
            filename: `รายงานการจ่ายนม-${viewLabels[report.view]}${yearSuffix}.xlsx`,
            rows: this.buildExportRows(report)
        };
    }

    buildPrintModel(report) {
        const viewLabels = {
            room: "รายห้องเรียน",
            grade: "รายระดับชั้น",
            school: "ทั้งโรงเรียน"
        };

        return {
            title: `รายงานการจ่ายนม (${viewLabels[report.view]})`,
            schoolName: report.schoolName,
            academicYear: report.academicYear,
            generatedAt: report.generatedAt,
            columns: [
                "จ่ายทั้งหมด",
                "ดื่มแล้ว",
                "นมค้าง",
                "นมย้อนหลัง",
                "นมปิดเทอม",
                "คงเหลือ",
                "% ใช้ไป"
            ],
            rows: this.buildExportRows(report)
        };
    }
}

window.ReportService = new ReportService();
