class AdminDashboardService {
    constructor(stockRepository = window.StockRepository, options = {}) {
        this.stockRepository = stockRepository;
        this.clock = options.clock || (() => new Date());
    }

    ensureRepository() {
        if (!this.stockRepository) this.stockRepository = window.StockRepository;
        const required = ["loadMainStock", "loadRoomStocks"];
        const missing = required.find(method => !this.stockRepository?.[method]);
        if (missing) {
            throw new Error(`Admin Dashboard requires StockRepository.${missing}.`);
        }
        return this.stockRepository;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            const error = new Error("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
            error.code = "ADMIN_SESSION_REQUIRED";
            throw error;
        }
        return session;
    }

    toNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : 0;
    }

    roomStockValue(roomStocks, roomId) {
        const value = roomStocks?.[roomId];
        if (value && typeof value === "object") {
            return this.toNumber(value.stock ?? value.value ?? value.balance);
        }
        return this.toNumber(value);
    }

    buildRoomRows(report = {}, roomStocks = {}) {
        return (Array.isArray(report.roomSummary) ? report.roomSummary : [])
            .map(summary => {
                const actual = this.roomStockValue(roomStocks, summary.roomId);
                const distributed = this.toNumber(summary.distTotal);
                const attendance = this.toNumber(summary.usedChk);
                const pending = this.toNumber(summary.usedPending);
                const retroactive = this.toNumber(summary.usedRetro);
                const vacation = this.toNumber(summary.usedVacation);
                const consumed = attendance + pending + retroactive + vacation;
                const historyBalance = distributed - consumed;
                const openingBalance = actual - historyBalance;
                const state = actual < 0
                    ? "negative"
                    : openingBalance !== 0
                        ? "baseline"
                        : actual === 0 ? "empty" : "ready";
                return {
                    roomId: String(summary.roomId || ""),
                    roomName: String(summary.roomName || summary.roomId || "—"),
                    students: this.toNumber(summary.students),
                    actual,
                    distributed,
                    attendance,
                    pending,
                    retroactive,
                    vacation,
                    consumed,
                    historyBalance,
                    openingBalance,
                    reconciledBalance: openingBalance + distributed - consumed,
                    state
                };
            })
            .sort((left, right) => {
                const priority = { negative: 0, baseline: 1, empty: 2, ready: 3 };
                return (priority[left.state] - priority[right.state])
                    || left.roomName.localeCompare(right.roomName, "th");
            });
    }

    buildModel(report = {}, mainStock = 0, roomStocks = {}) {
        if (!report?.schoolTotal || !Array.isArray(report?.roomSummary)) {
            throw new Error("ต้องโหลดรายงานโรงเรียนก่อนสร้างภาพรวมระบบ");
        }
        const rooms = this.buildRoomRows(report, roomStocks);
        const actualMainStock = this.toNumber(mainStock);
        const actualRoomStock = rooms.reduce((sum, room) => sum + room.actual, 0);
        const counts = rooms.reduce((result, room) => {
            result[room.state] += 1;
            return result;
        }, { ready: 0, empty: 0, baseline: 0, negative: 0 });

        return {
            schoolName: String(report.schoolName || "โรงเรียน"),
            academicYear: String(report.academicYear || ""),
            generatedAt: this.clock().toISOString(),
            totals: {
                rooms: this.toNumber(report.schoolTotal.roomCount),
                students: this.toNumber(report.schoolTotal.students),
                mainStock: actualMainStock,
                roomStock: actualRoomStock,
                systemStock: actualMainStock + actualRoomStock,
                distributed: this.toNumber(report.schoolTotal.distTotal),
                used: this.toNumber(report.schoolTotal.distTotal)
                    - this.toNumber(report.schoolTotal.remaining)
            },
            counts,
            healthy: counts.negative === 0 && counts.baseline === 0,
            rooms
        };
    }

    async load(adminSession, report) {
        this.assertAdmin(adminSession);
        const repository = this.ensureRepository();
        const [mainStock, roomStocks] = await Promise.all([
            repository.loadMainStock(),
            repository.loadRoomStocks()
        ]);
        return this.buildModel(report, mainStock, roomStocks || {});
    }
}

window.AdminDashboardService = new AdminDashboardService();
