class MediaPolicy {
    constructor(overrides = {}) {
        const defaults = {
            maxPhotosPerRecord: 5,
            maxLongestEdge: 1000,
            jpegQuality: 0.7,
            maxSourceBytes: 8 * 1024 * 1024,
            maxProcessedBytes: 400 * 1024,
            maxSignatureBytes: 120 * 1024,
            maxAggregateBytes: 2304 * 1024,
            allowedSourceMimes: ["image/jpeg", "image/png", "image/webp"],
            allowedProcessedMimes: ["image/jpeg", "image/png", "image/webp"],
            allowedSignatureMimes: ["image/png"]
        };

        this.limits = Object.freeze({
            ...defaults,
            ...overrides,
            allowedSourceMimes: Object.freeze([...(overrides.allowedSourceMimes || defaults.allowedSourceMimes)]),
            allowedProcessedMimes: Object.freeze([...(overrides.allowedProcessedMimes || defaults.allowedProcessedMimes)]),
            allowedSignatureMimes: Object.freeze([...(overrides.allowedSignatureMimes || defaults.allowedSignatureMimes)])
        });
    }

    getLimits() {
        return {
            ...this.limits,
            allowedSourceMimes: [...this.limits.allowedSourceMimes],
            allowedProcessedMimes: [...this.limits.allowedProcessedMimes],
            allowedSignatureMimes: [...this.limits.allowedSignatureMimes]
        };
    }

    normalizeMime(value) {
        return String(value || "")
            .split(";", 1)[0]
            .trim()
            .toLowerCase();
    }

    mimeFromDataUrl(dataUrl) {
        const match = /^data:([^;,]+)(?:;[^,]*)?,/i.exec(String(dataUrl || ""));
        return this.normalizeMime(match?.[1] || "");
    }

    dataUrlByteLength(dataUrl) {
        const value = String(dataUrl || "");
        const comma = value.indexOf(",");
        if (!value.startsWith("data:") || comma < 0) {
            return 0;
        }

        const metadata = value.slice(0, comma).toLowerCase();
        const payload = value.slice(comma + 1);
        if (!payload) {
            return 0;
        }

        if (metadata.includes(";base64")) {
            const normalized = payload.replace(/\s+/g, "");
            const padding = normalized.endsWith("==") ? 2 : normalized.endsWith("=") ? 1 : 0;
            return Math.max(0, Math.floor(normalized.length * 3 / 4) - padding);
        }

        try {
            return new TextEncoder().encode(decodeURIComponent(payload)).length;
        } catch (error) {
            return new TextEncoder().encode(payload).length;
        }
    }

    result(valid, code = null, message = "", details = {}) {
        return { valid, code, message, details };
    }

    validatePhotoCount(count) {
        const normalized = Number(count);
        if (!Number.isInteger(normalized) || normalized < 0) {
            return this.result(false, "MEDIA_PHOTO_COUNT_INVALID", "Photo count must be a non-negative integer.");
        }
        if (normalized > this.limits.maxPhotosPerRecord) {
            return this.result(false, "MEDIA_PHOTO_COUNT_EXCEEDED", `A record may contain at most ${this.limits.maxPhotosPerRecord} photos.`, {
                count: normalized,
                maximum: this.limits.maxPhotosPerRecord
            });
        }
        return this.result(true, null, "", { count: normalized });
    }

    validateSourceFile(file = {}) {
        const mime = this.normalizeMime(file.type);
        const size = Number(file.size);

        if (!this.limits.allowedSourceMimes.includes(mime)) {
            return this.result(false, "MEDIA_SOURCE_MIME_UNSUPPORTED", "The selected image type is not supported.", { mime });
        }
        if (!Number.isFinite(size) || size <= 0) {
            return this.result(false, "MEDIA_SOURCE_SIZE_INVALID", "The selected image is empty or has an invalid size.", { size });
        }
        if (size > this.limits.maxSourceBytes) {
            return this.result(false, "MEDIA_SOURCE_SIZE_EXCEEDED", "The selected image is larger than the source-size limit.", {
                size,
                maximum: this.limits.maxSourceBytes
            });
        }

        return this.result(true, null, "", { mime, size });
    }

    validateProcessedPhoto(photo = {}) {
        const inlineLegacyDataUrl = typeof photo === "string";
        const source = inlineLegacyDataUrl ? { dataUrl: photo } : (photo || {});
        const dataUrl = String(source.dataUrl || source.url || "");
        const mime = this.normalizeMime(source.mime || this.mimeFromDataUrl(dataUrl));
        const size = Number.isFinite(Number(source.size)) ? Number(source.size) : this.dataUrlByteLength(dataUrl);
        const width = Number(source.width);
        const height = Number(source.height);
        const dimensionsProvided = source.width !== undefined || source.height !== undefined;

        if (!dataUrl.startsWith("data:")) {
            return this.result(false, "MEDIA_DATA_URL_REQUIRED", "Processed photo data is missing.");
        }
        if (!this.limits.allowedProcessedMimes.includes(mime)) {
            return this.result(false, "MEDIA_PROCESSED_MIME_UNSUPPORTED", "The processed image type is not supported.", { mime });
        }
        if (!Number.isFinite(size) || size <= 0 || size > this.limits.maxProcessedBytes) {
            return this.result(false, "MEDIA_PROCESSED_SIZE_EXCEEDED", "The processed image exceeds the byte limit.", {
                size,
                maximum: this.limits.maxProcessedBytes
            });
        }

        if (dimensionsProvided) {
            if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
                return this.result(false, "MEDIA_DIMENSIONS_INVALID", "Processed image dimensions are invalid.", { width, height });
            }
            if (Math.max(width, height) > this.limits.maxLongestEdge) {
                return this.result(false, "MEDIA_DIMENSIONS_EXCEEDED", "The processed image exceeds the dimension limit.", {
                    width,
                    height,
                    maximum: this.limits.maxLongestEdge
                });
            }
        } else if (!inlineLegacyDataUrl) {
            return this.result(false, "MEDIA_DIMENSIONS_INVALID", "Processed image dimensions are invalid.", { width, height });
        }

        return this.result(true, null, "", {
            mime,
            size,
            width: dimensionsProvided ? width : null,
            height: dimensionsProvided ? height : null,
            legacyInline: inlineLegacyDataUrl
        });
    }

    validateSignature(signature = {}) {
        const dataUrl = typeof signature === "string"
            ? signature
            : String(signature.dataUrl || signature.sig || "");

        if (!dataUrl) {
            return this.result(true, null, "", { empty: true, size: 0, mime: "" });
        }

        const mime = this.normalizeMime(
            typeof signature === "object" ? signature.mime || this.mimeFromDataUrl(dataUrl) : this.mimeFromDataUrl(dataUrl)
        );
        const explicitSize = typeof signature === "object" ? Number(signature.size) : NaN;
        const size = Number.isFinite(explicitSize) ? explicitSize : this.dataUrlByteLength(dataUrl);

        if (!this.limits.allowedSignatureMimes.includes(mime)) {
            return this.result(false, "SIGNATURE_MIME_UNSUPPORTED", "The signature image type is not supported.", { mime });
        }
        if (!Number.isFinite(size) || size <= 0 || size > this.limits.maxSignatureBytes) {
            return this.result(false, "SIGNATURE_SIZE_EXCEEDED", "The signature exceeds the byte limit.", {
                size,
                maximum: this.limits.maxSignatureBytes
            });
        }

        return this.result(true, null, "", { empty: false, mime, size });
    }

    normalizeSignatureEntries(signatures) {
        if (!signatures || typeof signatures !== "object" || Array.isArray(signatures)) {
            return [];
        }
        return Object.entries(signatures).map(([ownerKey, value]) => ({
            ownerKey,
            signature: value && typeof value === "object" ? value.sig || value.signature || "" : value || ""
        }));
    }

    validateRecordEvidence(evidence = {}) {
        const photos = Array.isArray(evidence.photos) ? evidence.photos : [];
        const countResult = this.validatePhotoCount(photos.length);
        if (!countResult.valid) {
            return countResult;
        }

        let aggregateBytes = 0;
        for (let index = 0; index < photos.length; index += 1) {
            const result = this.validateProcessedPhoto(photos[index]);
            if (!result.valid) {
                return this.result(false, result.code, result.message, { ...result.details, photoIndex: index });
            }
            aggregateBytes += result.details.size;
        }

        let signatureCount = 0;
        const recordSignature = this.validateSignature(evidence.signature || "");
        if (!recordSignature.valid) {
            return recordSignature;
        }
        if (!recordSignature.details.empty) {
            signatureCount += 1;
            aggregateBytes += recordSignature.details.size;
        }

        for (const entry of this.normalizeSignatureEntries(evidence.signatures)) {
            const result = this.validateSignature(entry.signature);
            if (!result.valid) {
                return this.result(false, result.code, result.message, {
                    ...result.details,
                    ownerKey: entry.ownerKey
                });
            }
            if (!result.details.empty) {
                signatureCount += 1;
                aggregateBytes += result.details.size;
            }
        }

        if (aggregateBytes > this.limits.maxAggregateBytes) {
            return this.result(false, "MEDIA_AGGREGATE_SIZE_EXCEEDED", "The combined evidence exceeds the record limit.", {
                aggregateBytes,
                maximum: this.limits.maxAggregateBytes
            });
        }

        return this.result(true, null, "", {
            photoCount: photos.length,
            signatureCount,
            aggregateBytes
        });
    }

    buildSafeSummary(evidence = {}) {
        const validation = this.validateRecordEvidence(evidence);
        return {
            valid: validation.valid,
            code: validation.code,
            photoCount: validation.details.photoCount ?? (Array.isArray(evidence.photos) ? evidence.photos.length : 0),
            signatureCount: validation.details.signatureCount ?? 0,
            aggregateBytes: validation.details.aggregateBytes ?? 0
        };
    }
}

window.MediaPolicyClass = MediaPolicy;
window.MediaPolicy = new MediaPolicy();
