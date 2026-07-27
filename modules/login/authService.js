class AuthService {
    constructor(loginService = window.LoginService) {
        this.loginService = loginService;
        this.sessionKey = "milkApp_loginSession";
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
            if (!session?.classId || !session?.role) {
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

    isAuthenticated() {
        return Boolean(this.getSession());
    }
}

window.AuthService = new AuthService();
