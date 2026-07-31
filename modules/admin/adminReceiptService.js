class AdminReceiptService {
    constructor(
        stockService = window.StockService,
        stockRepository = window.StockRepository
    ) {
        this.stockService = stockService;
        this.stockRepository = stockRepository;
    }

    ensureDependencies() {
        this.stockService ||= window.StockService;
        this.stockRepository ||= window.StockRepository;
        const required = [
            [this.stockService, "calculateReceiveTotal"],
            [this.stockService, "receiveMilk"],
            [this.stockRepository, "loadMainStock"],
            [this.stockRepository, "loadReceiptSummaries"]
        ];
        const missing = required.find(([owner, method]) => !owner?.[method]);
        if (missing) throw new Error(`Admin Receipt dependency ${missing[1]} is not available.`);
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            const error = new Error("ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
            error.code = "ADMIN_SESSION_REQUIRED";
            throw error;
        }
    }

    normalizeInput(input = {}) {
        const date = String(input.date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            const error = new Error("กรุณาระบุวันที่รับนม");
            error.code = "RECEIPT_DATE_REQUIRED";
            throw error;
        }
        const crates = Number(input.crates);
        const extra = Number(input.extra || 0);
        const perCrate = Number(input.perCrate || 36);
        const total = this.stockService.calculateReceiveTotal({ crates, extra, perCrate });
        return {
            date,
            crates,
            extra,
            perCrate,
            total,
            note: String(input.note || "").trim().slice(0, 300),
            supplier: String(input.supplier || "อบต.").trim() || "อบต."
        };
    }

    preview(adminSession, input = {}) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        return this.normalizeInput(input);
    }

    normalizeReceipts(collection = {}) {
        const entries = Array.isArray(collection)
            ? collection.map((record, index) => [String(record?.id || index), record])
            : Object.entries(collection || {});
        return entries
            .filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => ({
                id: String(record.id || id),
                date: String(record.date || String(record.createdAt || "").slice(0, 10)),
                createdAt: String(record.createdAt || ""),
                crates: Math.max(0, Number(record.crates) || 0),
                extra: Math.max(0, Number(record.extra) || 0),
                perCrate: Math.max(1, Number(record.perCrate) || 36),
                total: Math.max(0, Number(record.total) || 0),
                note: String(record.note || ""),
                supplier: String(record.supplier || "อบต.")
            }))
            .sort((left, right) => (
                String(right.createdAt || right.date).localeCompare(String(left.createdAt || left.date))
            ));
    }

    async load(adminSession) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const [mainStock, receipts] = await Promise.all([
            this.stockRepository.loadMainStock(),
            this.stockRepository.loadReceiptSummaries()
        ]);
        return {
            mainStock: Number(mainStock) || 0,
            receipts: this.normalizeReceipts(receipts)
        };
    }

    async receive(adminSession, input = {}) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const receipt = this.normalizeInput(input);
        return this.stockService.receiveMilk({
            crates: receipt.crates,
            extra: receipt.extra,
            perCrate: receipt.perCrate,
            source: "admin",
            user: "admin",
            record: receipt
        });
    }
}

window.AdminReceiptService = new AdminReceiptService();
