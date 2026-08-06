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

    requireMethod(owner, method) {
        if (!owner?.[method]) throw new Error(`Admin Receipt dependency ${method} is not available.`);
    }

    businessError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    assertAdmin(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            throw this.businessError("ADMIN_SESSION_REQUIRED", "ต้องเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแลระบบ");
        }
    }

    normalizePhotos(input = []) {
        return (Array.isArray(input) ? input : [])
            .map(photo => typeof photo === "string" ? photo : photo?.dataUrl)
            .filter(photo => typeof photo === "string" && /^data:image\//i.test(photo))
            .slice(0, 5);
    }

    normalizeSignatures(input = {}) {
        return Object.fromEntries(
            Object.entries(input || {})
                .filter(([key, signature]) => (
                    ["receiver", "sender"].includes(key)
                    && signature && typeof signature === "object"
                    && /^data:image\//i.test(String(signature.dataUrl || signature.signature || ""))
                ))
                .map(([key, signature]) => [key, {
                    receiverName: String(signature.receiverName || signature.name || "").trim().slice(0, 120),
                    signature: String(signature.dataUrl || signature.signature)
                }])
        );
    }

    normalizeInput(input = {}) {
        this.ensureDependencies();
        const date = String(input.date || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw this.businessError("RECEIPT_DATE_REQUIRED", "กรุณาระบุวันที่รับนม");
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
            year: String(input.year || "").trim().slice(0, 10),
            note: String(input.note || "").trim().slice(0, 300),
            supplier: String(input.supplier || "อบต.").trim() || "อบต.",
            photos: this.normalizePhotos(input.photos),
            signatures: this.normalizeSignatures(input.signatures)
        };
    }

    preview(adminSession, input = {}) {
        this.assertAdmin(adminSession);
        return this.normalizeInput(input);
    }

    entries(collection = {}) {
        return Array.isArray(collection)
            ? collection.map((record, index) => [String(record?.id || index), record])
            : Object.entries(collection || {});
    }

    normalizeReceipt(id, record = {}, includeEvidence = false) {
        const normalized = {
            id: String(record.id || id),
            date: String(record.date || String(record.createdAt || "").slice(0, 10)),
            createdAt: String(record.createdAt || ""),
            updatedAt: String(record.updatedAt || ""),
            crates: Math.max(0, Number(record.crates) || 0),
            extra: Math.max(0, Number(record.extra) || 0),
            perCrate: Math.max(1, Number(record.perCrate) || 36),
            total: Math.max(0, Number(record.total) || 0),
            year: String(record.year || record.academicYear || ""),
            note: String(record.note || ""),
            supplier: String(record.supplier || "อบต.")
        };
        if (includeEvidence) {
            normalized.photos = this.normalizePhotos(record.photos);
            normalized.signatures = this.normalizeSignatures(record.signatures);
        }
        return normalized;
    }

    normalizeReceipts(collection = {}) {
        return this.entries(collection)
            .filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => this.normalizeReceipt(id, record, false))
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
        const normalized = this.normalizeReceipts(receipts);
        return {
            mainStock: Number(mainStock) || 0,
            totalBoxes: normalized.reduce((sum, receipt) => sum + receipt.total, 0),
            receipts: normalized
        };
    }

    async loadDetail(adminSession, receiptId) {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        this.requireMethod(this.stockRepository, "loadReceiptWithEtag");
        const versioned = await this.stockRepository.loadReceiptWithEtag(receiptId);
        if (!versioned?.value || typeof versioned.value !== "object") {
            throw this.businessError("RECEIPT_NOT_FOUND", "ไม่พบรายการรับนมนี้");
        }
        return {
            receipt: this.normalizeReceipt(receiptId, versioned.value, true),
            etag: String(versioned.etag || "")
        };
    }

    async receive(adminSession, input = {}, operationId = "") {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        const receipt = this.normalizeInput(input);
        const command = {
            crates: receipt.crates,
            extra: receipt.extra,
            perCrate: receipt.perCrate,
            source: "admin",
            user: "admin",
            record: receipt,
            operationId
        };
        return this.stockService.receiveMilkGuarded
            ? this.stockService.receiveMilkGuarded(command)
            : this.stockService.receiveMilk(command);
    }

    async update(adminSession, receiptId, input = {}, etag = "", operationId = "") {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        this.requireMethod(this.stockService, "adjustReceiptGuarded");
        const receipt = this.normalizeInput(input);
        return this.stockService.adjustReceiptGuarded({
            action: "edit",
            operationId,
            referenceId: receiptId,
            expectedEtag: etag,
            source: "admin",
            user: "admin",
            record: receipt
        });
    }

    async delete(adminSession, receiptId, etag = "", operationId = "") {
        this.assertAdmin(adminSession);
        this.ensureDependencies();
        this.requireMethod(this.stockService, "adjustReceiptGuarded");
        return this.stockService.adjustReceiptGuarded({
            action: "delete",
            operationId,
            referenceId: receiptId,
            expectedEtag: etag,
            source: "admin",
            user: "admin"
        });
    }
}

window.AdminReceiptService = new AdminReceiptService();
