class LoginService {
    constructor(repository = window.LoginRepository, options = {}) {
        this.repository = repository;
        this.defaultPassword = "1234";
        this.clock = options.clock || (() => Date.now());
        this.cacheTtlMs = Number(options.cacheTtlMs) || 300000;
        this.loginOptionsCache = null;
    }

    ensureRepository() {
        if (!this.repository) {
            this.repository = window.LoginRepository;
        }

        if (!this.repository) {
            throw new Error("LoginRepository is not available.");
        }

        return this.repository;
    }

    cloneRoom(room = {}) {
        const students = Array.isArray(room.students)
            ? room.students.map(student => ({ ...(student || {}) }))
            : room.students && typeof room.students === "object"
                ? Object.fromEntries(
                    Object.entries(room.students).map(([key, student]) => [key, { ...(student || {}) }])
                )
                : room.students;

        return {
            ...room,
            students
        };
    }

    normalizeRooms(rawRooms) {
        const entries = Array.isArray(rawRooms)
            ? rawRooms.map((room, index) => [room?.id || String(index), room])
            : Object.entries(rawRooms || {});

        return entries
            .filter(([, room]) => room && typeof room === "object")
            .map(([key, room]) => ({
                ...room,
                id: String(room.id || key),
                name: String(room.name || room.roomName || room.id || key),
                teacher: String(room.teacher || room.teacherName || "ครูประจำชั้น")
            }));
    }

    cloneLoginOptions(options = {}) {
        return {
            settings: { ...(options.settings || {}) },
            rooms: (options.rooms || []).map(room => this.cloneRoom(room))
        };
    }

    isLoginOptionsCacheValid() {
        if (!this.loginOptionsCache) {
            return false;
        }

        return this.clock() - this.loginOptionsCache.loadedAt < this.cacheTtlMs;
    }

    clearLoginOptionsCache() {
        this.loginOptionsCache = null;
    }

    async loadLoginOptions(options = {}) {
        const forceReload = options === true || options?.forceReload === true;
        if (!forceReload && this.isLoginOptionsCacheValid()) {
            return this.cloneLoginOptions(this.loginOptionsCache.value);
        }

        const context = await this.ensureRepository().loadLoginContext();
        const value = {
            settings: context.settings || {},
            rooms: this.normalizeRooms(context.rooms)
        };

        this.loginOptionsCache = {
            loadedAt: this.clock(),
            value: this.cloneLoginOptions(value)
        };

        return this.cloneLoginOptions(value);
    }

    buildSession({ selection, room, settings, role, adminOverride = false }) {
        const schoolName = String(
            settings.school || settings.schoolName || "โรงเรียน"
        );

        if (role === "admin") {
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
                authenticatedAt: new Date().toISOString()
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
            roomSnapshot: this.cloneRoom(room),
            authenticatedAt: new Date().toISOString()
        };
    }

    async login(selection, password) {
        const normalizedSelection = String(selection || "").trim();
        const normalizedPassword = String(password || "");

        if (!normalizedSelection) {
            return { ok: false, code: "ROLE_REQUIRED", message: "กรุณาเลือกห้องเรียนหรือผู้ดูแลระบบ" };
        }

        if (!normalizedPassword) {
            return { ok: false, code: "PASSWORD_REQUIRED", message: "กรุณากรอกรหัสผ่าน" };
        }

        const { settings, rooms } = await this.loadLoginOptions();
        const adminPassword = String(settings.adminPassword || this.defaultPassword);
        const teacherPassword = String(settings.teacherPassword || this.defaultPassword);

        if (normalizedSelection === "__admin__") {
            if (normalizedPassword !== adminPassword) {
                return { ok: false, code: "INVALID_CREDENTIALS", message: "รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง" };
            }

            return {
                ok: true,
                session: this.buildSession({
                    selection: normalizedSelection,
                    settings,
                    role: "admin"
                })
            };
        }

        const room = rooms.find(item => item.id === normalizedSelection);
        if (!room) {
            return { ok: false, code: "ROOM_NOT_FOUND", message: "ไม่พบห้องเรียนที่เลือกในฐานข้อมูล" };
        }

        const matchesTeacher = normalizedPassword === teacherPassword;
        const matchesAdmin = normalizedPassword === adminPassword;

        if (!matchesTeacher && !matchesAdmin) {
            return { ok: false, code: "INVALID_CREDENTIALS", message: "รหัสผ่านครูประจำชั้นไม่ถูกต้อง" };
        }

        return {
            ok: true,
            session: this.buildSession({
                selection: normalizedSelection,
                room,
                settings,
                role: "teacher",
                adminOverride: matchesAdmin
            })
        };
    }
}

window.LoginService = new LoginService();
