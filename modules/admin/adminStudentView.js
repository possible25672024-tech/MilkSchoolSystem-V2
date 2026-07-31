class AdminStudentView {
    constructor(
        manager = window.AdminStudentManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.document = options.document || document;
        this.window = options.window || window;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.alert = options.alert || (message => window.alert(message));
        this.activeRoomId = "";
        this.bound = false;
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        const session = this.authService?.getSession?.();
        if (session?.role === "admin") {
            this.refresh().catch(error => this.showError(error));
        }
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelectorAll?.("[data-admin-menu]")?.forEach(button => {
            button.addEventListener("click", () => {
                if (["student-import", "room-management", "student-report"].includes(button.dataset.adminMenu)) {
                    this.refresh().catch(error => this.showError(error));
                }
            });
        });
        this.element("admin-student-file")?.addEventListener("change", event => {
            this.previewFile(event.target.files?.[0]);
        });
        this.element("admin-student-import-confirm")?.addEventListener("click", () => {
            this.confirmImport();
        });
        this.element("admin-student-import-cancel")?.addEventListener("click", () => {
            this.cancelImport();
        });
        this.element("admin-room-create-form")?.addEventListener("submit", event => {
            this.createRoom(event);
        });
        this.element("admin-room-management-body")?.addEventListener("click", event => {
            this.handleRoomAction(event);
        });
        this.element("admin-student-report-body")?.addEventListener("click", event => {
            const button = event.target.closest?.("[data-student-room]");
            if (button) this.selectReportRoom(button.dataset.studentRoom);
        });
        this.element("admin-student-report-refresh")?.addEventListener("click", () => {
            this.refresh().catch(error => this.showError(error));
        });
        this.element("admin-student-report-export")?.addEventListener("click", () => {
            this.exportCsv();
        });
        this.element("admin-student-report-print")?.addEventListener("click", () => {
            this.window.print?.();
        });
        this.window.addEventListener?.("milkapp:login-success", event => {
            if (event?.detail?.session?.role === "admin") {
                this.refresh().catch(error => this.showError(error));
            }
        });
        this.window.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    async refresh() {
        this.setBusy(true);
        this.showError("");
        try {
            const report = await this.manager.refresh();
            this.renderReport(report);
            this.renderRoomManagement(report.rooms);
            return report;
        } finally {
            this.setBusy(false);
        }
    }

    async previewFile(file) {
        if (!file) return;
        this.setImportBusy(true);
        this.showError("");
        try {
            const preview = await this.manager.previewFile(file);
            this.renderImportPreview(preview);
        } catch (error) {
            this.renderImportPreview({
                valid: false,
                errors: [{ message: error?.message || "อ่านไฟล์ไม่สำเร็จ" }],
                items: []
            });
        } finally {
            this.setImportBusy(false);
        }
    }

    renderImportPreview(preview = {}) {
        const panel = this.element("admin-student-import-preview");
        panel?.removeAttribute("hidden");
        this.setText("admin-student-import-file-name", preview.fileName || "ไฟล์ที่เลือก");
        this.setText("admin-student-import-rooms", `${preview.roomCount || 0} ห้อง`);
        this.setText("admin-student-import-total", `${preview.importedStudents || 0} คน`);
        this.setText(
            "admin-student-import-mode",
            preview.valid ? "พร้อมยืนยัน" : "ต้องแก้ไฟล์ก่อน"
        );

        const messages = [
            ...(preview.errors || []).map(error => ({
                state: "error",
                text: this.importMessage(error)
            })),
            ...(preview.warnings || []).map(warning => ({
                state: "warning",
                text: this.importMessage(warning)
            })),
            ...(preview.parserWarnings || []).map(warning => ({
                state: "warning",
                text: this.importMessage(warning)
            }))
        ];
        const messageList = this.element("admin-student-import-messages");
        if (messageList) {
            messageList.replaceChildren(...messages.map(message => {
                const item = this.document.createElement("li");
                item.dataset.state = message.state;
                item.textContent = message.text;
                return item;
            }));
            messageList.hidden = messages.length === 0;
        }

        const body = this.element("admin-student-import-body");
        if (body) {
            body.replaceChildren(...(preview.items || []).map((item, index) => {
                const room = item.room || {};
                return this.tableRow([
                    index + 1,
                    room.name || "—",
                    room.level || "—",
                    room.teacher || "—",
                    item.studentCount || 0,
                    item.isUpdate ? "อัปเดต · รักษา roomId/Stock" : "ห้องใหม่ · Stock 0"
                ]);
            }));
            if (!(preview.items || []).length) {
                body.appendChild(this.emptyRow(6, "ยังไม่มีห้องที่ผ่านการตรวจ"));
            }
        }

        const confirmButton = this.element("admin-student-import-confirm");
        if (confirmButton) confirmButton.disabled = !preview.valid;
    }

    importMessage(error = {}) {
        const room = error.roomName ? `ห้อง ${error.roomName}: ` : "";
        if (error.code === "IMPORT_STUDENT_CROSS_ROOM_DUPLICATE") {
            return `${room}พบรหัสนักเรียนซ้ำข้ามห้อง`;
        }
        if (error.code === "IMPORT_STUDENT_DUPLICATE") {
            return `${room}พบรายชื่อนักเรียนซ้ำภายในห้อง`;
        }
        return `${room}${error.message || error.code || "ข้อมูลไม่ถูกต้อง"}`;
    }

    async confirmImport() {
        if (!this.confirm("ยืนยันนำเข้ารายชื่อที่แสดงในตัวอย่าง?\nRoom Stock และ Main Stock จะไม่เปลี่ยนแปลง")) {
            return;
        }
        this.setImportBusy(true);
        try {
            const result = await this.manager.confirmImport();
            if (!result.ok) {
                if (result.code === "ROOM_IMPORT_CONFLICT") {
                    this.renderImportConflict();
                    return;
                }
                throw new Error(result.message || "ยืนยันนำเข้าไม่สำเร็จ");
            }
            this.setText(
                "admin-student-import-status",
                `นำเข้าสำเร็จ ${result.importedStudents} คน จาก ${result.roomCount} ห้อง`
            );
            this.clearImportForm();
            this.renderReport(this.manager.report);
            this.renderRoomManagement(this.manager.report.rooms);
        } catch (error) {
            this.showError(error);
        } finally {
            this.setImportBusy(false);
        }
    }

    renderImportConflict() {
        const button = this.element("admin-student-import-confirm");
        if (button) button.disabled = true;
        const file = this.element("admin-student-file");
        if (file) file.value = "";
        this.setText(
            "admin-student-import-status",
            "ข้อมูลห้องเรียนเปลี่ยนหลังดูตัวอย่าง ระบบไม่ได้เขียนข้อมูล กรุณาเลือกไฟล์ใหม่และตรวจตัวอย่างอีกครั้ง"
        );
        const status = this.element("admin-student-import-status");
        if (status) status.dataset.state = "error";
    }

    cancelImport() {
        this.manager.cancelImport();
        this.clearImportForm();
        this.setText("admin-student-import-status", "ยกเลิกตัวอย่างนำเข้าแล้ว");
    }

    clearImportForm() {
        const file = this.element("admin-student-file");
        if (file) file.value = "";
        const panel = this.element("admin-student-import-preview");
        if (panel) panel.hidden = true;
    }

    async createRoom(event) {
        event.preventDefault();
        const input = {
            name: this.element("admin-room-create-name")?.value,
            level: this.element("admin-room-create-level")?.value,
            teacher: this.element("admin-room-create-teacher")?.value,
            count: this.element("admin-room-create-count")?.value
        };
        this.setBusy(true);
        try {
            const result = await this.manager.createRoom(input);
            if (!result.ok) {
                throw new Error(this.validationMessage(result));
            }
            event.target.reset?.();
            this.renderReport(this.manager.report);
            this.renderRoomManagement(this.manager.report.rooms);
            this.setText("admin-room-management-status", `เพิ่มห้อง ${result.room.name} แล้ว`);
        } catch (error) {
            this.showError(error);
        } finally {
            this.setBusy(false);
        }
    }

    renderRoomManagement(rooms = []) {
        const body = this.element("admin-room-management-body");
        if (!body) return;
        body.replaceChildren(...rooms.map(room => {
            const row = this.document.createElement("tr");
            row.dataset.roomId = room.id;
            const cells = [
                room.name,
                room.level || "—",
                room.teacher || "—",
                room.total,
                `<div class="admin-record-actions">
                    <button type="button" data-room-action="view">ดูรายชื่อ</button>
                    <button type="button" data-room-action="edit">แก้ไข</button>
                    <button type="button" class="danger" data-room-action="delete">ลบ</button>
                </div>`
            ];
            cells.forEach((value, index) => {
                const cell = this.document.createElement("td");
                if (index === cells.length - 1) cell.innerHTML = value;
                else cell.textContent = String(value);
                row.appendChild(cell);
            });
            return row;
        }));
        if (!rooms.length) body.appendChild(this.emptyRow(5, "ยังไม่มีห้องเรียน"));
    }

    async handleRoomAction(event) {
        const button = event.target.closest?.("[data-room-action]");
        const roomId = button?.closest?.("tr")?.dataset?.roomId;
        if (!button || !roomId) return;
        const room = this.manager.report?.rooms?.find(candidate => candidate.id === roomId);
        if (!room) return;

        if (button.dataset.roomAction === "view") {
            this.activeRoomId = roomId;
            this.renderSelectedRoom(room);
            return;
        }
        if (button.dataset.roomAction === "edit") {
            await this.editRoom(room);
            return;
        }
        if (button.dataset.roomAction === "delete") {
            await this.deleteRoom(room);
        }
    }

    async editRoom(room) {
        const name = this.window.prompt?.("ชื่อห้องเรียน", room.name);
        if (name === null) return;
        const level = this.window.prompt?.("ระดับชั้น", room.level || "");
        if (level === null) return;
        const teacher = this.window.prompt?.("ครูประจำชั้น", room.teacher || "");
        if (teacher === null) return;
        this.setBusy(true);
        try {
            const result = await this.manager.updateRoom(room.id, { name, level, teacher });
            if (!result.ok) throw new Error(this.validationMessage(result));
            this.renderReport(this.manager.report);
            this.renderRoomManagement(this.manager.report.rooms);
            this.setText("admin-room-management-status", `แก้ไขห้อง ${result.room.name} แล้ว โดยรักษา roomId และ Room Stock เดิม`);
        } catch (error) {
            this.showError(error);
        } finally {
            this.setBusy(false);
        }
    }

    async deleteRoom(room) {
        if (!this.confirm(`ยืนยันลบห้อง ${room.name}?\nระบบจะบล็อกถ้ามี Stock หรือประวัติอ้างอิง`)) {
            return;
        }
        this.setBusy(true);
        try {
            const result = await this.manager.deleteRoom(room.id);
            if (!result.ok) {
                if (result.code === "ROOM_HAS_DEPENDENCIES") {
                    throw new Error(this.dependencyMessage(result.report));
                }
                throw new Error("ลบห้องไม่สำเร็จ");
            }
            this.renderReport(this.manager.report);
            this.renderRoomManagement(this.manager.report.rooms);
            this.setText("admin-room-management-status", `ลบห้อง ${room.name} แล้ว`);
        } catch (error) {
            this.showError(error);
        } finally {
            this.setBusy(false);
        }
    }

    dependencyMessage(report = {}) {
        const labels = {
            roomStock: "Room Stock",
            distributes: "การจ่ายให้ห้อง",
            attendance: "เช็กดื่มนม",
            absentMilk: "นมค้าง",
            retroMilk: "ย้อนหลัง",
            vacationMilk: "ปิดเทอม",
            stockTransactions: "Ledger"
        };
        const details = Object.entries(report.dependencies || {})
            .filter(([, count]) => Number(count) > 0)
            .map(([name, count]) => `${labels[name] || name} ${count}`)
            .join(", ");
        return `ลบห้องไม่ได้ เพราะมีข้อมูลอ้างอิง: ${details || "ไม่ทราบรายการ"}`;
    }

    validationMessage(result = {}) {
        return (result.errors || []).map(error => error.message).join(" · ") || "ข้อมูลห้องไม่ถูกต้อง";
    }

    renderReport(report = {}) {
        this.setText("admin-student-report-rooms", `${report.totals?.rooms || 0} ห้อง`);
        this.setText("admin-student-report-total", `${report.totals?.students || 0} คน`);
        this.setText("admin-student-report-male", `${report.totals?.male || 0} คน`);
        this.setText("admin-student-report-female", `${report.totals?.female || 0} คน`);
        this.setText("admin-student-report-unknown", `${report.totals?.unknown || 0} คน`);
        const body = this.element("admin-student-report-body");
        if (body) {
            body.replaceChildren(...(report.rooms || []).map(room => {
                const row = this.document.createElement("tr");
                [
                    room.name,
                    room.level || "—",
                    room.teacher || "—",
                    room.male,
                    room.female,
                    room.unknown,
                    room.total
                ].forEach(value => {
                    const cell = this.document.createElement("td");
                    cell.textContent = String(value);
                    row.appendChild(cell);
                });
                const action = this.document.createElement("td");
                action.innerHTML = `<button type="button" data-student-room="${this.escapeAttribute(room.id)}">ดูรายชื่อ</button>`;
                row.appendChild(action);
                return row;
            }));
            if (!(report.rooms || []).length) {
                body.appendChild(this.emptyRow(8, "ยังไม่มีข้อมูลนักเรียน"));
            }
        }

        const selected = (report.rooms || []).find(room => room.id === this.activeRoomId)
            || report.rooms?.[0];
        if (selected) {
            this.activeRoomId = selected.id;
            this.renderSelectedRoom(selected);
        } else {
            this.renderSelectedRoom(null);
        }
    }

    selectReportRoom(roomId) {
        const room = this.manager.report?.rooms?.find(candidate => candidate.id === roomId);
        if (!room) return;
        this.activeRoomId = roomId;
        this.renderSelectedRoom(room);
    }

    renderSelectedRoom(room) {
        this.setText("admin-student-detail-title", room ? `รายชื่อนักเรียนห้อง ${room.name}` : "รายชื่อนักเรียน");
        this.setText(
            "admin-student-detail-meta",
            room ? `${room.level || "ไม่ระบุระดับ"} · ${room.teacher || "ไม่ระบุครู"} · ${room.total} คน` : "—"
        );
        const body = this.element("admin-student-detail-body");
        if (!body) return;
        body.replaceChildren(...(room?.students || []).map(student => this.tableRow([
            student.number,
            student.studentId || "—",
            student.name,
            student.gender,
            student.citizenId || "—"
        ])));
        if (!room?.students?.length) {
            body.appendChild(this.emptyRow(5, room ? `ยังไม่มีรายชื่อรายคน (ยอดกำหนด ${room.total} คน)` : "ยังไม่ได้เลือกห้อง"));
        }
    }

    exportCsv() {
        try {
            const csv = this.manager.exportCsv();
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = this.document.createElement("a");
            anchor.href = url;
            anchor.download = "รายงานนักเรียน-sprint-5.5.csv";
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            this.showError(error);
        }
    }

    tableRow(values = []) {
        const row = this.document.createElement("tr");
        values.forEach(value => {
            const cell = this.document.createElement("td");
            cell.textContent = String(value ?? "");
            row.appendChild(cell);
        });
        return row;
    }

    emptyRow(colspan, text) {
        const row = this.document.createElement("tr");
        const cell = this.document.createElement("td");
        cell.colSpan = colspan;
        cell.className = "admin-operation-empty";
        cell.textContent = text;
        row.appendChild(cell);
        return row;
    }

    setBusy(busy) {
        ["admin-room-management", "admin-student-report-panel"].forEach(id => {
            this.element(id)?.setAttribute("aria-busy", busy ? "true" : "false");
        });
    }

    setImportBusy(busy) {
        this.element("admin-student-import-panel")?.setAttribute(
            "aria-busy",
            busy ? "true" : "false"
        );
        const confirmButton = this.element("admin-student-import-confirm");
        if (confirmButton && busy) confirmButton.disabled = true;
    }

    showError(error) {
        const text = typeof error === "string" ? error : error?.message || "";
        const target = this.element("admin-student-error");
        if (!target) return;
        target.textContent = text;
        target.hidden = !text;
    }

    setText(id, value) {
        const target = this.element(id);
        if (target) target.textContent = String(value ?? "");
    }

    escapeAttribute(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    reset() {
        this.manager.cancelImport();
        this.manager.report = null;
        this.activeRoomId = "";
        this.clearImportForm();
    }
}

window.AdminStudentView = new AdminStudentView();
