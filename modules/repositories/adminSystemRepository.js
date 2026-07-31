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

    loadRootWithEtag() {
        return this.ensureService().getWithEtag(this.appRoot);
    }

    restoreRootIfMatch(data, etag) {
        return this.ensureService().setIfMatch(this.appRoot, data, etag);
    }
}

window.AdminSystemRepository = new AdminSystemRepository();
