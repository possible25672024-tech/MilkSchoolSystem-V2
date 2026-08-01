class AuthService {
    constructor(loginService = window.LoginService, firebaseAuthService = window.FirebaseAuthService) {
        this.loginService = loginService;
        this.firebaseAuthService = firebaseAuthService;
        this.sessionKey = "milkApp_loginSession";
        this.parentAdminSessionKey = "milkApp_parentAdminSession";
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

    async login(selection, password) {
        const result = await this.ensureLoginService().login(selection, password);

        if (result.ok && result.session) {
            this.saveSession(result.session);
        }

        return result;
    }

    saveSession(session) {
        sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
        return session;
    }

    getSession() {
        try {
            const raw = sessionStorage.getItem(this.sessionKey);
            if (!raw) {
                return null;
            }

            const session = JSON.parse(raw);
            const auth = this.firebaseAuthService?.getCurrentAuth?.();
            if (!session?.classId || !session?.role || !session?.firebaseUid || auth?.uid !== session.firebaseUid) {
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
        sessionStorage.setItem(this.parentAdminSessionKey, JSON.stringify(session));
        return session;
    }

    getParentAdminSession() {
        try {
            const raw = sessionStorage.getItem(this.parentAdminSessionKey);
            if (!raw) return null;
            const session = JSON.parse(raw);
            if (session?.role !== "admin" || session?.isAdmin !== true) {
                this.clearParentAdminSession();
                return null;
            }
            return session;
        } catch {
            this.clearParentAdminSession();
            return null;
        }
    }

    clearParentAdminSession() {
        sessionStorage.removeItem(this.parentAdminSessionKey);
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
