class StockManager {
    constructor(service = window.StockService) {
        this.service = service;
        this.snapshot = null;
    }

    ensureService() {
        if (!this.service) {
            this.service = window.StockService;
        }

        if (!this.service) {
            throw new Error("StockService is not available.");
        }

        return this.service;
    }

    async refresh() {
        return this.execute("refresh", async service => {
            this.snapshot = await service.loadSnapshot();
            return this.snapshot;
        });
    }

    async receiveMilk(command) {
        return this.execute("receive", service => service.receiveMilk(command));
    }

    async distributeToRoom(command) {
        return this.execute("distribute", service => service.distributeToRoom(command));
    }

    async consumeRoomStock(command) {
        return this.execute("consume-room-stock", service => service.consumeRoomStock(command));
    }

    async rollbackRoomStock(command) {
        return this.execute("rollback-room-stock", service => service.rollbackRoomStock(command));
    }

    async validate(snapshot = this.snapshot) {
        return this.execute("validate", async service => {
            const source = snapshot || await service.loadSnapshot();
            return service.validateSnapshot(source);
        });
    }

    async rebuild(snapshot = this.snapshot) {
        return this.execute("rebuild", service => service.rebuildAndPersist(snapshot));
    }

    async execute(action, operation) {
        const service = this.ensureService();

        try {
            const result = await operation(service);
            this.dispatch("milkapp:stock-success", { action, result });
            return result;
        } catch (error) {
            this.dispatch("milkapp:stock-error", {
                action,
                code: error.code || "STOCK_ERROR",
                message: error.message,
                error
            });
            throw error;
        }
    }

    dispatch(eventName, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }

        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
}

window.StockManager = new StockManager();
