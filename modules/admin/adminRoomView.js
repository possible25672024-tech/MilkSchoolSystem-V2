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
        this.attendanceEditor = null;
        this.attendanceEditorRows = new Map();
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
        this.element("admin-attendance-editor-form")?.addEventListener("submit", event => {
            this.saveAttendanceEditor(event);
        });
        this.element("admin-attendance-editor-cancel")?.addEventListener("click", () => {
            this.closeAttendanceEditor();
        });
        this.element("admin-attendance-editor-close")?.addEventListener("click", () => {
            this.closeAttendanceEditor();
        });
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
        this.closeAttendanceEditor();
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
                await this.openAttendanceEditor(input.date);
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

    async openAttendanceEditor(date) {
        this.setBusy(true);
        this.showError("");
        try {
            const editor = await this.manager.loadAttendanceEditor(date);
            this.renderAttendanceEditor(editor);
            this.setStatus(`กำลังแก้ไขข้อมูลวันที่ ${editor.date} ในสิทธิ์ผู้ดูแลระบบ`);
        } catch (error) {
            this.showError(error?.message || "เปิดข้อมูลสำหรับแก้ไขไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    renderAttendanceEditor(editor) {
        this.attendanceEditor = editor;
        this.attendanceEditorRows.clear();
        this.setText("admin-attendance-editor-date", editor?.date || "—");
        const list = this.element("admin-attendance-editor-list");
        if (!list) return;
        const students = Array.isArray(editor?.students) ? editor.students : [];
        list.replaceChildren(...students.map((student, index) => {
            const studentId = String(student.id || `student_${index + 1}`);
            const row = this.document.createElement("article");
            row.className = "admin-attendance-editor-row";

            const identity = this.document.createElement("div");
            identity.className = "admin-attendance-editor-identity";
            const number = this.document.createElement("span");
            number.textContent = String(student.num || index + 1);
            const name = this.document.createElement("strong");
            name.textContent = String(student.name || `นักเรียนคนที่ ${index + 1}`);
            identity.append(number, name);

            const choices = this.document.createElement("div");
            choices.className = "admin-attendance-editor-choices";
            const present = this.createAttendanceEditorChoice(studentId, index, "present", "ดื่มนม");
            const absent = this.createAttendanceEditorChoice(studentId, index, "absent", "ไม่ดื่มนม");
            choices.append(present.label, absent.label);

            const note = this.document.createElement("input");
            note.type = "text";
            note.className = "admin-attendance-editor-note";
            note.placeholder = "หมายเหตุรายคน (ไม่บังคับ)";
            note.setAttribute("aria-label", `หมายเหตุ ${name.textContent}`);

            const status = String(editor?.record?.data?.[studentId] || "");
            present.input.checked = status === "present";
            absent.input.checked = status === "absent";
            note.value = String(editor?.record?.notes?.[studentId] || "");
            present.input.addEventListener("change", () => this.renderAttendanceEditorTotals());
            absent.input.addEventListener("change", () => this.renderAttendanceEditorTotals());

            row.append(identity, choices, note);
            this.attendanceEditorRows.set(studentId, {
                present: present.input,
                absent: absent.input,
                note
            });
            return row;
        }));
        this.element("admin-attendance-editor")?.removeAttribute("hidden");
        this.renderAttendanceEditorTotals();
        this.element("admin-attendance-editor")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }

    createAttendanceEditorChoice(studentId, index, value, text) {
        const label = this.document.createElement("label");
        label.className = `admin-attendance-editor-choice ${value}`;
        const input = this.document.createElement("input");
        input.type = "radio";
        input.name = `admin-attendance-${index}`;
        input.value = value;
        input.dataset.studentId = studentId;
        const span = this.document.createElement("span");
        span.textContent = text;
        label.append(input, span);
        return { label, input };
    }

    renderAttendanceEditorTotals() {
        let present = 0;
        let absent = 0;
        for (const controls of this.attendanceEditorRows.values()) {
            if (controls.present.checked) present += 1;
            else if (controls.absent.checked) absent += 1;
        }
        this.setText("admin-attendance-editor-present", present);
        this.setText("admin-attendance-editor-absent", absent);
        this.setText(
            "admin-attendance-editor-unchecked",
            Math.max(0, this.attendanceEditorRows.size - present - absent)
        );
    }

    buildAttendanceEditorInput() {
        const data = {};
        const notes = {};
        for (const [studentId, controls] of this.attendanceEditorRows) {
            if (controls.present.checked) data[studentId] = "present";
            else if (controls.absent.checked) data[studentId] = "absent";
            const note = String(controls.note.value || "").trim();
            if (note) notes[studentId] = note;
        }
        return {
            date: this.attendanceEditor?.date,
            data,
            notes
        };
    }

    async saveAttendanceEditor(event) {
        event?.preventDefault?.();
        if (!this.attendanceEditor) return;
        this.setBusy(true);
        this.showError("");
        try {
            const result = await this.manager.saveAttendanceEditor(this.buildAttendanceEditorInput());
            this.closeAttendanceEditor();
            this.render(this.manager.current);
            const recovery = result?.stockQueued || result?.auditQueued
                ? " (บันทึกแล้วและเข้าคิวกู้คืน)"
                : "";
            this.setStatus(`บันทึกข้อมูลในหน้า Admin แล้ว${recovery}`);
        } catch (error) {
            this.showError(error?.message || "บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    closeAttendanceEditor() {
        this.attendanceEditor = null;
        this.attendanceEditorRows.clear();
        const panel = this.element("admin-attendance-editor");
        if (panel) panel.hidden = true;
        const list = this.element("admin-attendance-editor-list");
        list?.replaceChildren?.();
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
        this.document.querySelectorAll?.(
            "[data-admin-record-action], #admin-attendance-editor-form button, #admin-attendance-editor-form input"
        )?.forEach(element => {
            element.disabled = Boolean(busy);
        });
    }

    reset() {
        this.manager.clear?.();
        this.closeAttendanceEditor();
        this.setStatus("");
        this.showError("");
    }
}

window.AdminRoomView = new AdminRoomView();
