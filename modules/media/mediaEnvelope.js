class MediaEnvelope {
    constructor(mediaStore = window.MediaStore, policy = window.MediaPolicy) {
        this.mediaStore = mediaStore;
        this.policy = policy;
        this.sensitiveKeys = new Set([
            "dataurl",
            "payload",
            "blob",
            "file",
            "filename",
            "originalname",
            "sourcename",
            "raw",
            "base64"
        ]);
    }

    ensureDependencies() {
        if (!this.mediaStore?.put || !this.mediaStore?.getPayload || !this.mediaStore?.isReference) {
            throw new Error("MediaStore is required for evidence envelopes.");
        }
        if (!this.policy?.validateRecordEvidence) {
            throw new Error("MediaPolicy is required for evidence envelopes.");
        }
    }

    async persistEvidence(evidence = {}, context = {}) {
        this.ensureDependencies();
        const validation = this.policy.validateRecordEvidence(evidence);
        if (!validation.valid) {
            throw this.error(validation.code || "MEDIA_EVIDENCE_INVALID", validation.message || "Evidence is invalid.", validation.details);
        }

        const recordKey = String(context.recordKey || "").trim();
        const photos = [];
        for (const photo of Array.isArray(evidence.photos) ? evidence.photos : []) {
            photos.push(await this.persistItem(photo, {
                kind: "photo",
                recordKey,
                ownerKey: String(photo?.ownerKey || "")
            }));
        }

        const signature = await this.persistSignature(evidence.signature, {
            recordKey,
            ownerKey: String(context.signatureOwnerKey || "teacher")
        });

        const signatures = {};
        for (const [ownerKey, value] of Object.entries(evidence.signatures || {})) {
            const signatureValue = value && typeof value === "object"
                ? value.dataUrl || value.sig || value.signature || ""
                : value;
            const stored = await this.persistSignature(signatureValue, { recordKey, ownerKey });
            if (stored) signatures[ownerKey] = stored;
        }

        return {
            version: 1,
            recordKey,
            photos,
            signature,
            signatures,
            summary: {
                photoCount: photos.length,
                signatureCount: (signature ? 1 : 0) + Object.keys(signatures).length,
                aggregateBytes: validation.details.aggregateBytes || 0
            }
        };
    }

    async persistItem(item = {}, context = {}) {
        const dataUrl = String(item.dataUrl || item.url || "");
        const kind = String(context.kind || item.kind || "photo");
        const id = String(item.id || item.mediaId || this.mediaStore.buildId(kind, `${context.recordKey}:${context.ownerKey}:${dataUrl.slice(0, 64)}`));
        return this.mediaStore.put({
            id,
            kind,
            dataUrl,
            mime: item.mime,
            size: item.size,
            width: item.width,
            height: item.height,
            recordKey: context.recordKey,
            ownerKey: context.ownerKey,
            createdAt: item.createdAt
        });
    }

    async persistSignature(value, context = {}) {
        const source = value && typeof value === "object" ? value : { dataUrl: value };
        const dataUrl = String(source.dataUrl || source.sig || source.signature || "");
        if (!dataUrl) return null;
        return this.persistItem(source, { ...context, kind: "signature" });
    }

    async hydrateReference(reference) {
        this.ensureDependencies();
        if (!this.mediaStore.isReference(reference)) {
            throw this.error("MEDIA_REFERENCE_INVALID", "Media reference is invalid.");
        }
        return this.mediaStore.getPayload(reference.mediaId);
    }

    async hydrateEvidence(manifest = {}, options = {}) {
        const includePhotos = options.photos !== false;
        const includeSignature = options.signature !== false;
        const includeSignatures = options.signatures !== false;
        const result = {
            photos: [],
            signature: null,
            signatures: {}
        };
        if (includePhotos) {
            for (const reference of Array.isArray(manifest.photos) ? manifest.photos : []) {
                const payload = await this.hydrateReference(reference);
                if (payload) result.photos.push(payload);
            }
        }
        if (includeSignature && manifest.signature) {
            result.signature = await this.hydrateReference(manifest.signature);
        }
        if (includeSignatures) {
            for (const [ownerKey, reference] of Object.entries(manifest.signatures || {})) {
                const payload = await this.hydrateReference(reference);
                if (payload) result.signatures[ownerKey] = payload;
            }
        }
        return result;
    }

    buildQueueSafeEvidence(value = {}) {
        const manifest = value?.version === 1 ? value : null;
        if (manifest) {
            const photos = (Array.isArray(manifest.photos) ? manifest.photos : [])
                .filter(reference => this.mediaStore.isReference(reference))
                .map(reference => this.safeReference(reference));
            const signature = this.mediaStore.isReference(manifest.signature)
                ? this.safeReference(manifest.signature)
                : null;
            const signatures = {};
            for (const [ownerKey, reference] of Object.entries(manifest.signatures || {})) {
                if (this.mediaStore.isReference(reference)) {
                    signatures[ownerKey] = this.safeReference(reference);
                }
            }
            return {
                version: 1,
                recordKey: String(manifest.recordKey || ""),
                photos,
                signature,
                signatures,
                summary: {
                    photoCount: photos.length,
                    signatureCount: (signature ? 1 : 0) + Object.keys(signatures).length,
                    aggregateBytes: Number(manifest.summary?.aggregateBytes || 0)
                }
            };
        }

        const photos = Array.isArray(value.photos) ? value.photos : [];
        const signatureEntries = value.signatures && typeof value.signatures === "object"
            ? Object.keys(value.signatures).length
            : 0;
        return {
            version: 0,
            recordKey: "",
            photos: [],
            signature: null,
            signatures: {},
            summary: {
                photoCount: photos.length,
                signatureCount: (value.signature ? 1 : 0) + signatureEntries,
                aggregateBytes: 0,
                requiresPersistence: photos.length > 0 || Boolean(value.signature) || signatureEntries > 0
            }
        };
    }

    redactQueueValue(value, key = "") {
        const normalizedKey = String(key || "").toLowerCase();
        if (this.sensitiveKeys.has(normalizedKey)) return undefined;
        if (typeof value === "string") {
            if (/^data:[^,]+,/i.test(value)) return "[media-redacted]";
            return value;
        }
        if (Array.isArray(value)) {
            return value
                .map(item => this.redactQueueValue(item))
                .filter(item => item !== undefined);
        }
        if (!value || typeof value !== "object") return value;
        const result = {};
        for (const [childKey, childValue] of Object.entries(value)) {
            const redacted = this.redactQueueValue(childValue, childKey);
            if (redacted !== undefined) result[childKey] = redacted;
        }
        return result;
    }

    containsSensitivePayload(value, key = "") {
        const normalizedKey = String(key || "").toLowerCase();
        if (this.sensitiveKeys.has(normalizedKey) && value !== undefined && value !== null && value !== "") {
            return true;
        }
        if (typeof value === "string") return /^data:[^,]+,/i.test(value);
        if (Array.isArray(value)) return value.some(item => this.containsSensitivePayload(item));
        if (!value || typeof value !== "object") return false;
        return Object.entries(value).some(([childKey, childValue]) => this.containsSensitivePayload(childValue, childKey));
    }

    safeReference(reference = {}) {
        return {
            mediaId: String(reference.mediaId || ""),
            kind: String(reference.kind || ""),
            mime: String(reference.mime || ""),
            size: Number(reference.size || 0),
            width: Number(reference.width || 0),
            height: Number(reference.height || 0),
            recordKey: String(reference.recordKey || ""),
            ownerKey: String(reference.ownerKey || ""),
            createdAt: Number(reference.createdAt || 0)
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }
}

window.MediaEnvelopeClass = MediaEnvelope;
window.MediaEnvelope = new MediaEnvelope();
