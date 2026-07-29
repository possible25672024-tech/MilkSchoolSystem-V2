class PendingEvidenceManager {
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
        this.weekStart = "";
        this.weekEnd = "";
        this.recordKey = "";
        this.photoReferences = [];
        this.legacyPhotos = [];
        this.photoPreviewCache = new Map();
        this.owners = new Map();
        this.signatures = new Map();
        this.legacySignatures = new Map();
        this.activeOwnerKey = "";
        this.signaturePad = null;
        this.draftMediaIds = new Set();
        this.dirty = false;
    }

    ensureDependencies() {
        if (!this.processor?.processFiles) throw new Error("MediaProcessor is not available.");
        if (!this.mediaStore?.put || !this.mediaStore?.getPayload || !this.mediaStore?.remove) throw new Error("MediaStore is not available.");
        if (!this.policy?.validatePhotoCount || !this.policy?.validateRecordEvidence) throw new Error("MediaPolicy is not available.");
        if (typeof this.signaturePadClass !== "function") throw new Error("SignaturePadClass is not available.");
    }

    contextKey(roomId, weekStart, weekEnd) {
        const room = String(roomId || "").trim();
        const start = String(weekStart || "").trim();
        const end = String(weekEnd || "").trim();
        if (!room || !/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
            throw this.error("PENDING_EVIDENCE_CONTEXT_INVALID", "ห้องเรียนหรือสัปดาห์ของหลักฐานนมค้างไม่ถูกต้อง");
        }
        return `pending_${room}_${start}_${end}`;
    }

    ownerKey(owner = {}) {
        return String(owner.key || `${owner.studentId || ""}_${owner.date || ""}`).trim();
    }

    normalizeOwners(rawOwners = []) {
        return Array.from(rawOwners || []).map(owner => ({
            key: this.ownerKey(owner),
            studentId: String(owner.studentId || ""),
            date: String(owner.date || ""),
            name: String(owner.name || owner.studentName || owner.studentId || "ผู้รับนม"),
            receiverName: String(owner.receiverName || "")
        })).filter(owner => owner.key && owner.studentId && /^\d{4}-\d{2}-\d{2}$/.test(owner.date));
    }

    async setRecordContext({ roomId, weekStart, weekEnd, record = null, owners = [] } = {}) {
        this.ensureDependencies();
        const nextKey = this.contextKey(roomId, weekStart, weekEnd);
        if (this.recordKey && this.recordKey !== nextKey) await this.discardDrafts();
        this.roomId = String(roomId);
        this.weekStart = String(weekStart);
        this.weekEnd = String(weekEnd);
        this.recordKey = nextKey;
        this.photoReferences = [];
        this.legacyPhotos = [];
        this.photoPreviewCache.clear();
        this.signatures.clear();
        this.legacySignatures.clear();
        this.owners.clear();
        this.activeOwnerKey = "";
        this.dirty = false;

        for (const photo of Array.isArray(record?.photos) ? record.photos : []) {
            if (this.mediaStore.isReference?.(photo)) this.photoReferences.push({ ...photo });
            else if (typeof photo === "string" && photo.startsWith("data:")) this.legacyPhotos.push(photo);
        }
        for (const [key, value] of Object.entries(record?.signatures || {})) {
            const signature = value?.sig ?? value?.signature ?? "";
            const receiverName = String(value?.receiverName || "");
            if (this.mediaStore.isReference?.(signature)) this.signatures.set(key, { reference: { ...signature }, receiverName });
            else if (typeof signature === "string" && signature.startsWith("data:")) this.legacySignatures.set(key, { dataUrl: signature, receiverName });
        }
        await this.setOwners(owners);
        this.signaturePad?.clear?.();
        return this.getState();
    }

    async setOwners(rawOwners = []) {
        const nextOwners = new Map(this.normalizeOwners(rawOwners).map(owner => [owner.key, owner]));
        for (const [key, entry] of this.signatures.entries()) {
            if (!nextOwners.has(key) && entry.reference?.mediaId && this.draftMediaIds.has(entry.reference.mediaId)) {
                await this.mediaStore.remove(entry.reference.mediaId);
                this.draftMediaIds.delete(entry.reference.mediaId);
                this.signatures.delete(key);
            }
        }
        this.owners = nextOwners;
        if (!this.owners.has(this.activeOwnerKey)) this.activeOwnerKey = this.owners.keys().next().value || "";
        this.signaturePad?.clear?.();
        return this.getState();
    }

    selectOwner(ownerKey) {
        const key = String(ownerKey || "").trim();
        if (key && !this.owners.has(key)) throw this.error("PENDING_EVIDENCE_OWNER_INVALID", "ผู้รับนมที่เลือกไม่อยู่ในรายการที่มีสิทธิ์");
        this.activeOwnerKey = key;
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
        const count = this.photoReferences.length + this.legacyPhotos.length + list.length;
        const result = this.policy.validatePhotoCount(count);
        if (!result.valid) throw this.error(result.code, result.message, result.details);
        const processed = await this.processor.processFiles(list);
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
                ownerKey: "pending",
                createdAt: Date.now()
            });
            this.photoReferences.push(reference);
            this.photoPreviewCache.set(reference.mediaId, photo.thumbnail?.dataUrl || photo.dataUrl);
            this.draftMediaIds.add(reference.mediaId);
        }
        this.dirty = true;
        return this.getState();
    }

    async removePhoto(index) {
        const normalized = Number(index);
        if (!Number.isInteger(normalized) || normalized < 0) return this.getState();
        if (normalized < this.legacyPhotos.length) this.legacyPhotos.splice(normalized, 1);
        else {
            const [reference] = this.photoReferences.splice(normalized - this.legacyPhotos.length, 1);
            if (reference?.mediaId && this.draftMediaIds.has(reference.mediaId)) {
                await this.mediaStore.remove(reference.mediaId);
                this.draftMediaIds.delete(reference.mediaId);
                this.photoPreviewCache.delete(reference.mediaId);
            }
        }
        this.dirty = true;
        return this.getState();
    }

    async commitActiveSignature(receiverName = "") {
        const owner = this.owners.get(this.activeOwnerKey);
        if (!owner) throw this.error("PENDING_EVIDENCE_OWNER_REQUIRED", "กรุณาเลือกนักเรียนและวันที่รับนมก่อนลงลายเซ็น");
        if (!this.signaturePad) throw this.error("SIGNATURE_PAD_NOT_READY", "ยังไม่พร้อมรับลายเซ็นผู้รับนม");
        const exported = this.signaturePad.exportSignature({ required: true });
        const previous = this.signatures.get(owner.key)?.reference;
        if (previous?.mediaId && this.draftMediaIds.has(previous.mediaId)) {
            await this.mediaStore.remove(previous.mediaId);
            this.draftMediaIds.delete(previous.mediaId);
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
            ownerKey: owner.key,
            createdAt: Date.now()
        });
        this.signatures.set(owner.key, { reference, receiverName: String(receiverName || owner.receiverName || "").trim() });
        this.legacySignatures.delete(owner.key);
        this.draftMediaIds.add(reference.mediaId);
        this.signaturePad.clear?.();
        this.dirty = true;
        return this.getState();
    }

    async clearActiveSignature() {
        const key = this.activeOwnerKey;
        const reference = this.signatures.get(key)?.reference;
        if (reference?.mediaId && this.draftMediaIds.has(reference.mediaId)) {
            await this.mediaStore.remove(reference.mediaId);
            this.draftMediaIds.delete(reference.mediaId);
        }
        this.signatures.delete(key);
        this.legacySignatures.delete(key);
        this.signaturePad?.clear?.();
        this.dirty = true;
        return this.getState();
    }

    async hydrateReference(reference) {
        if (!this.mediaStore.isReference?.(reference)) return null;
        return this.mediaStore.getPayload(reference.mediaId);
    }

    async buildLegacyEvidence(selectedPairs = []) {
        const selectedKeys = new Set(this.normalizeOwners(selectedPairs).map(owner => owner.key));
        const photos = [...this.legacyPhotos];
        for (const reference of this.photoReferences) {
            const payload = await this.hydrateReference(reference);
            if (!payload?.dataUrl) throw this.error("MEDIA_PAYLOAD_MISSING", "ไม่พบรูปถ่ายนมค้างที่จัดเก็บไว้", { mediaId: reference.mediaId });
            photos.push(payload.dataUrl);
        }
        const signatures = {};
        for (const key of selectedKeys) {
            const stored = this.signatures.get(key);
            const legacy = this.legacySignatures.get(key);
            let sig = legacy?.dataUrl || "";
            let receiverName = legacy?.receiverName || "";
            if (stored?.reference) {
                const payload = await this.hydrateReference(stored.reference);
                if (!payload?.dataUrl) throw this.error("SIGNATURE_PAYLOAD_MISSING", "ไม่พบลายเซ็นผู้รับนมค้าง", { mediaId: stored.reference.mediaId });
                sig = payload.dataUrl;
                receiverName = stored.receiverName || "";
            }
            signatures[key] = { sig, receiverName };
        }
        const validation = this.policy.validateRecordEvidence({ photos, signature: "", signatures });
        if (!validation.valid) throw this.error(validation.code, validation.message, validation.details);
        return { photos, signature: "", signatures };
    }

    buildSafeSummary() {
        return {
            version: 1,
            recordKey: this.recordKey,
            photoCount: this.photoReferences.length + this.legacyPhotos.length,
            selectedOwnerCount: this.owners.size,
            signatureCount: [...this.owners.keys()].filter(key => this.signatures.has(key) || this.legacySignatures.has(key)).length,
            activeOwnerKey: this.activeOwnerKey,
            owners: [...this.owners.values()].map(owner => ({ key: owner.key, studentId: owner.studentId, date: owner.date, name: owner.name })),
            signatures: [...this.signatures.entries()].map(([ownerKey, entry]) => ({ ownerKey, receiverName: entry.receiverName, reference: { ...entry.reference } }))
        };
    }

    async getPhotoPreviews({ hydrate = false } = {}) {
        const previews = this.legacyPhotos.map((dataUrl, index) => ({ id: `legacy-${index}`, dataUrl, legacy: true }));
        for (const reference of this.photoReferences) {
            let dataUrl = this.photoPreviewCache.get(reference.mediaId) || "";
            if (!dataUrl && hydrate) dataUrl = (await this.hydrateReference(reference))?.dataUrl || "";
            previews.push({ id: reference.mediaId, dataUrl, reference: { ...reference }, legacy: false });
        }
        return previews;
    }

    markSaved() {
        this.draftMediaIds.clear();
        this.dirty = false;
        return this.getState();
    }

    async discardDrafts() {
        for (const mediaId of this.draftMediaIds) await this.mediaStore.remove(mediaId);
        this.draftMediaIds.clear();
        this.photoPreviewCache.clear();
    }

    async clear() {
        await this.discardDrafts();
        this.signaturePad?.destroy?.();
        this.signaturePad = null;
        this.roomId = "";
        this.weekStart = "";
        this.weekEnd = "";
        this.recordKey = "";
        this.photoReferences = [];
        this.legacyPhotos = [];
        this.owners.clear();
        this.signatures.clear();
        this.legacySignatures.clear();
        this.activeOwnerKey = "";
        this.dirty = false;
    }

    getState() {
        return { ...this.buildSafeSummary(), dirty: this.dirty };
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }
}

window.PendingEvidenceManagerClass = PendingEvidenceManager;
window.PendingEvidenceManager = new PendingEvidenceManager();
