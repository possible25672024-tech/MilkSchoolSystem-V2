class AuthService {
    constructor(
        loginService = window.LoginService,
        firebaseAuthService = window.FirebaseAuthService
    ) {
        this.loginService = loginService;
        this.firebaseAuthService = firebaseAuthService;
        this.sessionKey = "milkApp_loginSession";
        this.parentAdminSessionKey = "milkApp_parentAdminSession";
        this.offlinePreviewId = "__offline_read_only_preview__";
    }

    ensureLoginService() {
        if (!this.loginService) {
            this.loginService = window.LoginService;
        }

        if (!this.loginService) {
            throw new Error("LoginService is not available.");
        }

        return this.loginService;
    }

    getAppConfig() {
        return (
            window.ConfigManager?.getAppConfig?.() ||
            window.APP_CONFIG ||
            {}
        );
    }

    isOfflineReadOnly() {
        const config = this.getAppConfig();
        return String(config?.mode || "").trim().toUpperCase() ===
            "OFFLINE_READ_ONLY";
    }

    async login(selection, password) {
        const result = await this.ensureLoginService().login(
            selection,
            password
        );

        if (result.ok && result.session) {
            this.saveSession(result.session);
        }

        return result;
    }

    saveSession(session) {
        sessionStorage.setItem(
            this.sessionKey,
            JSON.stringify(session)
        );
        return session;
    }

    getSession() {
        try {
            const raw = sessionStorage.getItem(this.sessionKey);

            if (!raw) {
                return null;
            }

            const session = JSON.parse(raw);
            const isOfflinePreview = this.isOfflineReadOnly();

            if (
                !session?.classId ||
                !session?.role ||
                !session?.firebaseUid
            ) {
                this.clearSession();
                return null;
            }

            if (isOfflinePreview) {
                const validOfflineSession =
                    session.offlineReadOnly === true &&
                    session.firebaseUid === this.offlinePreviewId;

                if (!validOfflineSession) {
                    this.clearSession();
                    return null;
                }

                return session;
            }

            const auth = this.firebaseAuthService?.getCurrentAuth?.();

            if (auth?.uid !== session.firebaseUid) {
                this.clearSession();
                return null;
            }

            return session;
        } catch (error) {
            this.clearSession();
            return null;
        }
    }

    clearSession() {
        sessionStorage.removeItem(this.sessionKey);
    }

    saveParentAdminSession(session) {
        if (session?.role !== "admin" || session?.isAdmin !== true) {
            throw new Error("A valid Admin session is required.");
        }

        sessionStorage.setItem(
            this.parentAdminSessionKey,
            JSON.stringify(session)
        );

        return session;
    }

    getParentAdminSession() {
        try {
            const raw = sessionStorage.getItem(
                this.parentAdminSessionKey
            );

            if (!raw) {
                return null;
            }

            const session = JSON.parse(raw);

            if (
                session?.role !== "admin" ||
                session?.isAdmin !== true
            ) {
                this.clearParentAdminSession();
                return null;
            }

            return session;
        } catch (error) {
            this.clearParentAdminSession();
            return null;
        }
    }

    clearParentAdminSession() {
        sessionStorage.removeItem(this.parentAdminSessionKey);
    }

    startOfflinePreview(options = {}) {
        if (!this.isOfflineReadOnly()) {
            const error = new Error(
                "Offline preview is only available in OFFLINE_READ_ONLY mode."
            );
            error.code = "OFFLINE_PREVIEW_NOT_AVAILABLE";
            throw error;
        }

        /*
         * Offline preview must never retain a live Firebase
         * Authentication session.
         */
        this.firebaseAuthService?.signOut?.();

        this.clearSession();
        this.clearParentAdminSession();

        const session = {
            classId: this.offlinePreviewId,
            role: "admin",
            isAdmin: true,
            firebaseUid: this.offlinePreviewId,
            offlineReadOnly: true,
            schoolName: String(options.schoolName || "").trim()
        };

        return this.saveSession(session);
    }

    isAuthenticated() {
        return Boolean(this.getSession());
    }

    signOut() {
        this.clearSession();
        this.clearParentAdminSession();
        this.firebaseAuthService?.signOut?.();
    }
}

window.AuthService = new AuthService();