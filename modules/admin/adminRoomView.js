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
        this.activeSection = "system-dashboard";
        this.attendanceEditor = null;
        this.attendanceEditorRows = new Map();
        this.recordDetail = null;
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
        this.element("admin-record-detail-close")?.addEventListener("click", () => {
            this.closeRecordDetail();
        });
        this.document.querySelectorAll?.("[data-admin-menu]")?.forEach(button => {
            button.addEventListener("click", () => this.openAdminMenu(button.dataset.adminMenu));
        });
        this.document.querySelectorAll?.("[data-admin-record-body]")?.forEach(body => {
            body.addEventListener("click", event => this.handleRecordAction(event));
        });
        this.window.addEventListener?.("milkapp:login-success", event => this.handleSession(event?.detail?.session));
        ["milkapp:rooms-imported", "milkapp:room-created", "milkapp:room-updated", "milkapp:room-deleted"]
            .forEach(eventName => {
                this.window.addEventListener?.(eventName, () => {
                    if (this.authService?.getSession?.()?.role === "admin") {
                        this.loadRooms(true);
                    }
                });
            });
        this.window.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    async handleSession(session) {
        if (session?.role !== "admin") return;
        this.showSection(this.activeSection);
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
        this.closeRecordDetail();
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังโหลดข้อมูลห้อง...");
        try {
            const current = await this.manager.selectRoom(roomId);
            const select = this.element("admin-room-select");
            if (select) select.value = this.manager.selectedRoomId;
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
        this.closeRecordDetail();
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

    async openAdminMenu(section) {
        const teacherSection = {
            pending: "pending",
            retroactive: "retroactive",
            vacation: "vacation"
        }[String(section || "")];
        if (!teacherSection) {
            this.showSection(section);
            return;
        }
        this.setBusy(true);
        this.showError("");
        this.setStatus("กำลังเปิดหน้าครูของห้องที่เลือก...");
        try {
            await this.manager.enterSelectedRoom({ teacherSection });
        } catch (error) {
            this.showError(error?.message || "เปิดหน้าครูของห้องที่เลือกไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
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
            await this.openRecordDetail(type, input);
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

    async openRecordDetail(type, input = {}) {
        this.closeAttendanceEditor();
        this.setBusy(true);
        this.showError("");
        try {
            const detail = await this.manager.loadRecordDetail(type, input);
            this.renderRecordDetail(detail);
            this.setStatus(`แสดงข้อมูลที่บันทึกไว้ทั้งรายการ ${this.typeLabel(type)}`);
        } catch (error) {
            this.showError(error?.message || "เปิดรายละเอียดรายการไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    renderRecordDetail(detail) {
        this.recordDetail = detail;
        const record = detail?.record || {};
        this.setText("admin-record-detail-title", this.typeLabel(detail?.type));
        this.setText(
            "admin-record-detail-subtitle",
            `${record.roomName || detail?.room?.name || "—"} · ${record.teacher || detail?.room?.teacher || "—"}`
        );
        this.renderRecordDetailFacts(detail);
        this.renderRecordDetailSummary(detail);
        this.renderRecordDetailStudents(detail);
        this.renderRecordDetailEvidence(detail);
        const panel = this.element("admin-record-detail");
        panel?.removeAttribute("hidden");
        panel?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    }

    renderRecordDetailFacts(detail) {
        const record = detail?.record || {};
        const facts = [
            ["ห้องเรียน", record.roomName || detail?.room?.name || "—"],
            ["ครูประจำชั้น", record.teacher || detail?.room?.teacher || "—"],
            ["วันที่/ช่วงที่บันทึก", this.recordPeriod(detail)],
            ["รหัสรายการ", detail?.id || "—"],
            ["บันทึกล่าสุด", this.formatDateTime(record.savedAt)]
        ];
        const container = this.element("admin-record-detail-facts");
        if (!container) return;
        container.replaceChildren(...facts.map(([label, value]) => {
            const item = this.document.createElement("article");
            item.className = "admin-record-detail-fact";
            const name = this.document.createElement("span");
            name.textContent = label;
            const text = this.document.createElement("strong");
            text.textContent = String(value || "—");
            item.append(name, text);
            return item;
        }));
    }

    renderRecordDetailSummary(detail) {
        const record = detail?.record || {};
        const type = detail?.type;
        const data = record.data && typeof record.data === "object" ? record.data : {};
        const roster = Array.isArray(detail?.students) ? detail.students : [];
        const rosterIds = roster.map((student, index) => this.studentId(student, index));
        const statusValues = rosterIds.length
            ? rosterIds.map(studentId => data[studentId]).filter(Boolean)
            : Object.entries(data)
                .filter(([studentId]) => !this.isGeneratedStudentId(studentId))
                .map(([, value]) => value);
        const checkedCount = statusValues.filter(
            value => value === "present" || value === "absent"
        ).length;
        const summaries = type === "attendance"
            ? [
                ["ดื่มนม", statusValues.filter(value => value === "present").length, "คน"],
                ["ไม่ดื่มนม", statusValues.filter(value => value === "absent").length, "คน"],
                ["ยังไม่ตรวจ", Math.max(0, roster.length - checkedCount), "คน"],
                ["ปี/ภาคเรียน", `${record.year || "—"} / ${record.term || "—"}`, ""]
            ]
            : [
                ["นักเรียน", record.studentCount ?? Object.keys(record.students || {}).length, "คน"],
                ["จำนวนวัน", record.days ?? this.pendingDayCount(record), "วัน"],
                ["จ่ายนม", record.totalBoxes ?? 0, "กล่อง"],
                ["หมายเหตุ", record.note || "—", ""]
            ];
        const container = this.element("admin-record-detail-summary");
        if (!container) return;
        container.replaceChildren(...summaries.map(([label, value, suffix]) => {
            const item = this.document.createElement("article");
            item.className = "admin-record-detail-metric";
            const name = this.document.createElement("span");
            name.textContent = label;
            const text = this.document.createElement("strong");
            text.textContent = `${value ?? "—"}${suffix ? ` ${suffix}` : ""}`;
            item.append(name, text);
            return item;
        }));
    }

    renderRecordDetailStudents(detail) {
        const container = this.element("admin-record-detail-students");
        const heading = this.element("admin-record-detail-students-heading");
        if (!container || !heading) return;
        const record = detail?.record || {};
        const roster = Array.isArray(detail?.students) ? detail.students : [];
        const rosterMap = new Map(roster.map((student, index) => [
            this.studentId(student, index),
            { ...student, _index: index }
        ]));
        let rows = [];

        if (detail?.type === "attendance") {
            const data = record.data && typeof record.data === "object" ? record.data : {};
            const notes = record.notes && typeof record.notes === "object" ? record.notes : {};
            const ids = rosterMap.size
                ? [...rosterMap.keys()]
                : Object.keys(data).filter(studentId => !this.isGeneratedStudentId(studentId));
            rows = ids.map((studentId, index) => {
                const student = rosterMap.get(studentId) || {};
                return {
                    studentId,
                    number: student.num || student.number || student._index + 1 || index + 1,
                    name: student.name || student.fullName || studentId,
                    status: data[studentId] === "present"
                        ? "ดื่มนม"
                        : data[studentId] === "absent" ? "ไม่ดื่มนม" : "ยังไม่ตรวจ",
                    statusClass: data[studentId] === "present"
                        ? "present"
                        : data[studentId] === "absent" ? "absent" : "unchecked",
                    note: notes[studentId] || ""
                };
            });
            heading.textContent = "รายชื่อนักเรียนและผลการเช็กที่บันทึก";
        } else if (detail?.type === "pending") {
            rows = Object.entries(record.students || {}).map(([studentId, saved], index) => ({
                studentId,
                number: rosterMap.get(studentId)?.num || index + 1,
                name: saved?.name || rosterMap.get(studentId)?.name || studentId,
                status: `${Array.isArray(saved?.days) ? saved.days.length : 0} กล่อง`,
                statusClass: "present",
                note: Array.isArray(saved?.days) ? saved.days.join(", ") : ""
            }));
            heading.textContent = "นักเรียนและวันที่รับนมค้างที่บันทึก";
        } else {
            const signatures = record.signatures && typeof record.signatures === "object"
                ? record.signatures
                : {};
            const count = Math.max(0, Number(record.studentCount) || 0);
            const signedIds = Object.keys(signatures);
            const ids = [...new Set([
                ...signedIds,
                ...[...rosterMap.keys()].slice(0, Math.max(count, signedIds.length))
            ])];
            rows = ids.map((studentId, index) => {
                const student = rosterMap.get(studentId) || {};
                const signature = this.signatureValue(signatures[studentId]);
                return {
                    studentId,
                    number: student.num || student.number || student._index + 1 || index + 1,
                    name: student.name || student.fullName || studentId,
                    status: signature ? "มีลายเซ็นรับนม" : "ไม่มีลายเซ็น",
                    statusClass: signature ? "present" : "unchecked",
                    note: detail?.type === "retroactive"
                        ? `${record.retroStart || "—"} – ${record.retroEnd || "—"}`
                        : `${record.days || 0} วัน`
                };
            });
            heading.textContent = "รายชื่อนักเรียนตามห้องและลายเซ็นที่บันทึก";
        }

        container.replaceChildren(...rows.map(row => this.createRecordDetailStudent(row)));
        if (!rows.length) {
            const empty = this.document.createElement("p");
            empty.className = "admin-record-detail-empty";
            empty.textContent = "รายการเดิมไม่ได้เก็บรายชื่อนักเรียนแยกไว้";
            container.appendChild(empty);
        }
    }

    createRecordDetailStudent(row) {
        const item = this.document.createElement("article");
        item.className = "admin-record-detail-student";
        const number = this.document.createElement("span");
        number.className = "admin-record-detail-number";
        number.textContent = String(row.number || "—");
        const identity = this.document.createElement("div");
        const name = this.document.createElement("strong");
        name.textContent = String(row.name || row.studentId || "—");
        const note = this.document.createElement("small");
        note.textContent = String(row.note || "ไม่มีหมายเหตุ");
        identity.append(name, note);
        const status = this.document.createElement("span");
        status.className = `admin-record-detail-status ${row.statusClass || "unchecked"}`;
        status.textContent = String(row.status || "—");
        item.append(number, identity, status);
        return item;
    }

    renderRecordDetailEvidence(detail) {
        const record = detail?.record || {};
        const photos = Array.isArray(record.photos) ? record.photos : [];
        const photoContainer = this.element("admin-record-detail-photos");
        const signatureContainer = this.element("admin-record-detail-signatures");
        this.setText("admin-record-detail-photo-count", `${photos.length} รูป`);

        if (photoContainer) {
            const images = photos
                .map((photo, index) => this.createEvidenceImage(photo, `รูปหลักฐาน ${index + 1}`))
                .filter(Boolean);
            photoContainer.replaceChildren(...images);
            if (!images.length) this.appendEvidenceEmpty(photoContainer, "ไม่มีรูปหลักฐานในรายการนี้");
        }

        if (signatureContainer) {
            const signatures = [];
            if (this.signatureValue(record.signature)) {
                signatures.push(["ลายเซ็นครู", record.signature]);
            }
            Object.entries(record.signatures || {}).forEach(([studentId, value]) => {
                const student = (detail?.students || []).find(
                    (candidate, index) => this.studentId(candidate, index) === studentId
                );
                const label = value?.receiverName || student?.name || studentId;
                if (this.signatureValue(value)) signatures.push([label, value]);
            });
            signatureContainer.replaceChildren(...signatures.map(([label, value]) => {
                const item = this.document.createElement("article");
                item.className = "admin-record-detail-signature";
                const title = this.document.createElement("strong");
                title.textContent = String(label);
                const image = this.createEvidenceImage(
                    this.signatureValue(value),
                    `ลายเซ็น ${label}`
                );
                item.appendChild(title);
                if (image) item.appendChild(image);
                return item;
            }));
            if (!signatures.length) {
                this.appendEvidenceEmpty(signatureContainer, "ไม่มีลายเซ็นในรายการนี้");
            }
        }
    }

    createEvidenceImage(value, alt) {
        const source = this.safeImageSource(this.signatureValue(value) || value);
        if (!source) return null;
        const image = this.document.createElement("img");
        image.src = source;
        image.alt = alt;
        image.loading = "lazy";
        return image;
    }

    appendEvidenceEmpty(container, message) {
        const empty = this.document.createElement("p");
        empty.className = "admin-record-detail-empty";
        empty.textContent = message;
        container.appendChild(empty);
    }

    safeImageSource(value) {
        const source = typeof value === "string" ? value.trim() : "";
        return /^(data:image\/|blob:|https?:\/\/)/i.test(source) ? source : "";
    }

    signatureValue(value) {
        if (typeof value === "string") return value;
        if (!value || typeof value !== "object") return "";
        return String(value.sig || value.signature || value.dataUrl || "");
    }

    studentId(student = {}, index = 0) {
        return String(
            student["รหัส"] ||
            student["รหัสประจำตัว"] ||
            student.id ||
            student.studentId ||
            student.code ||
            `student_${index + 1}`
        );
    }

    isGeneratedStudentId(studentId) {
        return /^student_\d+$/i.test(String(studentId || "").trim());
    }

    pendingDayCount(record = {}) {
        const dates = new Set();
        Object.values(record.students || {}).forEach(student => {
            (student?.days || []).forEach(date => dates.add(String(date)));
        });
        return dates.size;
    }

    recordPeriod(detail) {
        const record = detail?.record || {};
        if (detail?.type === "attendance") return record.date || "—";
        if (detail?.type === "pending") {
            return `${record.weekStart || record.date || "—"} – ${record.weekEnd || "—"}`;
        }
        if (detail?.type === "retroactive") {
            return `${record.retroStart || "—"} – ${record.retroEnd || "—"} (จ่าย ${record.date || "—"})`;
        }
        if (detail?.type === "vacation") {
            return `ปี ${record.academicYear || "—"} ภาค ${record.semester || "—"} (จ่าย ${record.date || "—"})`;
        }
        return record.date || "—";
    }

    formatDateTime(value) {
        const date = new Date(value);
        return value && !Number.isNaN(date.getTime())
            ? date.toLocaleString("th-TH")
            : String(value || "—");
    }

    closeRecordDetail() {
        this.recordDetail = null;
        const panel = this.element("admin-record-detail");
        if (panel) panel.hidden = true;
        for (const id of [
            "admin-record-detail-facts",
            "admin-record-detail-summary",
            "admin-record-detail-students",
            "admin-record-detail-photos",
            "admin-record-detail-signatures"
        ]) {
            this.element(id)?.replaceChildren?.();
        }
    }

    async openAttendanceEditor(date) {
        this.closeRecordDetail();
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
            "[data-admin-record-action], #admin-attendance-editor-form button, #admin-attendance-editor-form input, #admin-record-detail-close"
        )?.forEach(element => {
            element.disabled = Boolean(busy);
        });
    }

    reset() {
        this.manager.clear?.();
        this.closeAttendanceEditor();
        this.closeRecordDetail();
        this.setStatus("");
        this.showError("");
    }
}

window.AdminRoomView = new AdminRoomView();
