class BrowserMediaAdapter {
    async decode(file) {
        if (!file) throw new Error("ไม่พบไฟล์รูปภาพที่ต้องการประมวลผล");

        if (typeof createImageBitmap === "function") {
            const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
            return {
                source: bitmap,
                width: bitmap.width,
                height: bitmap.height,
                orientationAdjusted: true,
                release: () => bitmap.close?.()
            };
        }

        const objectUrl = URL.createObjectURL(file);
        try {
            const image = await new Promise((resolve, reject) => {
                const target = new Image();
                target.onload = () => resolve(target);
                target.onerror = () => reject(new Error("ไม่สามารถเปิดไฟล์รูปภาพได้"));
                target.src = objectUrl;
            });
            return {
                source: image,
                width: image.naturalWidth || image.width,
                height: image.naturalHeight || image.height,
                orientationAdjusted: false,
                release: () => undefined
            };
        } finally {
            URL.revokeObjectURL(objectUrl);
        }
    }

    async encode(decoded, options = {}) {
        const width = Number(options.width);
        const height = Number(options.height);
        const mime = String(options.mime || "image/jpeg");
        const quality = Number(options.quality);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { alpha: mime !== "image/jpeg" });
        if (!context) throw new Error("อุปกรณ์นี้ไม่รองรับการประมวลผลรูปภาพ");

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(decoded.source, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(mime, Number.isFinite(quality) ? quality : undefined);
        return { dataUrl, width, height, mime };
    }
}

class MediaProcessor {
    constructor(policy = window.MediaPolicy, adapter = null, options = {}) {
        this.policy = policy;
        this.adapter = adapter || new BrowserMediaAdapter();
        this.options = Object.freeze({
            outputMime: "image/jpeg",
            thumbnailLongestEdge: 320,
            thumbnailQuality: 0.6,
            ...options
        });
    }

    ensurePolicy() {
        const required = ["getLimits", "validateSourceFile", "validatePhotoCount", "validateProcessedPhoto", "dataUrlByteLength"];
        const missing = required.find(method => typeof this.policy?.[method] !== "function");
        if (missing) throw new Error(`MediaPolicy method ${missing} is not available.`);
    }

    calculateTargetDimensions(width, height, longestEdge) {
        const sourceWidth = Number(width);
        const sourceHeight = Number(height);
        const maximum = Number(longestEdge);
        if (!Number.isFinite(sourceWidth) || !Number.isFinite(sourceHeight) || sourceWidth <= 0 || sourceHeight <= 0) {
            throw this.error("MEDIA_DIMENSIONS_INVALID", "ขนาดรูปภาพไม่ถูกต้อง");
        }
        if (!Number.isFinite(maximum) || maximum <= 0) {
            throw this.error("MEDIA_TARGET_DIMENSION_INVALID", "ขนาดรูปปลายทางไม่ถูกต้อง");
        }

        const scale = Math.min(1, maximum / Math.max(sourceWidth, sourceHeight));
        return {
            width: Math.max(1, Math.round(sourceWidth * scale)),
            height: Math.max(1, Math.round(sourceHeight * scale)),
            scale
        };
    }

    stableHash(value) {
        const text = String(value || "");
        let first = 0x811c9dc5;
        let second = 0x9e3779b9;
        for (let index = 0; index < text.length; index += 1) {
            const code = text.charCodeAt(index);
            first ^= code;
            first = Math.imul(first, 0x01000193);
            second ^= code + index;
            second = Math.imul(second, 0x85ebca6b);
        }
        return [first, second]
            .map(valuePart => (valuePart >>> 0).toString(16).padStart(8, "0"))
            .join("");
    }

    buildSafeId(input = {}) {
        const fingerprint = [
            input.name || "image",
            input.type || "",
            Number(input.size) || 0,
            Number(input.lastModified) || 0,
            Number(input.width) || 0,
            Number(input.height) || 0,
            input.dataUrl || ""
        ].join("|");
        return `media-${this.stableHash(fingerprint)}`;
    }

    normalizeEncoded(encoded = {}, fallback = {}) {
        const dataUrl = String(encoded.dataUrl || "");
        return {
            dataUrl,
            width: Number(encoded.width || fallback.width),
            height: Number(encoded.height || fallback.height),
            mime: String(encoded.mime || fallback.mime || this.options.outputMime),
            size: this.policy.dataUrlByteLength(dataUrl)
        };
    }

    assertValid(result) {
        if (result?.valid) return result;
        throw this.error(result?.code || "MEDIA_VALIDATION_FAILED", result?.message || "รูปภาพไม่ผ่านเงื่อนไขการใช้งาน", result?.details);
    }

    async processFile(file, options = {}) {
        this.ensurePolicy();
        this.assertValid(this.policy.validateSourceFile(file));
        const limits = this.policy.getLimits();
        const decoded = await this.adapter.decode(file);

        try {
            const target = this.calculateTargetDimensions(decoded.width, decoded.height, limits.maxLongestEdge);
            const outputMime = String(options.outputMime || this.options.outputMime);
            const quality = Number.isFinite(Number(options.quality)) ? Number(options.quality) : limits.jpegQuality;
            const encoded = this.normalizeEncoded(
                await this.adapter.encode(decoded, {
                    width: target.width,
                    height: target.height,
                    mime: outputMime,
                    quality
                }),
                { ...target, mime: outputMime }
            );
            this.assertValid(this.policy.validateProcessedPhoto(encoded));

            const thumbnailTarget = this.calculateTargetDimensions(
                encoded.width,
                encoded.height,
                Number(options.thumbnailLongestEdge || this.options.thumbnailLongestEdge)
            );
            const thumbnail = this.normalizeEncoded(
                await this.adapter.encode(decoded, {
                    width: thumbnailTarget.width,
                    height: thumbnailTarget.height,
                    mime: outputMime,
                    quality: Number(options.thumbnailQuality || this.options.thumbnailQuality)
                }),
                { ...thumbnailTarget, mime: outputMime }
            );
            this.assertValid(this.policy.validateProcessedPhoto(thumbnail));

            const id = this.buildSafeId({
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                width: encoded.width,
                height: encoded.height,
                dataUrl: encoded.dataUrl
            });

            return {
                id,
                dataUrl: encoded.dataUrl,
                width: encoded.width,
                height: encoded.height,
                mime: encoded.mime,
                size: encoded.size,
                thumbnail,
                source: {
                    name: String(file.name || ""),
                    type: String(file.type || ""),
                    size: Number(file.size) || 0,
                    lastModified: Number(file.lastModified) || 0
                },
                orientationAdjusted: Boolean(decoded.orientationAdjusted),
                processedAt: new Date().toISOString()
            };
        } finally {
            decoded?.release?.();
        }
    }

    async processFiles(files, options = {}) {
        const list = Array.from(files || []);
        this.assertValid(this.policy.validatePhotoCount(list.length));
        const results = [];
        for (const file of list) {
            results.push(await this.processFile(file, options));
        }
        return results;
    }

    buildSafeSummary(photo = {}) {
        return {
            id: String(photo.id || ""),
            mime: String(photo.mime || ""),
            size: Number(photo.size) || 0,
            width: Number(photo.width) || 0,
            height: Number(photo.height) || 0,
            thumbnailSize: Number(photo.thumbnail?.size) || 0,
            orientationAdjusted: Boolean(photo.orientationAdjusted)
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details || {};
        return error;
    }
}

window.BrowserMediaAdapter = BrowserMediaAdapter;
window.MediaProcessorClass = MediaProcessor;
window.MediaProcessor = new MediaProcessor();
