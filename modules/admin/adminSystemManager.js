class AdminSystemManager {
    constructor(service = window.AdminSystemService, authService = window.AuthService) {
        this.service = service;
        this.authService = authService;
        this.settingsEtag = "";
        this.restorePreview = null;
        this.safetyBackupReady = false;
    }

    ensureDependencies() {
        this.service ||= window.AdminSystemService;
        this.authService ||= window.AuthService;
        if (!this.service?.createBackup || !this.authService?.getSession) {
            throw new Error("Admin System dependencies are not available.");
        }
    }

    session() {
        this.ensureDependencies();
        return this.authService.getSession();
    }

    async loadSettings() {
        const model = await this.service.loadSettings(this.session());
        this.settingsEtag = model.etag;
        return model;
    }

    async saveSettings(input) {
        const result = await this.service.saveSettings(this.session(), input, this.settingsEtag);
        this.settingsEtag = result.etag;
        return result;
    }

    loadDocuments() {
        return this.service.loadDocuments(this.session());
    }

    loadDocumentContent(id) {
        return this.service.loadDocumentContent(this.session(), id);
    }

    saveDocument(input) {
        return this.service.saveDocument(this.session(), input);
    }

    deleteDocument(id) {
        return this.service.deleteDocument(this.session(), id);
    }

    async createBackup(purpose = "download", profile = "full") {
        const backup = await this.service.createBackup(this.session(), purpose, profile);
        if (purpose === "pre-restore") this.safetyBackupReady = true;
        return backup;
    }

    async inspectBackup(envelope) {
        this.restorePreview = await this.service.validateBackup(this.session(), envelope);
        this.safetyBackupReady = false;
        return this.restorePreview;
    }

    restore(confirmation) {
        return this.service.restoreBackup(this.session(), this.restorePreview, {
            confirmation,
            safetyBackupReady: this.safetyBackupReady
        });
    }

    clear() {
        this.settingsEtag = "";
        this.restorePreview = null;
        this.safetyBackupReady = false;
    }
}

window.AdminSystemManager = new AdminSystemManager();
