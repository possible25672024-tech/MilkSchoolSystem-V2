class AttendanceEvidenceManager {
    constructor(
        processor = window.MediaProcessor,
        mediaStore = window.MediaStore,
        policy = window.MediaPolicy,
        signaturePadClass = window.SignaturePadClass
    ) {
        this.processor = processor;
        this.mediaStore = mediaStore;
        this.policy = policy;
        this.signaturePadClass = signaturePadClass;
        this.roomId = "";
        this.date = "";
        this.recordKey = "";
        this.photoReferences = [];
        this.signatureReference = null;
        this.legacyPhotos = [];
        this.legacySignature = "";
        this.photoPreviewCache = new Map();
        this.signaturePad = null;
        this.draftMediaIds = new Set();
        this.dirty = false;
    }

    ensureDependencies() {
        if (!this.processor?.processFiles) throw new Error("MediaProcessor is not available.");
        if (!this.mediaStore?.put || !this.mediaStore?.getPayload || !this.mediaStore?.remove) {
            throw new Error("MediaStore is not available.");
        }
        if (!this.policy?.validatePhotoCount || !this.policy?.validateRecordEvidence) {
            throw new Error("MediaPolicy is not available.");
        }
        if (typeof this.signaturePadClass !== "function") throw new Error("SignaturePadClass is not available.");
    }

    contextKey(roomId, date) {
        const normalizedRoomId = String(roomId || "").trim();
        const normalizedDate = String(date || "").trim();
        if (!normalizedRoomId || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
            throw this.error("ATTENDANCE_EVIDENCE_CONTEXT_INVALID", "ห้องเรียนหรือวันที่ของหลักฐานไม่ถูกต้อง");
        }
        return `${normalizedRoomId}_${normalizedDate}`;
    }

    async setRecordContext({ roomId, date, record = null } = {}) {
        this.ensureDependencies();
        const nextKey = this.contextKey(roomId, date);
        if (this.recordKey && this.recordKey !== nextKey) await this.discardDrafts();
        this.roomId = String(roomId);
        this.date = String(date);
        this.recordKey = nextKey;
        this.photoReferences = [];
        this.signatureReference = null;
        this.legacyPhotos = [];
        this.legacySignature = "";
        this.photoPreviewCache.clear();
        this.dirty = false;

        const photos = Array.isArray(record?.photos) ? record.photos : [];
        for (const photo of photos) {
            if (this.mediaStore.isReference?.(photo)) this.photoReferences.push({ ...photo });
            else if (typeof photo === "string" && photo.startsWith("data:")) this.legacyPhotos.push(photo);
        }
        const signature = record?.signature;
        if (this.mediaStore.isReference?.(signature)) this.signatureReference = { ...signature };
        else if (typeof signature === "string" && signature.startsWith("data:")) this.legacySignature = signature;
        this.signaturePad?.clear?.();
        return this.getState();
    }

    attachSignaturePad(canvas, options = {}) {
        this.ensureDependencies();
        this.signaturePad?.destroy?.();
        this.signaturePad = new this.signaturePadClass(canvas, this.policy, options);
        this.signaturePad.initialize();
        return this.signaturePad;
    }

    async addPhotos(files) {
        this.ensureDependencies();
        const list = Array.from(files || []);
        const existingCount = this.photoReferences.length + this.legacyPhotos.length;
        const countResult = this.policy.validatePhotoCount(existingCount + list.length);
        if (!countResult.valid) throw this.error(countResult.code, countResult.message, countResult.details);
        const processed = await this.processor.processFiles(list);
        const added = [];
        for (const photo of processed) {
            const reference = await this.mediaStore.put({
                id: photo.id,
                kind: "photo",
                dataUrl: photo.dataUrl,
                mime: photo.mime,
                size: photo.size,
                width: photo.width,
                height: photo.height,
                recordKey: this.recordKey,
                ownerKey: "attendance",
                createdAt: Date.now()
            });
            this.photoReferences.push(reference);
            this.photoPreviewCache.set(reference.mediaId, photo.thumbnail?.dataUrl || photo.dataUrl);
            this.draftMediaIds.add(reference.mediaId);
            added.push(reference);
        }
        this.dirty = true;
        return { added, state: this.getState() };
    }

    async removePhoto(index) {
        const normalized = Number(index);
        if (!Number.isInteger(normalized) || normalized < 0) return this.getState();
        if (normalized < this.legacyPhotos.length) {
            this.legacyPhotos.splice(normalized, 1);
            this.dirty = true;
            return this.getState();
        }
        const referenceIndex = normalized - this.legacyPhotos.length;
        const [reference] = this.photoReferences.splice(referenceIndex, 1);
        if (reference?.mediaId && this.draftMediaIds.has(reference.mediaId)) {
            await this.mediaStore.remove(reference.mediaId);
            this.draftMediaIds.delete(reference.mediaId);
            this.photoPreviewCache.delete(reference.mediaId);
        }
        this.dirty = true;
        return this.getState();
    }

    async commitSignature() {
        if (!this.signaturePad) throw this.error("SIGNATURE_PAD_NOT_READY", "ยังไม่พร้อมรับลายเซ็นครู");
        const exported = this.signaturePad.exportSignature({ required: true });
        if (this.signatureReference?.mediaId && this.draftMediaIds.has(this.signatureReference.mediaId)) {
            await this.mediaStore.remove(this.signatureReference.mediaId);
            this.draftMediaIds.delete(this.signatureReference.mediaId);
        }
        const reference = await this.mediaStore.put({
            id: exported.id,
            kind: "signature",
            dataUrl: exported.dataUrl,
            mime: exported.mime,
            size: exported.size,
            width: exported.width,
            height: exported.height,
            recordKey: this.recordKey,
            ownerKey: "teacher",
            createdAt: Date.now()
        });
        this.signatureReference = reference;
        this.legacySignature = "";
        this.draftMediaIds.add(reference.mediaId);
        this.dirty = true;
        return { reference, summary: this.signaturePad.buildSafeSummary(exported) };
    }

    async clearSignature() {
        if (this.signatureReference?.mediaId && this.draftMediaIds.has(this.signatureReference.mediaId)) {
            await this.mediaStore.remove(this.signatureReference.mediaId);
            this.draftMediaIds.delete(this.signatureReference.mediaId);
        }
        this.signatureReference = null;
        this.legacySignature = "";
        this.signaturePad?.clear?.();
        this.dirty = true;
        return this.getState();
    }

    async hydrateReference(reference) {
        if (!this.mediaStore.isReference?.(reference)) return null;
        return this.mediaStore.getPayload(reference.mediaId);
    }

    async buildLegacyEvidence() {
        const photos = [...this.legacyPhotos];
        for (const reference of this.photoReferences) {
            const payload = await this.hydrateReference(reference);
            if (!payload?.dataUrl) throw this.error("MEDIA_PAYLOAD_MISSING", "ไม่พบข้อมูลรูปภาพที่จัดเก็บไว้", { mediaId: reference.mediaId });
            photos.push(payload.dataUrl);
        }
        let signature = this.legacySignature;
        if (this.signatureReference) {
            const payload = await this.hydrateReference(this.signatureReference);
            if (!payload?.dataUrl) throw this.error("SIGNATURE_PAYLOAD_MISSING", "ไม่พบข้อมูลลายเซ็นที่จัดเก็บไว้", { mediaId: this.signatureReference.mediaId });
            signature = payload.dataUrl;
        }
        const validation = this.policy.validateRecordEvidence({ photos, signature, signatures: {} });
        if (!validation.valid) throw this.error(validation.code, validation.message, validation.details);
        return { photos, signature };
    }

    buildQueueSafeEvidence() {
        return {
            version: 1,
            recordKey: this.recordKey,
            photos: this.photoReferences.map(reference => ({ ...reference })),
            signature: this.signatureReference ? { ...this.signatureReference } : null,
            legacyPhotoCount: this.legacyPhotos.length,
            legacySignaturePresent: Boolean(this.legacySignature),
            summary: {
                photoCount: this.photoReferences.length + this.legacyPhotos.length,
                signatureCount: this.signatureReference || this.legacySignature ? 1 : 0
            }
        };
    }

    async buildQueueSafeRecord(record = {}) {
        const next = { ...record };
        next.photos = this.photoReferences.map(reference => ({ ...reference }));
        next.signature = this.signatureReference ? { ...this.signatureReference } : "";
        next.evidence = this.buildQueueSafeEvidence();
        if (this.legacyPhotos.length || this.legacySignature) {
            const legacy = await this.persistLegacyEvidence();
            next.photos = legacy.photos;
            next.signature = legacy.signature;
            next.evidence = this.buildQueueSafeEvidence();
        }
        return next;
    }

    async persistLegacyEvidence() {
        for (const dataUrl of [...this.legacyPhotos]) {
            const id = this.mediaStore.buildId("attendance-photo", `${this.recordKey}:${dataUrl.slice(0, 80)}`);
            const reference = await this.mediaStore.put({
                id,
                kind: "photo",
                dataUrl,
                recordKey: this.recordKey,
                ownerKey: "attendance"
            });
            this.photoReferences.push(reference);
            this.draftMediaIds.add(reference.mediaId);
        }
        this.legacyPhotos = [];
        if (this.legacySignature) {
            const id = this.mediaStore.buildId("attendance-signature", `${this.recordKey}:${this.legacySignature.slice(0, 80)}`);
            this.signatureReference = await this.mediaStore.put({
                id,
                kind: "signature",
                dataUrl: this.legacySignature,
                recordKey: this.recordKey,
                ownerKey: "teacher"
            });
            this.draftMediaIds.add(this.signatureReference.mediaId);
            this.legacySignature = "";
        }
        return {
            photos: this.photoReferences.map(reference => ({ ...reference })),
            signature: this.signatureReference ? { ...this.signatureReference } : ""
        };
    }

    async hydrateQueueRecord(record = {}) {
        const photos = [];
        for (const value of Array.isArray(record.photos) ? record.photos : []) {
            if (this.mediaStore.isReference?.(value)) {
                const payload = await this.hydrateReference(value);
                if (!payload?.dataUrl) throw this.error("MEDIA_PAYLOAD_MISSING", "ไม่พบรูปภาพสำหรับซิงก์", { mediaId: value.mediaId });
                photos.push(payload.dataUrl);
            } else if (typeof value === "string") photos.push(value);
        }
        let signature = record.signature || "";
        if (this.mediaStore.isReference?.(signature)) {
            const payload = await this.hydrateReference(signature);
            if (!payload?.dataUrl) throw this.error("SIGNATURE_PAYLOAD_MISSING", "ไม่พบลายเซ็นสำหรับซิงก์", { mediaId: signature.mediaId });
            signature = payload.dataUrl;
        }
        const next = { ...record, photos, signature };
        delete next.evidence;
        return next;
    }

    async getPhotoPreviews({ hydrate = false } = {}) {
        const previews = this.legacyPhotos.map((dataUrl, index) => ({ id: `legacy-${index}`, dataUrl, legacy: true }));
        for (const reference of this.photoReferences) {
            let dataUrl = this.photoPreviewCache.get(reference.mediaId) || "";
            if (!dataUrl && hydrate) {
                const payload = await this.hydrateReference(reference);
                dataUrl = payload?.dataUrl || "";
            }
            previews.push({ id: reference.mediaId, dataUrl, reference: { ...reference }, legacy: false });
        }
        return previews;
    }

    async cleanupDeletedRecord() {
        const references = [...this.photoReferences, ...(this.signatureReference ? [this.signatureReference] : [])];
        for (const reference of references) {
            if (reference?.mediaId) await this.mediaStore.remove(reference.mediaId);
        }
        this.resetState();
    }

    async discardDrafts() {
        for (const mediaId of this.draftMediaIds) await this.mediaStore.remove(mediaId);
        this.draftMediaIds.clear();
        this.photoPreviewCache.clear();
    }

    acceptSavedRecord(record = {}) {
        this.draftMediaIds.clear();
        this.dirty = false;
        return this.setRecordContext({ roomId: record.clsId || record.roomId || this.roomId, date: record.date || this.date, record });
    }

    resetState() {
        this.roomId = "";
        this.date = "";
        this.recordKey = "";
        this.photoReferences = [];
        this.signatureReference = null;
        this.legacyPhotos = [];
        this.legacySignature = "";
        this.photoPreviewCache.clear();
        this.draftMediaIds.clear();
        this.signaturePad?.clear?.();
        this.dirty = false;
    }

    async clear() {
        await this.discardDrafts();
        this.signaturePad?.destroy?.();
        this.signaturePad = null;
        this.resetState();
    }

    getState() {
        return {
            roomId: this.roomId,
            date: this.date,
            recordKey: this.recordKey,
            photoCount: this.photoReferences.length + this.legacyPhotos.length,
            signaturePresent: Boolean(this.signatureReference || this.legacySignature),
            dirty: this.dirty,
            queueSafe: this.buildQueueSafeEvidence()
        };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }
}

window.AttendanceEvidenceManagerClass = AttendanceEvidenceManager;
window.AttendanceEvidenceManager = new AttendanceEvidenceManager();
