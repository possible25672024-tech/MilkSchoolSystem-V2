class TeacherManager {
    constructor(
        teacherService = window.TeacherService,
        authService = window.AuthService
    ) {
        this.teacherService = teacherService;
        this.authService = authService;
        this.currentView = null;
        this.initialized = false;
        this.bound = false;
    }

    ensureServices() {
        if (!this.teacherService) {
            this.teacherService = window.TeacherService;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }

        if (!this.teacherService?.loadTeacherView) {
            throw new Error("TeacherService is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
    }

    initialize() {
        if (this.initialized) {
            return;
        }

        this.ensureServices();
        this.bindEvents();
        this.initialized = true;
    }

    bindEvents() {
        if (this.bound || typeof window.addEventListener !== "function") {
            return;
        }

        window.addEventListener("milkapp:logout", () => this.clear());
        window.addEventListener("milkapp:login-success", event => {
            const session = event?.detail?.session;
            if (session?.role !== "teacher") {
                this.clear();
            }
        });

        this.bound = true;
    }

    getSession() {
        this.ensureServices();
        const session = this.authService.getSession();
        this.teacherService.requireSession(session);
        return session;
    }

    async refresh(options = {}) {
        const session = this.getSession();
        const includeExtras = options?.includeExtras === true;
        this.currentView = await this.teacherService.loadTeacherView(session, {
            ...options,
            includeExtras
        });

        this.emit("milkapp:teacher-refreshed", {
            roomId: this.currentView.snapshot.room.id,
            extrasLoaded: this.currentView.snapshot.extrasLoaded,
            dashboard: this.currentView.dashboard
        });

        return this.currentView;
    }

    refreshFull() {
        return this.refresh({ includeExtras: true });
    }

    getSnapshot() {
        return this.currentView?.snapshot || null;
    }

    getDashboard() {
        return this.currentView?.dashboard || null;
    }

    prepareRoomStockCommand(type, quantity, options = {}) {
        const command = this.teacherService.prepareRoomStockCommand(
            this.getSession(),
            type,
            quantity,
            options
        );

        this.emit("milkapp:teacher-command-prepared", { command });
        return command;
    }

    prepareRollbackCommand(quantity, options = {}) {
        const command = this.teacherService.prepareRollbackCommand(
            this.getSession(),
            quantity,
            options
        );

        this.emit("milkapp:teacher-command-prepared", { command });
        return command;
    }

    clear() {
        this.currentView = null;
    }

    emit(name, detail) {
        if (typeof window.dispatchEvent !== "function" || typeof CustomEvent !== "function") {
            return;
        }

        window.dispatchEvent(new CustomEvent(name, { detail }));
    }
}

window.TeacherManager = new TeacherManager();
window.TeacherManager.initialize();
