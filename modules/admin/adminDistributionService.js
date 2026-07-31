class AdminDistributionService {
    constructor(
        stockService = window.StockService,
        stockRepository = window.StockRepository
    ) {
        this.stockService = stockService;
        this.stockRepository = stockRepository;
        this.quarantinedRoomId = "mqn0z13eyx5b";
        this.quarantinedDate = "2026-07-28";
    }

    ensureDependencies() {
        this.stockService ||= window.StockService;
        this.stockRepository ||= window.StockRepository;
        const required = [
            [this.stockService, "calculateDistributionTotal"],
            [this.stockService, "distributeToRoomGuarded"],
            [this.stockRepository, "loadMainStock"],
            [this.stockRepository, "loadRoomStocks"],
            [this.stockRepository, "loadRooms"],
            [this.stockRepository, "loadDistributionSummaries"]
        ];
        const missing = required.find(([owner, method]) => !owner?.[method]);
        if (missing) throw new Error(`Admin Distribution dependency ${missing[1]} is not available.`);
    }

    businessError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            throw this.businessError(
                "ADMIN_SESSION_REQUIRED",
                "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ"
            );
        }
    }

    entries(collection = {}) {
        if (Array.isArray(collection)) {
            return collection
                .map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }
        return Object.entries(collection || {})
            .filter(([, record]) => record && typeof record === "object");
    }

    realStudents(room = {}) {
        const students = Array.isArray(room.students)
            ? room.students
            : Object.values(room.students || {});
        return students.filter((student, index) => {
            if (!student || typeof student !== "object") return false;
            const id = String(
                student.id || student.studentId || student.code || student["รหัสนักเรียน"] || index
            );
            return !/^student[_-]/i.test(id);
        });
    }

    normalizeRooms(collection = {}, roomStocks = {}) {
        return this.entries(collection)
            .map(([key, room]) => {
                const id = String(room.id || room.roomId || key).trim();
                const realStudents = this.realStudents(room);
                const configuredCount = Math.max(0, Number(room.count ?? room.studentCount) || 0);
                return {
                    id,
                    name: String(room.name || room.roomName || room.className || id),
                    level: String(room.level || room.grade || ""),
                    teacher: String(room.teacher || room.teacherName || ""),
                    students: realStudents.length || configuredCount,
                    roomStock: Number(roomStocks?.[id]) || 0
                };
            })
            .filter(room => room.id)
            .sort((left, right) => left.name.localeCompare(right.name, "th"));
    }

    normalizeInput(input = {}, room, mainStock) {
        const date = String(input.date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw this.businessError("DISTRIBUTION_DATE_REQUIRED", "กรุณาระบุวันที่จ่ายนม");
        }
        if (!room?.id) {
            throw this.businessError("DISTRIBUTION_ROOM_REQUIRED", "กรุณาเลือกห้องเรียน");
        }
        if (room.id === this.quarantinedRoomId && date === this.quarantinedDate) {
            throw this.businessError(
                "QUARANTINED_ROOM_DATE",
                "ห้องและวันที่นี้อยู่ระหว่างตรวจสอบเหตุการณ์ข้อมูลจริง ห้ามบันทึกรายการเพิ่ม"
            );
        }
        if (!Number.isInteger(room.students) || room.students < 1) {
            throw this.businessError(
                "ROOM_STUDENTS_REQUIRED",
                "ห้องที่เลือกยังไม่มีจำนวนนักเรียนจริง กรุณาตรวจรายชื่อก่อนจ่ายนม"
            );
        }
        const calculation = this.stockService.calculateDistributionTotal({
            students: room.students,
            days: input.days,
            perCrate: input.perCrate || 36
        });
        if (mainStock !== undefined && calculation.total > Number(mainStock || 0)) {
            throw this.businessError(
                "INSUFFICIENT_MAIN_STOCK",
                "Main Stock ไม่เพียงพอสำหรับรายการนี้"
            );
        }
        return {
            date,
            roomId: room.id,
            roomName: room.name,
            year: String(input.year || "").trim(),
            note: String(input.note || "").trim().slice(0, 300),
            ...calculation
        };
    }

    preview(adminSession, model, input = {}) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const room = model?.rooms?.find(candidate => candidate.id === String(input.roomId || ""));
        const distribution = this.normalizeInput(input, room, model?.mainStock);
        return {
            ...distribution,
            mainStockBefore: Number(model?.mainStock) || 0,
            mainStockAfter: (Number(model?.mainStock) || 0) - distribution.total,
            roomStockBefore: Number(room?.roomStock) || 0,
            roomStockAfter: (Number(room?.roomStock) || 0) + distribution.total
        };
    }

    async load(adminSession) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const [mainStock, rooms, roomStocks] = await Promise.all([
            this.stockRepository.loadMainStock(),
            this.stockRepository.loadRooms(),
            this.stockRepository.loadRoomStocks()
        ]);
        return {
            mainStock: Number(mainStock) || 0,
            rooms: this.normalizeRooms(rooms, roomStocks)
        };
    }

    normalizeHistory(collection = {}) {
        return this.entries(collection)
            .map(([id, record]) => ({
                id: String(record.id || id),
                date: String(record.date || String(record.createdAt || "").slice(0, 10)),
                createdAt: String(record.createdAt || ""),
                roomId: String(record.roomId || ""),
                roomName: String(record.roomName || record.roomId || "—"),
                students: Math.max(0, Number(record.students) || 0),
                days: Math.max(0, Number(record.days) || 0),
                perCrate: Math.max(1, Number(record.perCrate) || 36),
                crates: Math.max(0, Number(record.crates) || 0),
                boxes: Math.max(0, Number(record.boxes) || 0),
                total: Math.max(0, Number(record.total) || 0),
                year: String(record.year || ""),
                note: String(record.note || ""),
                stockBefore: Number(record.stockBefore) || 0,
                stockAfter: Number(record.stockAfter) || 0,
                roomStockBefore: Number(record.roomStockBefore) || 0,
                roomStockAfter: Number(record.roomStockAfter) || 0
            }))
            .sort((left, right) => (
                String(right.createdAt || right.date).localeCompare(String(left.createdAt || left.date))
            ));
    }

    async loadHistory(adminSession) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const [mainStock, summaries] = await Promise.all([
            this.stockRepository.loadMainStock(),
            this.stockRepository.loadDistributionSummaries()
        ]);
        const distributions = this.normalizeHistory(summaries);
        return {
            mainStock: Number(mainStock) || 0,
            totalBoxes: distributions.reduce((sum, record) => sum + record.total, 0),
            distributions
        };
    }

    async distribute(adminSession, input = {}, operationId) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const model = await this.load(adminSession);
        const room = model.rooms.find(candidate => candidate.id === String(input.roomId || ""));
        // The guarded Stock Service checks a completed operation id before it
        // validates the latest balance. Do not reject an idempotent retry here
        // merely because the first successful write already reduced Main Stock.
        const distribution = this.normalizeInput(input, room);
        return this.stockService.distributeToRoomGuarded({
            operationId,
            roomId: distribution.roomId,
            roomName: distribution.roomName,
            students: distribution.students,
            days: distribution.days,
            perCrate: distribution.perCrate,
            source: "admin",
            user: "admin",
            record: {
                date: distribution.date,
                year: distribution.year,
                note: distribution.note
            }
        });
    }
}

window.AdminDistributionService = new AdminDistributionService();
