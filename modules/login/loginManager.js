class LoginManager {
    constructor(authService = window.AuthService, loginService = window.LoginService) {
        this.authService = authService;
        this.loginService = loginService;
        this.currentUser = null;
        this.bound = false;
    }

    async initialize() {
        this.bindEvents();

        const session = this.authService?.getSession?.();
        if (session) {
            this.currentUser = session;
            this.renderAuthenticated(session);
        } else {
            await this.refreshLoginOptions();
        }

        return this.currentUser;
    }

    bindEvents() {
        if (this.bound) {
            return;
        }

        const form = document.getElementById("login-form");
        const logoutButton = document.getElementById("logout-button");
        const reloadButton = document.getElementById("reload-login-options");

        form?.addEventListener("submit", event => {
            event.preventDefault();
            this.login();
        });

        logoutButton?.addEventListener("click", () => this.logout());
        reloadButton?.addEventListener("click", () => this.refreshLoginOptions());

        this.bound = true;
    }

    async refreshLoginOptions() {
        const select = document.getElementById("login-class-select");
        if (!select) {
            return;
        }

        this.clearError();
        this.setStatus("กำลังโหลดข้อมูลห้องเรียน...");

        select.disabled = true;
        select.replaceChildren(
            this.createOption("", "-- เลือกห้องเรียน / บทบาท --"),
            this.createOption("__admin__", "👑 ผู้ดูแลระบบ")
        );

        try {
            const { rooms } = await this.loginService.loadLoginOptions({ forceReload: true });

            rooms.forEach(room => {
                const label = room.teacher
                    ? `${room.name} — ${room.teacher}`
                    : room.name;
                select.appendChild(this.createOption(room.id, label));
            });

            this.setStatus(`เชื่อมต่อแล้ว พบ ${rooms.length} ห้องเรียน`);
        } catch (error) {
            console.error("LoginManager: cannot load login options.", error);
            this.showError(
                error.message === "Firebase Realtime Database URL is not configured."
                    ? "ยังไม่ได้ตั้งค่า Firebase Realtime Database URL"
                    : "โหลดข้อมูลเข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบ Firebase และการเชื่อมต่อ"
            );
            this.setStatus("");
        } finally {
            select.disabled = false;
        }
    }

    createOption(value, label) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        return option;
    }

    async login(selection, password) {
        const selectedValue = selection ?? document.getElementById("login-class-select")?.value;
        const passwordValue = password ?? document.getElementById("login-password")?.value ?? "";

        this.clearError();
        this.setBusy(true);

        try {
            const result = await this.authService.login(selectedValue, passwordValue);

            if (!result.ok) {
                this.showError(result.message || "เข้าสู่ระบบไม่สำเร็จ");
                return result;
            }

            this.currentUser = result.session;
            this.renderAuthenticated(result.session);

            const passwordInput = document.getElementById("login-password");
            if (passwordInput) {
                passwordInput.value = "";
            }

            window.dispatchEvent(new CustomEvent("milkapp:login-success", {
                detail: { session: result.session }
            }));

            return result;
        } catch (error) {
            console.error("LoginManager: login failed.", error);
            const result = {
                ok: false,
                code: "LOGIN_ERROR",
                message: "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อ"
            };
            this.showError(result.message);
            return result;
        } finally {
            this.setBusy(false);
        }
    }

    logout() {
        this.authService.clearSession();
        this.currentUser = null;

        document.getElementById("app-panel")?.setAttribute("hidden", "");
        document.getElementById("admin-shell")?.removeAttribute("hidden");
        document.getElementById("teacher-shell")?.setAttribute("hidden", "");
        document.getElementById("login-panel")?.removeAttribute("hidden");

        this.refreshLoginOptions();

        window.dispatchEvent(new CustomEvent("milkapp:logout"));
    }

    renderAuthenticated(session) {
        document.getElementById("login-panel")?.setAttribute("hidden", "");
        document.getElementById("app-panel")?.removeAttribute("hidden");

        const isTeacher = session.role === "teacher";
        const adminShell = document.getElementById("admin-shell");
        const teacherShell = document.getElementById("teacher-shell");

        if (isTeacher) {
            adminShell?.setAttribute("hidden", "");
            teacherShell?.setAttribute("hidden", "");
        } else {
            adminShell?.removeAttribute("hidden");
            teacherShell?.setAttribute("hidden", "");
        }

        const currentUser = document.getElementById("current-user");
        if (currentUser) {
            currentUser.textContent = session.role === "admin"
                ? `ผู้ดูแลระบบ — ${session.schoolName}`
                : `${session.roomName} — ${session.teacher}`;
        }
    }

    setBusy(isBusy) {
        const button = document.getElementById("login-submit");
        if (!button) {
            return;
        }

        button.disabled = isBusy;
        button.textContent = isBusy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ";
    }

    setStatus(message) {
        const element = document.getElementById("login-status");
        if (element) {
            element.textContent = message || "";
        }
    }

    showError(message) {
        const element = document.getElementById("login-error");
        if (!element) {
            return;
        }

        element.textContent = message;
        element.hidden = false;
    }

    clearError() {
        const element = document.getElementById("login-error");
        if (!element) {
            return;
        }

        element.textContent = "";
        element.hidden = true;
    }
}

window.LoginManager = new LoginManager();
