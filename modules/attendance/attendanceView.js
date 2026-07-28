class AttendanceView {
    constructor(
        attendanceManager = window.AttendanceManager,
        teacherManager = window.TeacherManager,
        authService = window.AuthService,
        syncManager = window.SyncManager,
        options = {}
    ) {
        this.attendanceManager = attendanceManager;
        this.teacherManager = teacherManager;
        this.authService = authService;
        this.syncManager = syncManager;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.today = options.today || (() => {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        });

        this.initialized = false;
        this.bound = false;
        this.activeSession = null;
        this.snapshot = null;
        this.currentRecord = null;
        this.rows = new Map();

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleTeacherRefreshed = this.handleTeacherRefreshed.bind(this);
        this.handleAttendanceEvent = this.handleAttendanceEvent.bind(this);
        this.handleLoadClick = this.handleLoadClick.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDeleteClick = this.handleDeleteClick.bind(this);
    }

    ensureDependencies() {
        if (!this.attendanceManager) {
            this.attendanceManager = window.AttendanceManager;
        }
        if (!this.teacherManager) {
            this.teacherManager = window.TeacherManager;
        }
        if (!this.authService) {
            this.authService = window.AuthService;
        }
        if (!this.syncManager) {
            this.syncManager = window.SyncManager;
        }

        if (!this.attendanceManager?.loadDay || !this.attendanceManager?.save || !this.attendanceManager?.remove) {
            throw new Error("AttendanceManager is not available.");
        }
        if (!this.teacherManager?.getSnapshot || !this.teacherManager?.refresh) {
            throw new Error("TeacherManager is not available.");
        }
        if (!this.authService?.getSession) {
            throw new Error("AuthService is not available.");
        }
    }

    async initialize() {
        if (this.initialized) {
            return this.getState();
        }

        this.ensureDependencies();
        this.bindEvents();
        this.initialized = true;

        const dateInput = this.element("attendance-date");
        if (dateInput && !dateInput.value) {
            dateInput.value = this.today();
        }

        const session = this.authService.getSession();
        if (session?.role === "teacher") {
            this.activate(session);
        } else {
            this.clear();
        }

        return this.getState();
    }

    bindEvents() {
        if (this.bound) {
            return;
        }

        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:teacher-refreshed", this.handleTeacherRefreshed);
        this.eventTarget.addEventListener?.("milkapp:attendance-day-loaded", this.handleAttendanceEvent);
        this.eventTarget.addEventListener?.("milkapp:attendance-saved", this.handleAttendanceEvent);
        this.eventTarget.addEventListener?.("milkapp:attendance-deleted", this.handleAttendanceEvent);
        this.eventTarget.addEventListener?.("milkapp:attendance-stock-queued", this.handleAttendanceEvent);
        this.eventTarget.addEventListener?.("milkapp:attendance-audit-queued", this.handleAttendanceEvent);
        this.element("attendance-load-button")?.addEventListener?.("click", this.handleLoadClick);
        this.element("attendance-form")?.addEventListener?.("submit", this.handleSubmit);
        this.element("attendance-delete-button")?.addEventListener?.("click", this.handleDeleteClick);

        this.bound = true;
    }

    handleLoginSuccess(event) {
        const session = event?.detail?.session;
        if (session?.role === "teacher") {
            this.activate(session);
        } else {
            this.clear();
        }
    }

    handleLogout() {
        this.clear();
    }

    handleTeacherRefreshed() {
        if (this.activeSession?.role !== "teacher") {
            return;
        }

        this.snapshot = this.teacherManager.getSnapshot() || this.snapshot;
        this.renderStudents(this.currentRecord);
    }

    handleAttendanceEvent(event) {
        if (this.activeSession?.role !== "teacher") {
            return;
        }

        const detail = event?.detail || {};
        if (event.type === "milkapp:attendance-day-loaded") {
            this.currentRecord = detail.record || null;
            this.renderStudents(this.currentRecord);
            this.renderLoadStatus(this.currentRecord);
            return;
        }

        if (event.type === "milkapp:attendance-deleted") {
            this.currentRecord = null;
            this.renderStudents(null);
            this.renderMutationStatus(detail, "delete");
            return;
        }

        if (detail.record) {
            this.currentRecord = detail.record;
            this.renderStudents(this.currentRecord);
        }
        this.renderMutationStatus(detail, detail.attendanceDeleted ? "delete" : "save");
    }

    handleLoadClick() {
        this.loadSelectedDay().catch(error => this.renderError(error));
    }

    handleSubmit(event) {
        event?.preventDefault?.();
        this.saveCurrentDay().catch(error => this.renderError(error));
    }

    handleDeleteClick() {
        this.deleteCurrentDay().catch(error => this.renderError(error));
    }

    activate(session) {
        if (session?.role !== "teacher") {
            this.clear();
            return;
        }

        this.activeSession = { ...session };
        this.snapshot = this.teacherManager.getSnapshot() || null;
        this.currentRecord = null;
        this.element("attendance-panel")?.removeAttribute?.("hidden");
        const dateInput = this.element("attendance-date");
        if (dateInput && !dateInput.value) {
            dateInput.value = this.today();
        }
        this.renderStudents(null);
        this.renderTotals();
        this.setStatus("เลือกวันที่แล้วกด “โหลดข้อมูล” เพื่อเริ่มเช็กดื่มนมรายวัน", "idle");
        this.clearError();
    }

    async loadSelectedDay() {
        this.requireTeacherSession();
        const date = this.selectedDate();
        this.setBusy(true, "กำลังโหลดข้อมูลวันที่เลือก...");
        this.clearError();

        try {
            const record = await this.attendanceManager.loadDay(date);
            this.currentRecord = record || null;
            this.renderStudents(this.currentRecord);
            this.renderLoadStatus(this.currentRecord);
            return this.currentRecord;
        } finally {
            this.setBusy(false);
        }
    }

    async saveCurrentDay() {
        this.requireTeacherSession();
        if (!this.snapshot) {
            throw new Error("ข้อมูลห้องเรียนยังไม่พร้อม กรุณารอแล้วลองใหม่อีกครั้ง");
        }

        const input = this.buildSaveInput();
        this.setBusy(true, "กำลังบันทึกข้อมูลการมาเรียน...");
        this.clearError();

        try {
            const result = await this.attendanceManager.save(input);
            if (result?.record) {
                this.currentRecord = result.record;
                this.renderStudents(this.currentRecord);
            }
            this.renderMutationStatus(result, "save");
            await this.refreshTeacherState(input.date);
            return result;
        } finally {
            this.setBusy(false);
        }
    }

    async deleteCurrentDay() {
        this.requireTeacherSession();
        const date = this.selectedDate();
        if (!this.currentRecord) {
            throw new Error("วันที่เลือกยังไม่มีข้อมูลให้ลบ");
        }
        if (!this.confirm(`ยืนยันการลบข้อมูลเช็กดื่มนมวันที่ ${date} และคืนสต็อกตามข้อมูลเดิมหรือไม่`)) {
            return null;
        }

        this.setBusy(true, "กำลังลบข้อมูลและคืนสต็อก...");
        this.clearError();

        try {
            const result = await this.attendanceManager.remove({
                roomId: this.activeSession.roomId || this.activeSession.classId,
                date
            });
            this.currentRecord = null;
            this.renderStudents(null);
            this.renderMutationStatus(result, "delete");
            await this.refreshTeacherState(date);
            return result;
        } finally {
            this.setBusy(false);
        }
    }

    async refreshTeacherState(date) {
        try {
            await this.teacherManager.refresh({ attendanceDate: date });
        } catch (error) {
            this.setStatus("บันทึกข้อมูลแล้ว แต่ยังอัปเดตยอดบนหัวหน้าครูไม่สำเร็จ", "warning");
        }
    }

    buildSaveInput() {
        const date = this.selectedDate();
        const session = this.activeSession || {};
        const snapshot = this.snapshot || {};
        const settings = snapshot.settings || {};
        const room = snapshot.room || {};
        const data = {};
        const notes = {};

        for (const [studentId, controls] of this.rows) {
            if (controls.present.checked) {
                data[studentId] = "present";
            } else if (controls.absent.checked) {
                data[studentId] = "absent";
            }

            const note = String(controls.note.value || "").trim();
            if (note) {
                notes[studentId] = note;
            }
        }

        return {
            roomId: session.roomId || session.classId,
            roomName: session.roomName || room.name,
            date,
            year: this.currentRecord?.year ?? settings.year ?? settings.academicYear ?? "",
            term: this.currentRecord?.term ?? settings.term ?? "",
            teacher: session.teacher || room.teacher,
            data,
            notes,
            photos: Array.isArray(this.currentRecord?.photos) ? [...this.currentRecord.photos] : [],
            signature: String(this.currentRecord?.signature || ""),
            savedAt: this.currentRecord?.savedAt || undefined
        };
    }

    renderStudents(record = null) {
        const container = this.element("attendance-student-list");
        if (!container) {
            return;
        }

        container.replaceChildren?.();
        if (!container.replaceChildren) {
            container.textContent = "";
        }
        this.rows.clear();

        const students = this.snapshot?.students || this.snapshot?.room?.students || [];
        if (!students.length) {
            const empty = this.createElement("p", "attendance-empty", "ไม่พบรายชื่อนักเรียนในห้องที่เข้าสู่ระบบ");
            container.append?.(empty);
            this.renderTotals();
            this.updateActionState();
            return;
        }

        students.forEach((student, index) => {
            const studentId = String(student.id || `student_${index + 1}`);
            const row = this.createElement("article", "attendance-student-row");
            row.dataset.studentId = studentId;

            const identity = this.createElement("div", "attendance-student-identity");
            identity.append?.(
                this.createElement("span", "attendance-student-number", String(student.num || index + 1)),
                this.createElement("strong", "attendance-student-name", student.name || `นักเรียนคนที่ ${index + 1}`),
                this.createElement("span", "attendance-student-meta", student.gender || "")
            );

            const choices = this.createElement("div", "attendance-choices");
            const present = this.createChoice(studentId, index, "present", "มาเรียน");
            const absent = this.createChoice(studentId, index, "absent", "ขาดเรียน");
            choices.append?.(present.label, absent.label);

            const note = this.document.createElement("input");
            note.type = "text";
            note.className = "attendance-note";
            note.placeholder = "หมายเหตุรายคน (ไม่บังคับ)";
            note.setAttribute?.("aria-label", `หมายเหตุ ${student.name || studentId}`);

            const status = String(record?.data?.[studentId] || "").toLowerCase();
            present.input.checked = status === "present";
            absent.input.checked = status === "absent";
            note.value = String(record?.notes?.[studentId] || "");

            present.input.addEventListener?.("change", () => this.renderTotals());
            absent.input.addEventListener?.("change", () => this.renderTotals());

            row.append?.(identity, choices, note);
            container.append?.(row);
            this.rows.set(studentId, {
                row,
                present: present.input,
                absent: absent.input,
                note
            });
        });

        this.renderTotals();
        this.updateActionState();
    }

    createChoice(studentId, index, value, labelText) {
        const label = this.createElement("label", `attendance-choice attendance-choice-${value}`);
        const input = this.document.createElement("input");
        input.type = "radio";
        input.name = `attendance-status-${index}`;
        input.value = value;
        input.dataset.studentId = studentId;
        input.dataset.status = value;
        label.append?.(input, this.document.createTextNode?.(labelText) || this.createElement("span", "", labelText));
        return { label, input };
    }

    renderTotals() {
        const total = this.rows.size;
        let present = 0;
        let absent = 0;

        for (const controls of this.rows.values()) {
            if (controls.present.checked) {
                present += 1;
            } else if (controls.absent.checked) {
                absent += 1;
            }
        }

        const checked = present + absent;
        this.setText("attendance-total-students", this.formatNumber(total));
        this.setText("attendance-total-checked", this.formatNumber(checked));
        this.setText("attendance-total-present", this.formatNumber(present));
        this.setText("attendance-total-absent", this.formatNumber(absent));
        this.setText("attendance-total-unchecked", this.formatNumber(Math.max(0, total - checked)));

        return { total, checked, present, absent, unchecked: Math.max(0, total - checked) };
    }

    renderLoadStatus(record) {
        this.updateActionState();
        if (record) {
            const totals = this.renderTotals();
            this.setStatus(
                `โหลดข้อมูลวันที่ ${record.date || this.selectedDate()} แล้ว: มาเรียน ${totals.present} คน ขาดเรียน ${totals.absent} คน`,
                "success"
            );
        } else {
            this.setStatus(`วันที่ ${this.selectedDate()} ยังไม่มีข้อมูล สามารถเริ่มบันทึกใหม่ได้`, "idle");
        }
    }

    renderMutationStatus(result = {}, operation = "save") {
        this.updateActionState();
        if (result.stockQueued) {
            this.setStatus(
                operation === "delete"
                    ? "ลบข้อมูลแล้ว และรอซิงก์การคืนสต็อกในคิวถาวร"
                    : "บันทึกข้อมูลการมาเรียนแล้ว และรอซิงก์การปรับสต็อกในคิวถาวร",
                "warning"
            );
            return;
        }
        if (result.auditQueued) {
            this.setStatus("ปรับสต็อกสำเร็จแล้ว และรอซิงก์บันทึกตรวจสอบ", "warning");
            return;
        }

        const before = result.roomStockBefore;
        const after = result.roomStockAfter;
        const stockText = before === null || before === undefined || after === null || after === undefined
            ? "ยอดสต็อกไม่เปลี่ยน"
            : `สต็อกห้อง ${this.formatNumber(before)} → ${this.formatNumber(after)} กล่อง`;
        const conflictText = Number(result.stockConflictCount) > 0
            ? ` · แก้ความขัดแย้ง ${this.formatNumber(result.stockConflictCount)} ครั้ง`
            : "";

        if (operation === "delete") {
            this.setStatus(
                `ลบข้อมูลสำเร็จ คืน ${this.formatNumber(result.restoredQuantity || 0)} กล่อง · ${stockText}${conflictText}`,
                "success"
            );
        } else {
            this.setStatus(
                `บันทึกสำเร็จ: มาเรียน ${this.formatNumber(result.present || 0)} คน ขาดเรียน ${this.formatNumber(result.absent || 0)} คน · ${stockText}${conflictText}`,
                "success"
            );
        }
    }

    updateActionState() {
        const saveButton = this.element("attendance-save-button");
        const deleteButton = this.element("attendance-delete-button");
        if (saveButton) {
            saveButton.disabled = !this.activeSession || this.rows.size === 0;
        }
        if (deleteButton) {
            deleteButton.disabled = !this.currentRecord;
        }
    }

    setBusy(isBusy, message = "") {
        const panel = this.element("attendance-panel");
        panel?.setAttribute?.("aria-busy", String(Boolean(isBusy)));
        for (const id of ["attendance-load-button", "attendance-save-button", "attendance-delete-button"]) {
            const button = this.element(id);
            if (button) {
                button.disabled = Boolean(isBusy) || (id === "attendance-delete-button" && !this.currentRecord);
            }
        }
        if (isBusy && message) {
            this.setStatus(message, "loading");
        }
    }

    setStatus(message, state = "idle") {
        const element = this.element("attendance-status");
        if (element) {
            element.textContent = String(message || "");
            element.dataset.state = state;
        }
    }

    renderError(error) {
        const element = this.element("attendance-error");
        if (element) {
            element.textContent = error?.message || "ไม่สามารถดำเนินการข้อมูลการมาเรียนได้";
            element.hidden = false;
        }
        this.setStatus("ดำเนินการไม่สำเร็จ", "error");
        this.setBusy(false);
    }

    clearError() {
        const element = this.element("attendance-error");
        if (element) {
            element.textContent = "";
            element.hidden = true;
        }
    }

    clear() {
        this.activeSession = null;
        this.snapshot = null;
        this.currentRecord = null;
        this.rows.clear();
        this.element("attendance-panel")?.setAttribute?.("hidden", "");
        const container = this.element("attendance-student-list");
        container?.replaceChildren?.();
        if (container && !container.replaceChildren) {
            container.textContent = "";
        }
        const dateInput = this.element("attendance-date");
        if (dateInput) {
            dateInput.value = this.today();
        }
        for (const id of [
            "attendance-total-students",
            "attendance-total-checked",
            "attendance-total-present",
            "attendance-total-absent",
            "attendance-total-unchecked"
        ]) {
            this.setText(id, "0");
        }
        this.setStatus("", "idle");
        this.clearError();
        this.updateActionState();
    }

    requireTeacherSession() {
        if (this.activeSession?.role !== "teacher") {
            throw new Error("ต้องเข้าสู่ระบบครูประจำชั้นก่อนใช้งานข้อมูลการมาเรียน");
        }
        return this.activeSession;
    }

    selectedDate() {
        const date = String(this.element("attendance-date")?.value || "").trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            throw new Error("กรุณาเลือกวันที่ในรูปแบบ YYYY-MM-DD");
        }
        return date;
    }

    createElement(tagName, className = "", text = "") {
        const element = this.document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (text !== "") {
            element.textContent = String(text);
        }
        return element;
    }

    formatNumber(value) {
        const number = Number(value);
        return Number.isFinite(number)
            ? new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(number)
            : "—";
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) {
            element.textContent = String(value ?? "");
        }
    }

    element(id) {
        return this.document?.getElementById?.(id) || null;
    }

    getState() {
        return {
            active: this.activeSession?.role === "teacher",
            date: this.element("attendance-date")?.value || "",
            studentCount: this.rows.size,
            hasRecord: Boolean(this.currentRecord),
            queueCount: Number(this.syncManager?.getStatus?.()?.queueCount) || 0
        };
    }
}

window.AttendanceView = new AttendanceView();
