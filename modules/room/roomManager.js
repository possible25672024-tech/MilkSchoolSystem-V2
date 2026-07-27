class RoomManager {
    constructor(service = window.RoomService) {
        this.service = service;
        this.rooms = [];
        this.pendingImport = null;
        this.busy = false;
    }

    ensureService() {
        if (!this.service) {
            this.service = window.RoomService;
        }

        if (!this.service?.loadRooms) {
            throw new Error("RoomService is not available.");
        }

        return this.service;
    }

    async refresh() {
        if (this.busy) {
            return this.rooms;
        }

        this.busy = true;
        this.emit("milkapp:rooms-loading", {});

        try {
            this.rooms = await this.ensureService().loadRooms();
            this.emit("milkapp:rooms-ready", { rooms: this.rooms });
            return this.rooms;
        } catch (error) {
            this.emit("milkapp:rooms-error", { error });
            throw error;
        } finally {
            this.busy = false;
        }
    }

    async create(input) {
        const result = await this.ensureService().createRoom(input);
        if (result.ok) {
            this.rooms = result.rooms;
            this.emit("milkapp:room-created", { room: result.room, rooms: this.rooms });
        } else {
            this.emit("milkapp:room-validation-error", { operation: "create", result });
        }
        return result;
    }

    async update(roomId, changes) {
        const result = await this.ensureService().updateRoom(roomId, changes);
        if (result.ok) {
            this.rooms = result.rooms;
            this.emit("milkapp:room-updated", { room: result.room, rooms: this.rooms });
        } else {
            this.emit("milkapp:room-validation-error", { operation: "update", result });
        }
        return result;
    }

    previewImport(sheets) {
        this.pendingImport = {
            sheets: Array.isArray(sheets) ? sheets : [],
            preview: this.ensureService().prepareImport(sheets, this.rooms)
        };

        this.emit("milkapp:room-import-preview", this.pendingImport.preview);
        return this.pendingImport.preview;
    }

    async confirmImport() {
        if (!this.pendingImport) {
            return { ok: false, code: "ROOM_IMPORT_PREVIEW_REQUIRED" };
        }

        if (!this.pendingImport.preview.valid) {
            return { ok: false, code: "ROOM_IMPORT_INVALID", ...this.pendingImport.preview };
        }

        const result = await this.ensureService().importRooms(this.pendingImport.sheets);
        if (result.ok) {
            this.rooms = result.rooms;
            this.pendingImport = null;
            this.emit("milkapp:rooms-imported", result);
        }

        return result;
    }

    cancelImport() {
        this.pendingImport = null;
        this.emit("milkapp:room-import-cancelled", {});
    }

    async remove(roomId) {
        const result = await this.ensureService().deleteRoom(roomId);

        if (result.ok) {
            this.rooms = result.rooms;
            this.emit("milkapp:room-deleted", result);
        } else if (result.code === "ROOM_HAS_DEPENDENCIES") {
            this.emit("milkapp:room-delete-blocked", result);
        } else {
            this.emit("milkapp:room-delete-error", result);
        }

        return result;
    }

    getRooms() {
        return [...this.rooms];
    }

    getRoom(roomId) {
        return this.rooms.find(room => room.id === String(roomId)) || null;
    }

    getImportPreview() {
        return this.pendingImport?.preview || null;
    }

    emit(eventName, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }

        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

window.RoomManager = new RoomManager();
