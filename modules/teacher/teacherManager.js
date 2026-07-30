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

    today() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    async refresh(options = {}) {
        const session = this.getSession();
        const includeExtras = options?.includeExtras === true;
        const attendanceDate = String(
            options?.attendanceDate || (!includeExtras ? this.today() : "")
        ).trim();
        const requestOptions = {
            ...options,
            includeExtras
        };

        if (attendanceDate) {
            requestOptions.attendanceDate = attendanceDate;
        } else {
            delete requestOptions.attendanceDate;
        }

        if (session.roomSnapshot && typeof session.roomSnapshot === "object") {
            requestOptions.roomSnapshot = session.roomSnapshot;
        } else {
            delete requestOptions.roomSnapshot;
        }

        this.currentView = await this.teacherService.loadTeacherView(session, requestOptions);

        this.emit("milkapp:teacher-refreshed", {
            roomId: this.currentView.snapshot.room.id,
            extrasLoaded: this.currentView.snapshot.extrasLoaded,
            attendanceScope: this.currentView.snapshot.attendanceScope || null,
            roomSource: this.currentView.snapshot.roomSource || null,
            dashboard: this.currentView.dashboard
        });

        return this.currentView;
    }

    refreshFull() {
        return this.refresh({ includeExtras: true });
    }

    async updateTeacherProfile(input = {}) {
        const session = this.getSession();
        if (!this.teacherService?.updateTeacherProfile) {
            throw new Error("Teacher profile update is not available.");
        }

        const saved = await this.teacherService.updateTeacherProfile(session, {
            roomId: session.roomId || session.classId,
            teacher: input.teacher
        });
        const updatedSession = {
            ...session,
            teacher: saved.teacher,
            roomSnapshot: session.roomSnapshot && typeof session.roomSnapshot === "object"
                ? { ...session.roomSnapshot, teacher: saved.teacher }
                : session.roomSnapshot
        };

        this.authService.saveSession?.(updatedSession);
        if (this.currentView?.snapshot) {
            this.currentView.snapshot.session = {
                ...(this.currentView.snapshot.session || {}),
                teacher: saved.teacher
            };
            this.currentView.snapshot.room = {
                ...(this.currentView.snapshot.room || {}),
                teacher: saved.teacher
            };
            this.currentView.dashboard = {
                ...(this.currentView.dashboard || {}),
                teacher: saved.teacher
            };
        }

        this.emit("milkapp:teacher-profile-updated", {
            roomId: saved.roomId
        });
        return saved;
    }

    buildSessionFallbackSnapshot() {
        try {
            this.ensureServices();
            const session = this.authService.getSession();
            const rawRoom = session?.roomSnapshot;
            if (session?.role !== "teacher" || !rawRoom || typeof rawRoom !== "object") {
                return null;
            }

            const room = typeof this.teacherService.normalizeRoom === "function"
                ? this.teacherService.normalizeRoom({
                    ...rawRoom,
                    id: String(rawRoom.id || session.roomId || session.classId || "")
                })
                : {
                    ...rawRoom,
                    id: String(rawRoom.id || session.roomId || session.classId || ""),
                    name: String(rawRoom.name || session.roomName || session.className || ""),
                    students: Array.isArray(rawRoom.students)
                        ? rawRoom.students.map(student => ({ ...(student || {}) }))
                        : Object.values(rawRoom.students || {}).map(student => ({ ...(student || {}) })),
                    stock: Number(rawRoom.stock) || 0
                };

            return {
                settings: {},
                session: {
                    roomId: String(session.roomId || session.classId || room.id || ""),
                    roomName: String(session.roomName || session.className || room.name || room.id || ""),
                    teacher: String(session.teacher || room.teacher || "ครูประจำชั้น"),
                    schoolName: String(session.schoolName || "โรงเรียน"),
                    role: "teacher"
                },
                room,
                students: Array.isArray(room.students) ? room.students : Object.values(room.students || {}),
                roomStock: Number.isFinite(Number(room.stock)) ? Number(room.stock) : 0,
                distributes: [],
                attendance: {},
                absentMilk: [],
                retroMilk: [],
                vacationMilk: [],
                stockTransactions: [],
                updatedAt: {},
                extrasLoaded: false,
                attendanceScope: null,
                roomSource: "session-fallback",
                degraded: true
            };
        } catch (error) {
            return null;
        }
    }

    getSnapshot() {
        return this.currentView?.snapshot || this.buildSessionFallbackSnapshot();
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
