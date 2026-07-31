class AdminSystemRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child = "") {
        const cleanChild = String(child || "").replace(/^\/+|\/+$/g, "");
        return cleanChild ? `${this.appRoot}/${cleanChild}` : this.appRoot;
    }

    loadSettingsWithEtag() {
        return this.ensureService().getWithEtag(this.path("settings"));
    }

    saveSettingsIfMatch(settings, etag) {
        return this.ensureService().setIfMatch(this.path("settings"), settings, etag);
    }

    async loadDocumentMetadata() {
        const records = await this.get(this.path("documents"));
        return records || {};
    }

    loadDocumentContent(id) {
        return this.get(this.path(`documentFiles/${encodeURIComponent(String(id || ""))}`));
    }

    saveDocument(id, metadata, fileData) {
        const documentId = String(id || "").trim();
        if (!documentId) throw new Error("Document ID is required.");
        const updates = {
            [`documents/${documentId}`]: metadata
        };
        if (fileData !== undefined) updates[`documentFiles/${documentId}`] = fileData;
        return this.update(this.appRoot, updates);
    }

    deleteDocument(id) {
        const documentId = String(id || "").trim();
        if (!documentId) throw new Error("Document ID is required.");
        return this.update(this.appRoot, {
            [`documents/${documentId}`]: null,
            [`documentFiles/${documentId}`]: null
        });
    }

    isPayloadTooLarge(error) {
        return /\(413\)|payload is too large/i.test(String(error?.message || error || ""));
    }

    collectionFromEntries(entries = []) {
        const keys = entries.map(([key]) => String(key));
        const numeric = keys.length > 0 && keys.every(key => /^(0|[1-9]\d*)$/.test(key));
        if (numeric) {
            const highest = Math.max(...keys.map(Number));
            if (highest < keys.length * 2) {
                const result = Array(highest + 1).fill(null);
                entries.forEach(([key, value]) => { result[Number(key)] = value; });
                return result;
            }
        }
        return Object.fromEntries(entries);
    }

    async loadChunked(path) {
        try {
            return await this.get(path);
        } catch (error) {
            if (!this.isPayloadTooLarge(error)) throw error;
        }

        const shallow = await this.get(path, { shallow: true });
        if (!shallow || typeof shallow !== "object" || Array.isArray(shallow)) {
            const error = new Error(`Firebase item is too large to back up safely: ${path}`);
            error.code = "BACKUP_ITEM_TOO_LARGE";
            throw error;
        }

        const entries = [];
        for (const key of Object.keys(shallow)) {
            const child = `${path}/${encodeURIComponent(key)}`;
            entries.push([key, await this.loadChunked(child)]);
        }
        return this.collectionFromEntries(entries);
    }

    async loadRootMarker() {
        return this.ensureService().getWithEtag(this.appRoot, { shallow: true });
    }

    async loadRootWithEtag(options = {}) {
        const attempts = Math.max(1, Number(options.attempts) || 2);
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const before = await this.loadRootMarker();
            const rootKeys = before?.value && typeof before.value === "object"
                ? Object.keys(before.value)
                : [];
            const entries = [];
            for (const key of rootKeys) {
                entries.push([key, await this.loadChunked(this.path(key))]);
            }
            const after = await this.loadRootMarker();
            if (String(before?.etag || "") === String(after?.etag || "")) {
                return {
                    value: Object.fromEntries(entries),
                    etag: String(after?.etag || ""),
                    status: after?.status
                };
            }
        }
        const error = new Error("Firebase data changed while the backup was being read. Please try again.");
        error.code = "BACKUP_SNAPSHOT_CHANGED";
        throw error;
    }

    async loadRootSummaryWithEtag(options = {}) {
        const attempts = Math.max(1, Number(options.attempts) || 2);
        const collections = [
            "rooms", "roomStock", "receives", "distributes", "mcAttendance",
            "absentMilk", "retroMilk", "vacationMilk", "documents"
        ];
        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const before = await this.loadRootMarker();
            const value = {
                settings: await this.get(this.path("settings")) || {},
                stock: await this.get(this.path("stock")) || 0
            };
            for (const key of collections) {
                value[key] = await this.get(this.path(key), { shallow: true }) || {};
            }
            const after = await this.loadRootMarker();
            if (String(before?.etag || "") === String(after?.etag || "")) {
                return { value, etag: String(after?.etag || ""), status: after?.status };
            }
        }
        const error = new Error("Firebase data changed while the restore preview was being prepared. Please try again.");
        error.code = "RESTORE_PREVIEW_CHANGED";
        throw error;
    }

    restoreRootIfMatch(data, etag) {
        return this.ensureService().setIfMatch(this.appRoot, data, etag);
    }
}

window.AdminSystemRepository = new AdminSystemRepository();
