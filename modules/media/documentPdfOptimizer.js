class DocumentPdfOptimizer {
    constructor(options = {}) {
        this.PDFDocumentClass = options.PDFDocumentClass || window.PDFLib?.PDFDocument;
        this.TextDecoderClass = options.TextDecoderClass || window.TextDecoder;
        this.BlobClass = options.BlobClass || window.Blob;
        this.FileReaderClass = options.FileReaderClass || window.FileReader;
        this.toDataUrlOverride = options.toDataUrl || null;
        this.limits = Object.freeze({
            maxSourceBytes: 12 * 1024 * 1024,
            minimumSavingsBytes: Math.max(0, Number(options.minimumSavingsBytes) || 4096),
            minimumSavingsRatio: Math.max(0, Number(options.minimumSavingsRatio) || 0.01)
        });
    }

    normalizeMime(value) {
        return String(value || "").split(";", 1)[0].trim().toLowerCase();
    }

    isSupportedPdf(file = {}) {
        const mime = this.normalizeMime(file.type);
        const name = String(file.name || "").toLowerCase();
        return mime === "application/pdf" || (!mime && name.endsWith(".pdf"));
    }

    ensureAvailable(file = {}) {
        if (!this.isSupportedPdf(file)) {
            throw this.error("DOCUMENT_PDF_TYPE_INVALID", "รองรับการบีบอัดเฉพาะไฟล์ PDF");
        }
        const sourceBytes = Number(file.size) || 0;
        if (!Number.isInteger(sourceBytes) || sourceBytes < 1 || sourceBytes > this.limits.maxSourceBytes) {
            throw this.error("DOCUMENT_PDF_SIZE_INVALID", "ไฟล์ PDF ต้องมีขนาดไม่เกิน 12 MB");
        }
        if (typeof file.arrayBuffer !== "function") {
            throw this.error("DOCUMENT_PDF_READ_UNAVAILABLE", "เบราว์เซอร์ไม่สามารถอ่านไฟล์ PDF นี้ได้");
        }
        if (typeof this.PDFDocumentClass?.load !== "function") {
            throw this.error("DOCUMENT_PDF_PROCESSOR_UNAVAILABLE", "ระบบบีบอัด PDF ยังไม่พร้อม กรุณาโหลดหน้าใหม่แล้วลองอีกครั้ง");
        }
    }

    ascii(bytes) {
        if (typeof this.TextDecoderClass === "function") {
            return new this.TextDecoderClass("latin1").decode(bytes);
        }
        let text = "";
        const chunkSize = 32 * 1024;
        for (let offset = 0; offset < bytes.length; offset += chunkSize) {
            text += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
        }
        return text;
    }

    protectionReason(bytes) {
        const source = this.ascii(bytes);
        if (/\/ByteRange\s*\[|\/Type\s*\/Sig\b|\/SubFilter\s*\/(?:adbe|ETSI)\b/i.test(source)) {
            return "digital-signature";
        }
        if (/\/Encrypt\b/.test(source)) return "encrypted";
        return "";
    }

    hasPdfHeader(bytes) {
        return bytes.length >= 5 && this.ascii(bytes.subarray(0, 5)) === "%PDF-";
    }

    fallback(file, reason, pageCount = 0) {
        return {
            fileName: String(file.name || "document.pdf"),
            contentType: "application/pdf",
            fileSize: Number(file.size) || 0,
            fileData: null,
            optimized: false,
            optimizationType: "pdf-original",
            optimizationReason: String(reason || "not-smaller"),
            pageCount: Math.max(0, Number(pageCount) || 0),
            imageWidth: 0,
            imageHeight: 0,
            originalFileName: String(file.name || ""),
            originalFileType: this.normalizeMime(file.type) || "application/pdf",
            originalFileSize: Number(file.size) || 0,
            sourceLastModified: Number(file.lastModified) || 0
        };
    }

    savingsAreUseful(sourceBytes, savedBytes) {
        const bytesSaved = sourceBytes - savedBytes;
        const required = Math.max(
            this.limits.minimumSavingsBytes,
            Math.ceil(sourceBytes * this.limits.minimumSavingsRatio)
        );
        return savedBytes > 0 && bytesSaved >= required;
    }

    async bytesToDataUrl(bytes) {
        if (this.toDataUrlOverride) return this.toDataUrlOverride(bytes, "application/pdf");
        if (typeof this.BlobClass !== "function" || typeof this.FileReaderClass !== "function") {
            throw this.error("DOCUMENT_PDF_DATA_URL_UNAVAILABLE", "ไม่สามารถเตรียม PDF สำหรับอัปโหลดได้");
        }
        const blob = new this.BlobClass([bytes], { type: "application/pdf" });
        return new Promise((resolve, reject) => {
            const reader = new this.FileReaderClass();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(this.error("DOCUMENT_PDF_DATA_URL_FAILED", "แปลง PDF สำหรับอัปโหลดไม่สำเร็จ"));
            reader.readAsDataURL(blob);
        });
    }

    async process(file) {
        this.ensureAvailable(file);
        const source = new Uint8Array(await file.arrayBuffer());
        if (!this.hasPdfHeader(source)) {
            throw this.error("DOCUMENT_PDF_INVALID", "ไฟล์ที่เลือกไม่ใช่ PDF ที่ถูกต้อง");
        }

        const protectedReason = this.protectionReason(source);
        if (protectedReason) return this.fallback(file, protectedReason);

        let documentModel;
        try {
            documentModel = await this.PDFDocumentClass.load(source, {
                ignoreEncryption: false,
                updateMetadata: false,
                throwOnInvalidObject: true
            });
        } catch (error) {
            const message = String(error?.message || "");
            if (/encrypt|password/i.test(message)) return this.fallback(file, "encrypted");
            throw this.error("DOCUMENT_PDF_INVALID", "เปิดตรวจ PDF ไม่สำเร็จ ไฟล์อาจเสียหาย", { cause: message });
        }

        const pageCount = Math.max(0, Number(documentModel.getPageCount?.()) || 0);
        if (pageCount < 1) {
            throw this.error("DOCUMENT_PDF_EMPTY", "PDF ต้องมีอย่างน้อย 1 หน้า");
        }

        let optimized;
        try {
            const optimizedBytes = await documentModel.save({
                useObjectStreams: true,
                addDefaultPage: false,
                updateFieldAppearances: false,
                objectsPerTick: 50
            });
            optimized = optimizedBytes instanceof Uint8Array
                ? optimizedBytes
                : new Uint8Array(optimizedBytes);
            if (!this.hasPdfHeader(optimized)) return this.fallback(file, "compression-failed", pageCount);
            const verified = await this.PDFDocumentClass.load(optimized, {
                ignoreEncryption: false,
                updateMetadata: false,
                throwOnInvalidObject: true
            });
            if (Number(verified.getPageCount?.()) !== pageCount) {
                return this.fallback(file, "compression-failed", pageCount);
            }
        } catch (_error) {
            return this.fallback(file, "compression-failed", pageCount);
        }
        if (!this.savingsAreUseful(source.byteLength, optimized.byteLength)) {
            return this.fallback(file, "not-smaller", pageCount);
        }

        return {
            fileName: String(file.name || "document.pdf"),
            contentType: "application/pdf",
            fileSize: optimized.byteLength,
            fileData: await this.bytesToDataUrl(optimized),
            optimized: true,
            optimizationType: "pdf-lossless",
            optimizationReason: "compressed",
            pageCount,
            imageWidth: 0,
            imageHeight: 0,
            originalFileName: String(file.name || ""),
            originalFileType: this.normalizeMime(file.type) || "application/pdf",
            originalFileSize: source.byteLength,
            sourceLastModified: Number(file.lastModified) || 0
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }
}

window.DocumentPdfOptimizerClass = DocumentPdfOptimizer;
window.DocumentPdfOptimizer = new DocumentPdfOptimizer();
