class DocumentImageOptimizer {
    constructor(options = {}) {
        this.PolicyClass = options.PolicyClass || window.MediaPolicyClass;
        this.ProcessorClass = options.ProcessorClass || window.MediaProcessorClass;
        this.limits = Object.freeze({
            maxSourceBytes: 12 * 1024 * 1024,
            maxLongestEdge: 1000,
            jpegQuality: 0.7,
            maxProcessedBytes: 400 * 1024
        });
    }

    ensureDependencies() {
        if (typeof this.PolicyClass !== "function" || typeof this.ProcessorClass !== "function") {
            throw this.error("DOCUMENT_IMAGE_PROCESSOR_UNAVAILABLE", "ระบบย่อรูปเอกสารยังไม่พร้อมใช้งาน");
        }
    }

    normalizeMime(value) {
        return String(value || "").split(";", 1)[0].trim().toLowerCase();
    }

    isSupportedImage(file = {}) {
        return ["image/jpeg", "image/png"].includes(this.normalizeMime(file.type));
    }

    outputFileName(fileName) {
        const source = String(fileName || "document-image").trim() || "document-image";
        const base = source.replace(/\.[^.]+$/, "").trim() || "document-image";
        return `${base}.jpg`;
    }

    async process(file) {
        this.ensureDependencies();
        if (!this.isSupportedImage(file)) {
            throw this.error("DOCUMENT_IMAGE_TYPE_INVALID", "รองรับการย่อเฉพาะไฟล์ JPG, JPEG และ PNG");
        }

        const policy = new this.PolicyClass({
            maxPhotosPerRecord: 1,
            maxSourceBytes: this.limits.maxSourceBytes,
            maxLongestEdge: this.limits.maxLongestEdge,
            jpegQuality: this.limits.jpegQuality,
            maxProcessedBytes: this.limits.maxProcessedBytes,
            maxAggregateBytes: this.limits.maxProcessedBytes
        });
        const processor = new this.ProcessorClass(policy);
        const photo = await processor.processFile(file, {
            outputMime: "image/jpeg",
            quality: this.limits.jpegQuality
        });

        return {
            fileName: this.outputFileName(file.name),
            contentType: "image/jpeg",
            fileSize: Number(photo.size) || 0,
            fileData: String(photo.dataUrl || ""),
            optimized: true,
            optimizationType: "image-lossy",
            optimizationReason: "compressed",
            pageCount: 0,
            imageWidth: Number(photo.width) || 0,
            imageHeight: Number(photo.height) || 0,
            originalFileName: String(file.name || ""),
            originalFileType: this.normalizeMime(file.type),
            originalFileSize: Number(file.size) || 0,
            sourceLastModified: Number(file.lastModified) || 0,
            quality: this.limits.jpegQuality,
            maxLongestEdge: this.limits.maxLongestEdge
        };
    }

    buildSafeSummary(result = {}) {
        return {
            optimized: Boolean(result.optimized),
            originalFileSize: Number(result.originalFileSize) || 0,
            fileSize: Number(result.fileSize) || 0,
            imageWidth: Number(result.imageWidth) || 0,
            imageHeight: Number(result.imageHeight) || 0,
            contentType: String(result.contentType || "")
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }
}

window.DocumentImageOptimizerClass = DocumentImageOptimizer;
window.DocumentImageOptimizer = new DocumentImageOptimizer();
