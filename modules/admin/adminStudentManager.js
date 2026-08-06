class AdminStudentManager {
    constructor(
        service = window.AdminStudentService,
        parser = window.StudentImportParser,
        authService = window.AuthService
    ) {
        this.service = service;
        this.parser = parser;
        this.authService = authService;
        this.pendingImport = null;
        this.report = null;
    }

    ensureDependencies() {
        this.service ||= window.AdminStudentService;
        this.parser ||= window.StudentImportParser;
        this.authService ||= window.AuthService;
        if (!this.service?.loadReport || !this.parser?.parseFile || !this.authService?.getSession) {
            throw new Error("Admin Student dependencies are not available.");
        }
    }

    getAdminSession() {
        this.ensureDependencies();
        const session = this.authService.getSession();
        this.service.assertAdmin(session);
        return session;
    }

    async refresh() {
        this.report = await this.service.loadReport(this.getAdminSession());
        return this.report;
    }

    async previewFile(file) {
        this.pendingImport = null;
        const parsed = await this.parser.parseFile(file);
        if (!parsed.valid) {
            return parsed;
        }

        const preview = await this.service.prepareImport(
            this.getAdminSession(),
            parsed.sheets
        );
        this.pendingImport = {
            ...preview,
            parserWarnings: parsed.warnings,
            fileName: parsed.fileName
        };
        return this.pendingImport;
    }

    async confirmImport() {
        if (!this.pendingImport) {
            return { ok: false, code: "ROOM_IMPORT_PREVIEW_REQUIRED" };
        }
        if (!this.pendingImport.valid) {
            return { ok: false, code: "ROOM_IMPORT_INVALID", ...this.pendingImport };
        }

        const result = await this.service.confirmImport(
            this.getAdminSession(),
            this.pendingImport
        );
        if (result.ok) {
            this.pendingImport = null;
            this.report = this.service.buildReport(result.rooms);
            this.emit("milkapp:rooms-imported", {
                roomCount: result.roomCount,
                importedStudents: result.importedStudents
            });
        }
        return result;
    }

    cancelImport() {
        this.pendingImport = null;
    }

    async createRoom(input) {
        const result = await this.service.createRoom(this.getAdminSession(), input);
        if (result.ok) {
            this.report = this.service.buildReport(result.rooms);
            this.emit("milkapp:room-created", { roomId: result.room.id });
        }
        return result;
    }

    async updateRoom(roomId, changes) {
        const result = await this.service.updateRoom(
            this.getAdminSession(),
            roomId,
            changes
        );
        if (result.ok) {
            this.report = this.service.buildReport(result.rooms);
            this.emit("milkapp:room-updated", { roomId: result.room.id });
        }
        return result;
    }

    async deleteRoom(roomId) {
        const result = await this.service.deleteRoom(this.getAdminSession(), roomId);
        if (result.ok) {
            this.report = this.service.buildReport(result.rooms);
            this.emit("milkapp:room-deleted", { roomId });
        }
        return result;
    }

    exportCsv() {
        if (!this.report) {
            throw new Error("กรุณาโหลดรายงานนักเรียนก่อน");
        }
        return this.service.buildCsv(this.report);
    }

    emit(eventName, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

window.AdminStudentManager = new AdminStudentManager();
