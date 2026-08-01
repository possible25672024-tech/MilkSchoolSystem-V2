class LoginService {
    constructor(
        repository = window.LoginRepository,
        firebaseAuthService = window.FirebaseAuthService,
        options = {}
    ) {
        this.repository = repository;
        this.firebaseAuthService = firebaseAuthService;
        this.clock = options.clock || (() => Date.now());
        this.cacheTtlMs = Number(options.cacheTtlMs) || 300000;
        this.loginOptionsCache = null;
    }

    ensureRepository() {
        if (!this.repository) this.repository = window.LoginRepository;
        if (!this.repository) throw new Error("LoginRepository is not available.");
        return this.repository;
    }

    ensureFirebaseAuthService() {
        if (!this.firebaseAuthService) this.firebaseAuthService = window.FirebaseAuthService;
        if (!this.firebaseAuthService?.signIn) {
            throw new Error("Firebase Authentication service is not available.");
        }
        return this.firebaseAuthService;
    }

    normalizeDirectory(raw = {}) {
        const entries = Object.entries(raw.accounts || raw.rooms || {})
            .filter(([, account]) => account && typeof account === "object")
            .map(([key, account]) => ({
                id: String(account.id || key),
                name: String(account.name || account.label || account.roomName || key),
                teacher: String(account.teacher || ""),
                authEmail: String(account.authEmail || account.email || "").trim()
            }));
        return {
            schoolName: String(raw.schoolName || raw.school || "โรงเรียน"),
            accounts: entries,
            rooms: entries.filter(account => account.id !== "__admin__")
        };
    }

    cloneLoginOptions(options = {}) {
        const accounts = (options.accounts || []).map(account => ({ ...account }));
        return {
            schoolName: String(options.schoolName || "โรงเรียน"),
            accounts,
            rooms: accounts.filter(account => account.id !== "__admin__")
        };
    }

    isLoginOptionsCacheValid() {
        return Boolean(
            this.loginOptionsCache &&
            this.clock() - this.loginOptionsCache.loadedAt < this.cacheTtlMs
        );
    }

    clearLoginOptionsCache() {
        this.loginOptionsCache = null;
    }

    async loadLoginOptions(options = {}) {
        const forceReload = options === true || options?.forceReload === true;
        if (!forceReload && this.isLoginOptionsCacheValid()) {
            return this.cloneLoginOptions(this.loginOptionsCache.value);
        }
        const value = this.normalizeDirectory(
            await this.ensureRepository().loadPublicLoginDirectory()
        );
        if (!value.accounts.some(account => account.id === "__admin__" && account.authEmail)) {
            throw new Error("Public login directory does not contain a configured Admin account.");
        }
        this.loginOptionsCache = {
            loadedAt: this.clock(),
            value: this.cloneLoginOptions(value)
        };
        return this.cloneLoginOptions(value);
    }

    normalizeRoom(room = {}, roomId) {
        const students = Array.isArray(room.students)
            ? room.students.map(student => ({ ...(student || {}) }))
            : room.students && typeof room.students === "object"
                ? Object.fromEntries(Object.entries(room.students).map(([key, student]) => [key, { ...(student || {}) }]))
                : room.students;
        return {
            ...room,
            id: String(room.id || roomId),
            name: String(room.name || room.roomName || roomId),
            teacher: String(room.teacher || room.teacherName || "ครูประจำชั้น"),
            students
        };
    }

    buildSession({ selection, room, settings, profile, auth, adminOverride = false }) {
        const schoolName = String(settings.school || settings.schoolName || "โรงเรียน");
        const authFacts = {
            firebaseUid: auth.uid,
            authenticatedEmail: auth.email,
            authorizationSource: "firebase-uid-profile",
            authenticatedAt: new Date().toISOString()
        };
        if (profile.role === "admin" && selection === "__admin__") {
            return {
                classId: "__admin__",
                className: "ผู้ดูแลระบบ",
                roomId: null,
                roomName: null,
                teacher: null,
                schoolName,
                role: "admin",
                isAdmin: true,
                adminOverride: false,
                ...authFacts
            };
        }
        return {
            classId: String(selection),
            className: room.name,
            roomId: String(selection),
            roomName: room.name,
            teacher: room.teacher,
            schoolName,
            role: "teacher",
            isAdmin: false,
            adminOverride,
            roomSnapshot: room,
            ...authFacts
        };
    }

    async login(selection, password) {
        const normalizedSelection = String(selection || "").trim();
        if (!normalizedSelection) {
            return { ok: false, code: "ROLE_REQUIRED", message: "กรุณาเลือกห้องเรียนหรือผู้ดูแลระบบ" };
        }
        if (!String(password || "")) {
            return { ok: false, code: "PASSWORD_REQUIRED", message: "กรุณากรอกรหัสผ่าน" };
        }
        const options = await this.loadLoginOptions();
        const account = options.accounts.find(item => item.id === normalizedSelection);
        if (!account?.authEmail) {
            return { ok: false, code: "ACCOUNT_NOT_FOUND", message: "ไม่พบบัญชีสำหรับรายการที่เลือก" };
        }
        const authService = this.ensureFirebaseAuthService();
        try {
            const auth = await authService.signIn(account.authEmail, String(password));
            const repository = this.ensureRepository();
            const profile = await repository.loadAuthorizedUser(auth.uid);
            if (!profile || profile.enabled !== true || !["admin", "teacher"].includes(profile.role)) {
                const error = new Error("บัญชีนี้ไม่มีสิทธิ์ใช้งานระบบ");
                error.code = "AUTHORIZATION_PROFILE_DENIED";
                throw error;
            }
            const selectedRoom = normalizedSelection === "__admin__" ? null : normalizedSelection;
            const adminOverride = profile.role === "admin" && Boolean(selectedRoom);
            if (normalizedSelection === "__admin__" && profile.role !== "admin") {
                const error = new Error("บัญชีนี้ไม่มีสิทธิ์ผู้ดูแลระบบ");
                error.code = "ADMIN_ROLE_REQUIRED";
                throw error;
            }
            if (selectedRoom && profile.role === "teacher" && String(profile.roomId) !== selectedRoom) {
                const error = new Error("บัญชีครูไม่ตรงกับห้องเรียนที่เลือก");
                error.code = "TEACHER_ROOM_MISMATCH";
                throw error;
            }
            const [settings, rawRoom] = await Promise.all([
                profile.role === "admin"
                    ? repository.loadSettings()
                    : Promise.resolve({ school: options.schoolName }),
                selectedRoom ? repository.loadRoom(selectedRoom) : Promise.resolve(null)
            ]);
            if (selectedRoom && !rawRoom) {
                const error = new Error("ไม่พบห้องเรียนที่เลือกในฐานข้อมูล");
                error.code = "ROOM_NOT_FOUND";
                throw error;
            }
            const room = selectedRoom ? this.normalizeRoom(rawRoom, selectedRoom) : null;
            return {
                ok: true,
                session: this.buildSession({
                    selection: normalizedSelection,
                    room,
                    settings: settings || {},
                    profile,
                    auth,
                    adminOverride
                })
            };
        } catch (error) {
            authService.signOut?.();
            if (["INVALID_PASSWORD", "EMAIL_NOT_FOUND", "INVALID_LOGIN_CREDENTIALS"].includes(error.code)) {
                return { ok: false, code: "INVALID_CREDENTIALS", message: "รหัสผ่านไม่ถูกต้อง" };
            }
            throw error;
        }
    }
}

window.LoginService = new LoginService();
