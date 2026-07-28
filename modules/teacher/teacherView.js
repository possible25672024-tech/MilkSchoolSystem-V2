class TeacherView {
    constructor(
        teacherManager = window.TeacherManager,
        authService = window.AuthService,
        syncManager = window.SyncManager,
        loginManager = window.LoginManager,
        options = {}
    ) {
        this.teacherManager = teacherManager;
        this.authService = authService;
        this.syncManager = syncManager;
        this.loginManager = loginManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.network = options.network || window.navigator;
        this.initialized = false;
        this.bound = false;
        this.renderToken = 0;
        this.activeSession = null;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleTeacherRefreshed = this.handleTeacherRefreshed.bind(this);
        this.handleOperationalState = this.handleOperationalState.bind(this);
        this.handleLogoutClick = this.handleLogoutClick.bind(this);
    }

    ensureDependencies() {
        if (!this.teacherManager) {
            this.teacherManager = window.TeacherManager;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }
        if (!this.syncManager) {
            this.syncManager = window.SyncManager;
        }
        if (!this.loginManager) {
            this.loginManager = window.LoginManager;
        }

        if (!this.teacherManager?.refresh || !this.teacherManager?.getSnapshot) {
            throw new Error("TeacherManager is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
        if (!this.syncManager?.getStatus) {
            throw new Error("SyncManager is not available.");
        }
        if (!this.loginManager?.logout) {
            throw new Error("LoginManager is not available.");
        }
    }

    async initialize() {
        if (this.initialized) {
            return this.getState();
        }

        this.ensureDependencies();
        this.bindEvents();
        this.initialized = true;

        const session = this.authService.getSession();
        if (session?.role === "teacher") {
            await this.activate(session);
        } else {
            this.clear();
        }

        return this.getState();
    }

    bindEvents() {
        if (this.bound) {
            return;
        }

        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:teacher-refreshed", this.handleTeacherRefreshed);
        this.eventTarget.addEventListener?.("milkapp:sync-queue-count", this.handleOperationalState);
        this.eventTarget.addEventListener?.("milkapp:sync-started", this.handleOperationalState);
        this.eventTarget.addEventListener?.("milkapp:sync-completed", this.handleOperationalState);
        this.eventTarget.addEventListener?.("milkapp:sync-failed", this.handleOperationalState);
        this.eventTarget.addEventListener?.("online", this.handleOperationalState);
        this.eventTarget.addEventListener?.("offline", this.handleOperationalState);
        this.element("teacher-logout-button")?.addEventListener?.("click", this.handleLogoutClick);

        this.bound = true;
    }

    handleLoginSuccess(event) {
        const session = event?.detail?.session;
        if (session?.role !== "teacher") {
            this.clear();
            return;
        }

        this.activate(session).catch(error => this.renderError(error));
    }

    handleLogout() {
        this.clear();
    }

    handleTeacherRefreshed() {
        if (this.activeSession?.role !== "teacher") {
            return;
        }

        const snapshot = this.teacherManager.getSnapshot();
        const dashboard = this.teacherManager.getDashboard?.();
        if (snapshot) {
            this.renderView({ snapshot, dashboard: dashboard || {} });
        }
    }

    handleOperationalState() {
        if (this.activeSession?.role === "teacher") {
            this.renderOperationalState();
        }
    }

    handleLogoutClick() {
        this.loginManager.logout();
    }

    async activate(session) {
        if (session?.role !== "teacher") {
            this.clear();
            return null;
        }

        const token = ++this.renderToken;
        this.activeSession = { ...session };
        this.showShell();
        this.renderSession(session);
        this.renderOperationalState();
        this.setLoading(true);
        this.clearError();

        try {
            const view = await this.teacherManager.refresh();
            if (token !== this.renderToken) {
                return null;
            }

            this.renderView(view);
            return view;
        } catch (error) {
            if (token === this.renderToken) {
                this.renderError(error);
            }
            return null;
        } finally {
            if (token === this.renderToken) {
                this.setLoading(false);
            }
        }
    }

    showShell() {
        this.element("login-panel")?.setAttribute?.("hidden", "");
        this.element("app-panel")?.removeAttribute?.("hidden");
        this.element("admin-shell")?.setAttribute?.("hidden", "");
        this.element("teacher-shell")?.removeAttribute?.("hidden");
    }

    renderSession(session = {}) {
        this.setText("teacher-school-name", session.schoolName || "โรงเรียน");
        this.setText("teacher-room-name", session.roomName || session.className || session.roomId || "—");
        this.setText("teacher-name", session.teacher || "ครูประจำชั้น");
    }

    renderView(view = {}) {
        const snapshot = view.snapshot || {};
        const dashboard = view.dashboard || {};
        const session = snapshot.session || this.activeSession || {};
        const room = snapshot.room || {};
        const roomStock = snapshot.roomStock ?? dashboard.actualRoomStock;

        this.setText("teacher-school-name", session.schoolName || "โรงเรียน");
        this.setText("teacher-room-name", session.roomName || room.name || session.roomId || "—");
        this.setText("teacher-name", session.teacher || room.teacher || "ครูประจำชั้น");
        this.setText("teacher-room-stock", `${this.formatNumber(roomStock)} กล่อง`);
        this.setText("teacher-shell-status", "ข้อมูลหน้าครูพร้อมใช้งาน");
        this.renderOperationalState();
        this.clearError();
    }

    renderOperationalState() {
        let status = { queueCount: 0 };
        try {
            status = this.syncManager.getStatus() || status;
        } catch (error) {
            status = { queueCount: 0 };
        }

        const online = this.network?.onLine !== false;
        const connection = this.element("teacher-connection-state");
        if (connection) {
            connection.textContent = online ? "ออนไลน์" : "ออฟไลน์";
            connection.dataset.state = online ? "online" : "offline";
        }

        const queueCount = Number.isFinite(Number(status.queueCount))
            ? Math.max(0, Number(status.queueCount))
            : 0;
        this.setText("teacher-queue-count", `${this.formatNumber(queueCount)} รายการ`);
    }

    setLoading(isLoading) {
        const shell = this.element("teacher-shell");
        if (shell) {
            shell.setAttribute?.("aria-busy", String(Boolean(isLoading)));
        }

        if (isLoading) {
            this.setText("teacher-room-stock", "กำลังโหลด...");
            this.setText("teacher-shell-status", "กำลังโหลดข้อมูลห้องเรียน...");
        }
    }

    renderError(error) {
        const element = this.element("teacher-shell-error");
        if (!element) {
            return;
        }

        element.textContent = `โหลดข้อมูลหน้าครูไม่สำเร็จ: ${error?.message || "ไม่ทราบสาเหตุ"}`;
        element.hidden = false;
        this.setText("teacher-shell-status", "ไม่สามารถอัปเดตข้อมูลหน้าครูได้");
    }

    clearError() {
        const element = this.element("teacher-shell-error");
        if (!element) {
            return;
        }

        element.textContent = "";
        element.hidden = true;
    }

    clear() {
        this.renderToken += 1;
        this.activeSession = null;
        this.element("teacher-shell")?.setAttribute?.("hidden", "");
        this.setText("teacher-school-name", "");
        this.setText("teacher-room-name", "");
        this.setText("teacher-name", "");
        this.setText("teacher-room-stock", "—");
        this.setText("teacher-queue-count", "0 รายการ");
        this.setText("teacher-shell-status", "");
        this.clearError();
    }

    getState() {
        return {
            active: this.activeSession?.role === "teacher",
            session: this.activeSession ? { ...this.activeSession } : null,
            online: this.network?.onLine !== false,
            queueCount: Number(this.syncManager?.getStatus?.()?.queueCount) || 0
        };
    }

    formatNumber(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) {
            return "—";
        }

        return new Intl.NumberFormat("th-TH", {
            maximumFractionDigits: 2
        }).format(number);
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    element(id) {
        return this.document?.getElementById?.(id) || null;
    }
}

window.TeacherView = new TeacherView();
