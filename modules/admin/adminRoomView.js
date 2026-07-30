class AdminRoomView {
    constructor(
        manager = window.AdminRoomManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.document = options.document || document;
        this.window = options.window || window;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.prompt = options.prompt || ((message, value) => window.prompt(message, value));
        this.alert = options.alert || (message => window.alert(message));
        this.bound = false;
        this.activeSection = "dashboard";
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        this.handleSession(this.authService?.getSession?.());
    }

    bindEvents() {
        if (this.bound) return;
        this.element("admin-room-select")?.addEventListener("change", event => {
            this.loadRoom(event.target.value);
        });
        this.element("admin-room-refresh")?.addEventListener("click", () => this.loadRooms(true));
        this.element("admin-enter-room")?.addEventListener("click", () => this.manager.enterSelectedRoom());
        this.element("admin-return-button")?.addEventListener("click", () => this.manager.restoreAdmin());
        this.document.querySelectorAll?.("[data-admin-menu]")?.forEach(button => {
            button.addEventListener("click", () => this.showSection(button.dataset.adminMenu));
        });
        this.document.querySelectorAll?.("[data-admin-record-body]")?.forEach(body => {
            body.addEventListener("click", event => this.handleRecordAction(event));
        });
        this.window.addEventListener?.("milkapp:login-success", event => this.handleSession(event?.detail?.session));
        this.window.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    async handleSession(session) {
        if (session?.role !== "admin") return;
        await this.loadRooms(false);
    }

    async loadRooms(forceReload = false) {
        this.setBusy(true);
        this.showError("");
        try {
            const rooms = await this.manager.loadRooms({ forceReload });
            const select = this.element("admin-room-select");
            if (select) {
                select.replaceChildren(...rooms.map(room => {
                    const option = this.document.createElement("option");
                    option.value = room.id;
                    option.textContent = `${room.name} — ${room.teacher}`;
                    return option;
                }));
                select.value = this.manager.selectedRoomId;
            }
            if (this.manager.selectedRoomId) {
                await this.loadRoom(this.manager.selectedRoomId);
            } else {
                this.setStatus("ไม่พบห้องเรียน");
            }
        } catch (error) {
            this.showError(error?.message || "โหลดห้องเรียนไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    async loadRoom(roomId) {
        if (!roomId) return;
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลดข้อมูลห้อง...");
        try {
            const current = await this.manager.selectRoom(roomId);
            this.render(current);
            this.setStatus(`โหลดข้อมูล ${current.room.name} สำเร็จ`);
        } catch (error) {
            this.showError(error?.message || "โหลดข้อมูลห้องไม่สำเร็จ");
            this.setStatus("");
        } finally {
            this.setBusy(false);
        }
    }

    showSection(section) {
        this.activeSection = String(section || "dashboard");
        this.document.querySelectorAll?.("[data-admin-section]")?.forEach(panel => {
            panel.hidden = panel.dataset.adminSection !== this.activeSection;
        });
        this.document.querySelectorAll?.("[data-admin-menu]")?.forEach(button => {
            const active = button.dataset.adminMenu === this.activeSection;
            button.dataset.active = active ? "true" : "false";
            button.setAttribute("aria-pressed", active ? "true" : "false");
        });
    }

    render(current) {
        if (!current) return;
        const dashboard = current.dashboard || {};
        this.setText("admin-selected-room", current.room.name);
        this.setText("admin-selected-teacher", current.room.teacher);
        this.setText("admin-room-students", dashboard.students || 0);
        this.setText("admin-room-stock", `${dashboard.actualRoomStock || 0} กล่อง`);
        this.setText("admin-attendance-days", `${dashboard.attendanceDays || 0} วัน`);
        this.setText("admin-room-used", `${dashboard.usedTotal || 0} กล่อง`);
        this.renderRecords("attendance", current.records.attendance);
        this.renderRecords("pending", current.records.pending);
        this.renderRecords("retroactive", current.records.retroactive);
        this.renderRecords("vacation", current.records.vacation);
    }

    renderRecords(type, records = []) {
        const body = this.element(`admin-${type}-body`);
        if (!body) return;
        const labels = this.recordLabels(type);
        body.replaceChildren(...records.map(record => {
            const row = this.document.createElement("tr");
            row.dataset.recordId = record.id;
            row.dataset.recordType = type;
            row.dataset.recordDate = record.date || "";
            row.dataset.recordNote = record.note || "";
            const summary = type === "attendance"
                ? [`ดื่ม ${record.present}`, `ไม่ดื่ม ${record.absent}`]
                : [record.weekStart || record.retroStart || record.academicYear || "—", `${record.totalBoxes || 0} กล่อง`];
            const cells = [
                record.date || record.weekStart || "—",
                ...summary,
                this.actionMarkup(type)
            ];
            cells.forEach((value, index) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = labels[index] || "";
                if (index === cells.length - 1) cell.innerHTML = value;
                else cell.textContent = String(value ?? "");
                row.appendChild(cell);
            });
            return row;
        }));
        if (!records.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 4;
            cell.className = "admin-operation-empty";
            cell.textContent = "ยังไม่มีรายการ";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    recordLabels(type) {
        return {
            attendance: ["วันที่", "ดื่ม", "ไม่ดื่ม", "จัดการ"],
            pending: ["วันที่จ่าย", "สัปดาห์", "จำนวน", "จัดการ"],
            retroactive: ["วันที่จ่าย", "ช่วงย้อนหลัง", "จำนวน", "จัดการ"],
            vacation: ["วันที่จ่าย", "ปีการศึกษา", "จำนวน", "จัดการ"]
        }[type] || ["วันที่", "รายละเอียด", "จำนวน", "จัดการ"];
    }

    actionMarkup(type) {
        const editLabel = type === "attendance" ? "เปิดแก้ไข" : "แก้หมายเหตุ";
        return `<div class="admin-record-actions">${[
            '<button type="button" data-admin-record-action="view">ดู</button>',
            `<button type="button" data-admin-record-action="edit">${editLabel}</button>`,
            '<button type="button" class="danger" data-admin-record-action="delete">ลบ</button>'
        ].join("")}</div>`;
    }

    async handleRecordAction(event) {
        const button = event?.target?.closest?.("[data-admin-record-action]");
        const row = button?.closest?.("tr");
        if (!button || !row?.dataset?.recordType) return;
        const type = row.dataset.recordType;
        const input = {
            recordId: row.dataset.recordId,
            date: row.dataset.recordDate
        };
        if (button.dataset.adminRecordAction === "view") {
            this.alert([
                `ประเภท: ${this.typeLabel(type)}`,
                `วันที่: ${input.date || "—"}`,
                `รหัสรายการ: ${input.recordId || "—"}`,
                `หมายเหตุ: ${row.dataset.recordNote || "—"}`
            ].join("\n"));
            return;
        }
        if (button.dataset.adminRecordAction === "edit") {
            if (type === "attendance") {
                await this.manager.enterSelectedRoom({ attendanceDate: input.date });
                return;
            }
            const note = this.prompt("แก้ไขหมายเหตุของรายการ", row.dataset.recordNote || "");
            if (note === null) return;
            await this.runMutation(
                () => this.manager.updateRecordNote(type, { ...input, note }),
                "บันทึกหมายเหตุแล้ว"
            );
            return;
        }
        if (button.dataset.adminRecordAction === "delete") {
            if (!this.confirm(`ยืนยันลบ${this.typeLabel(type)} วันที่ ${input.date || "นี้"}?\nระบบจะปรับคืน Room Stock ตาม Service เดิม`)) {
                return;
            }
            await this.runMutation(
                () => this.manager.deleteRecord(type, input),
                "ลบรายการและปรับ Room Stock แล้ว"
            );
        }
    }

    async runMutation(action, successMessage) {
        this.setBusy(true);
        this.showError("");
        try {
            await action();
            this.render(this.manager.current);
            this.setStatus(successMessage);
        } catch (error) {
            this.showError(error?.message || "ดำเนินการไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    typeLabel(type) {
        return {
            attendance: "ประวัติดื่มนม",
            pending: "นมค้างรายสัปดาห์",
            retroactive: "จ่ายนมย้อนหลัง",
            vacation: "จ่ายนมช่วงปิดเทอม"
        }[type] || "รายการ";
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(message) {
        this.setText("admin-room-status", message);
    }

    showError(message) {
        const element = this.element("admin-room-error");
        if (!element) return;
        element.textContent = message || "";
        element.hidden = !message;
    }

    setBusy(busy) {
        for (const id of ["admin-room-select", "admin-room-refresh", "admin-enter-room"]) {
            const element = this.element(id);
            if (element) element.disabled = Boolean(busy);
        }
    }

    reset() {
        this.manager.clear?.();
        this.setStatus("");
        this.showError("");
    }
}

window.AdminRoomView = new AdminRoomView();
