class LoginService {
    constructor(repository = window.LoginRepository) {
        this.repository = repository;
        this.defaultPassword = "1234";
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

    async loadLoginOptions() {
        const context = await this.ensureRepository().loadLoginContext();

        return {
            settings: context.settings || {},
            rooms: this.normalizeRooms(context.rooms)
        };
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
