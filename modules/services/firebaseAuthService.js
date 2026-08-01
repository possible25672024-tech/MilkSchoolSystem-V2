class FirebaseAuthService {
    constructor(options = {}) {
        this.storageKey = "milkApp_firebaseAuthSession_v1";
        this.storage = options.storage || globalThis.sessionStorage || null;
        this.fetchImpl = options.fetchImpl || globalThis.fetch;
        this.clock = options.clock || (() => Date.now());
        this.config = {};
        this.firebaseService = null;
        this.currentAuth = null;
        this.refreshPromise = null;
    }

    initialize(config = {}, firebaseService = window.FirebaseService) {
        this.config = { ...(config.auth || {}) };
        this.firebaseService = firebaseService || null;
        this.firebaseService?.setAuthTokenProvider?.(() => this.getValidIdToken());
        return this;
    }

    isConfigured() {
        return this.config.mode === "firebase-email-password" && Boolean(this.config.apiKey);
    }

    requireConfigured() {
        if (!this.isConfigured()) {
            const error = new Error("Firebase Authentication ยังไม่ได้ตั้งค่าสำหรับสภาพแวดล้อมนี้");
            error.code = "FIREBASE_AUTH_NOT_CONFIGURED";
            throw error;
        }
    }

    endpoint(base, path) {
        const normalizedBase = String(base || "").replace(/\/+$/, "");
        return `${normalizedBase}/${path}?key=${encodeURIComponent(this.config.apiKey)}`;
    }

    async request(url, options) {
        if (typeof this.fetchImpl !== "function") {
            throw new Error("Fetch is not available for Firebase Authentication.");
        }
        const response = await this.fetchImpl(url, options);
        const text = await response.text();
        let data = null;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }
        if (!response.ok) {
            const reason = data?.error?.message || data?.error || text || response.statusText;
            const error = new Error(`Firebase Authentication failed (${response.status}): ${reason}`);
            error.code = String(reason || "FIREBASE_AUTH_FAILED");
            error.status = response.status;
            throw error;
        }
        return data || {};
    }

    normalizeAuth(payload = {}) {
        const expiresIn = Math.max(1, Number(payload.expiresIn || payload.expires_in || 3600));
        return {
            uid: String(payload.localId || payload.user_id || ""),
            email: String(payload.email || this.currentAuth?.email || ""),
            idToken: String(payload.idToken || payload.id_token || ""),
            refreshToken: String(payload.refreshToken || payload.refresh_token || ""),
            expiresAt: this.clock() + (expiresIn * 1000)
        };
    }

    saveAuth(auth) {
        if (!auth?.uid || !auth?.idToken || !auth?.refreshToken) {
            throw new Error("Firebase Authentication returned an incomplete token response.");
        }
        this.currentAuth = { ...auth };
        this.storage?.setItem?.(this.storageKey, JSON.stringify(this.currentAuth));
        this.firebaseService?.setAuthToken?.(this.currentAuth.idToken);
        return this.getCurrentAuth();
    }

    loadStoredAuth() {
        try {
            const raw = this.storage?.getItem?.(this.storageKey);
            if (!raw) return null;
            const auth = JSON.parse(raw);
            if (!auth?.uid || !auth?.idToken || !auth?.refreshToken || !Number(auth.expiresAt)) {
                this.clearAuth();
                return null;
            }
            return auth;
        } catch {
            this.clearAuth();
            return null;
        }
    }

    async signIn(email, password) {
        this.requireConfigured();
        const normalizedEmail = String(email || "").trim();
        if (!normalizedEmail || !password) {
            const error = new Error("กรุณากรอกรหัสผ่านและเลือกบัญชีที่ถูกต้อง");
            error.code = "AUTH_CREDENTIALS_REQUIRED";
            throw error;
        }
        const base = this.config.identityToolkitURL || "https://identitytoolkit.googleapis.com/v1";
        const payload = await this.request(this.endpoint(base, "accounts:signInWithPassword"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: normalizedEmail, password: String(password), returnSecureToken: true })
        });
        return this.saveAuth(this.normalizeAuth(payload));
    }

    async refresh() {
        this.requireConfigured();
        if (!this.currentAuth?.refreshToken) {
            throw new Error("Firebase refresh token is not available.");
        }
        if (this.refreshPromise) return this.refreshPromise;
        const base = this.config.secureTokenURL || "https://securetoken.googleapis.com/v1";
        const body = new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: this.currentAuth.refreshToken
        });
        this.refreshPromise = this.request(this.endpoint(base, "token"), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: body.toString()
        }).then(payload => this.saveAuth(this.normalizeAuth(payload)))
            .catch(error => {
                this.clearAuth();
                throw error;
            })
            .finally(() => { this.refreshPromise = null; });
        return this.refreshPromise;
    }

    async restoreAuth() {
        const stored = this.loadStoredAuth();
        if (!stored) return null;
        this.currentAuth = stored;
        const skewMs = Math.max(30, Number(this.config.refreshSkewSeconds || 120)) * 1000;
        if (stored.expiresAt <= this.clock() + skewMs) {
            return this.refresh();
        }
        this.firebaseService?.setAuthToken?.(stored.idToken);
        return this.getCurrentAuth();
    }

    async getValidIdToken() {
        if (!this.currentAuth) return "";
        const skewMs = Math.max(30, Number(this.config.refreshSkewSeconds || 120)) * 1000;
        if (this.currentAuth.expiresAt <= this.clock() + skewMs) {
            await this.refresh();
        }
        return this.currentAuth?.idToken || "";
    }

    getCurrentAuth() {
        if (!this.currentAuth) return null;
        return {
            uid: this.currentAuth.uid,
            email: this.currentAuth.email,
            expiresAt: this.currentAuth.expiresAt
        };
    }

    clearAuth() {
        this.currentAuth = null;
        this.storage?.removeItem?.(this.storageKey);
        this.firebaseService?.setAuthToken?.("");
    }

    signOut() {
        this.clearAuth();
    }
}

window.FirebaseAuthService = new FirebaseAuthService();
