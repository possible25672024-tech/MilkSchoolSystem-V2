class AttendanceEvidenceView {
    constructor(
        manager = window.AttendanceEvidenceManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.initialized = false;
        this.bound = false;
        this.active = false;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handleDateChange = this.handleDateChange.bind(this);
        this.handleAttendanceLoaded = this.handleAttendanceLoaded.bind(this);
        this.handleAttendanceSaved = this.handleAttendanceSaved.bind(this);
        this.handleAttendanceDeleted = this.handleAttendanceDeleted.bind(this);
        this.handleFiles = this.handleFiles.bind(this);
        this.handlePhotoRemove = this.handlePhotoRemove.bind(this);
        this.handleSignatureCommit = this.handleSignatureCommit.bind(this);
        this.handleSignatureClear = this.handleSignatureClear.bind(this);
        this.handleLoadEvidence = this.handleLoadEvidence.bind(this);
    }

    ensureDependencies() {
        const required = ["setRecordContext", "addPhotos", "attachSignaturePad", "commitSignature", "buildLegacyEvidence"];
        const missing = required.find(method => typeof this.manager?.[method] !== "function");
        if (missing) throw new Error(`AttendanceEvidenceManager method ${missing} is not available.`);
        if (!this.authService?.getSession) throw new Error("AuthService is not available.");
    }

    async initialize() {
        if (this.initialized) return this.getState();
        this.ensureDependencies();
        this.ensureStyles();
        this.ensureStructure();
        this.bindEvents();
        this.manager.attachSignaturePad(this.element("attendance-signature-canvas"), {
            maxWidth: 640,
            maxHeight: 240
        });
        this.initialized = true;
        const session = this.authService.getSession();
        if (session?.role === "teacher") await this.activate(session);
        else this.hide();
        return this.getState();
    }

    ensureStyles() {
        if (this.element("attendance-evidence-style")) return;
        const style = this.document.createElement("style");
        style.id = "attendance-evidence-style";
        style.textContent = `
            .attendance-evidence{margin-top:18px;border:1px solid #dbe5ef;border-radius:14px;padding:16px;background:#f8fafc}
            .attendance-evidence h4{margin:0;color:#1a5276}.attendance-evidence-intro{margin:5px 0 14px;color:#64748b;font-size:.86rem}
            .attendance-evidence-grid{display:grid;grid-template-columns:minmax(240px,1fr) minmax(280px,1fr);gap:16px}
            .attendance-evidence-box{min-width:0;border:1px solid #dbe5ef;border-radius:12px;padding:13px;background:#fff}
            .attendance-evidence-box h5{margin:0 0 9px}.attendance-evidence-controls{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
            .attendance-evidence-controls button{width:auto;margin:0}.attendance-evidence-controls input[type=file]{min-width:0}
            .attendance-photo-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:9px;margin-top:12px}
            .attendance-photo-card{position:relative;min-height:90px;border:1px solid #cbd5e1;border-radius:10px;overflow:hidden;background:#eef2f7}
            .attendance-photo-card img{display:block;width:100%;height:90px;object-fit:cover}.attendance-photo-card span{display:grid;place-items:center;height:90px;padding:6px;color:#64748b;font-size:.76rem;text-align:center}
            .attendance-photo-card button{position:absolute;top:5px;right:5px;width:auto;margin:0;padding:4px 7px;border-radius:999px;background:#fff;color:#991b1b;font-size:.72rem}
            #attendance-signature-canvas{display:block;width:100%;height:140px;border:1px dashed #94a3b8;border-radius:10px;background:#fff;touch-action:none}
            .attendance-evidence-status{margin:10px 0 0;font-size:.84rem}.attendance-evidence-status[data-state=success]{color:#166534}.attendance-evidence-status[data-state=warning]{color:#9a3412}.attendance-evidence-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.attendance-evidence-grid{grid-template-columns:1fr}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.element("attendance-evidence-panel")) return;
        const form = this.element("attendance-form");
        const status = this.element("attendance-status");
        if (!form || !status) throw new Error("Attendance form is not available for evidence integration.");
        const panel = this.document.createElement("section");
        panel.id = "attendance-evidence-panel";
        panel.className = "attendance-evidence";
        panel.hidden = true;
        panel.innerHTML = `
            <h4>หลักฐานเช็กดื่มนมรายวัน</h4>
            <p class="attendance-evidence-intro">รูปสูงสุด 5 รูป และลายเซ็นครูประจำชั้น เก็บแบบ Lazy Payload ก่อนบันทึกลง Record เดิม</p>
            <div class="attendance-evidence-grid">
                <div class="attendance-evidence-box">
                    <h5>รูปถ่ายประจำวัน</h5>
                    <div class="attendance-evidence-controls">
                        <input id="attendance-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple>
                        <button id="attendance-evidence-load-button" type="button" class="secondary">โหลดหลักฐานเดิม</button>
                    </div>
                    <p id="attendance-photo-count" class="attendance-evidence-status" data-state="idle">0 / 5 รูป</p>
                    <div id="attendance-photo-list" class="attendance-photo-list"></div>
                </div>
                <div class="attendance-evidence-box">
                    <h5>ลายเซ็นครู</h5>
                    <canvas id="attendance-signature-canvas" aria-label="พื้นที่ลายเซ็นครู"></canvas>
                    <div class="attendance-evidence-controls" style="margin-top:9px">
                        <button id="attendance-signature-use-button" type="button">ใช้ลายเซ็นนี้</button>
                        <button id="attendance-signature-clear-button" type="button" class="secondary">ล้างลายเซ็น</button>
                    </div>
                    <p id="attendance-signature-status" class="attendance-evidence-status" data-state="idle">ยังไม่มีลายเซ็นที่ยืนยัน</p>
                </div>
            </div>
            <p id="attendance-evidence-status" class="attendance-evidence-status" data-state="idle" aria-live="polite"></p>
        `;
        form.insertBefore?.(panel, status);
    }

    bindEvents() {
        if (this.bound) return;
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:attendance-day-loaded", this.handleAttendanceLoaded);
        this.eventTarget.addEventListener?.("milkapp:attendance-saved", this.handleAttendanceSaved);
        this.eventTarget.addEventListener?.("milkapp:attendance-audit-queued", this.handleAttendanceSaved);
        this.eventTarget.addEventListener?.("milkapp:attendance-stock-queued", this.handleAttendanceSaved);
        this.eventTarget.addEventListener?.("milkapp:attendance-deleted", this.handleAttendanceDeleted);
        this.element("attendance-date")?.addEventListener?.("change", this.handleDateChange);
        this.element("attendance-photo-input")?.addEventListener?.("change", this.handleFiles);
        this.element("attendance-photo-list")?.addEventListener?.("click", this.handlePhotoRemove);
        this.element("attendance-signature-use-button")?.addEventListener?.("click", this.handleSignatureCommit);
        this.element("attendance-signature-clear-button")?.addEventListener?.("click", this.handleSignatureClear);
        this.element("attendance-evidence-load-button")?.addEventListener?.("click", this.handleLoadEvidence);
        this.bound = true;
    }

    async handleLoginSuccess(event) {
        const session = event?.detail?.session;
        if (session?.role === "teacher") await this.activate(session);
        else this.hide();
    }

    async handleLogout() {
        await this.manager.clear?.();
        this.hide();
    }

    async activate(session) {
        this.active = true;
        this.element("attendance-evidence-panel")?.removeAttribute?.("hidden");
        const date = this.selectedDate();
        if (date) await this.manager.setRecordContext({ roomId: session.roomId || session.classId, date, record: null });
        await this.render(false);
    }

    hide() {
        this.active = false;
        const panel = this.element("attendance-evidence-panel");
        if (panel) panel.hidden = true;
    }

    async handleDateChange() {
        if (!this.active) return;
        const session = this.authService.getSession();
        const date = this.selectedDate();
        if (!date || session?.role !== "teacher") return;
        await this.manager.setRecordContext({ roomId: session.roomId || session.classId, date, record: null });
        await this.render(false);
    }

    async handleAttendanceLoaded(event) {
        if (!this.active) return;
        const session = this.authService.getSession();
        const record = event?.detail?.record || null;
        const date = String(event?.detail?.date || record?.date || this.selectedDate());
        await this.manager.setRecordContext({ roomId: session.roomId || session.classId, date, record });
        await this.render(false);
    }

    async handleAttendanceSaved(event) {
        const record = event?.detail?.record;
        if (record) await this.manager.acceptSavedRecord(record);
        await this.render(false);
    }

    async handleAttendanceDeleted(event) {
        const deletedKey = String(
            event?.detail?.key ||
            `${event?.detail?.deletedRecord?.clsId || ""}_${event?.detail?.deletedRecord?.date || ""}`
        );
        if (deletedKey && this.manager.getState?.().recordKey !== deletedKey) {
            return;
        }
        await this.manager.cleanupDeletedRecord();
        const session = this.authService.getSession();
        const date = this.selectedDate();
        if (session?.role === "teacher" && date) {
            await this.manager.setRecordContext({ roomId: session.roomId || session.classId, date, record: null });
        }
        await this.render(false);
    }

    async handleFiles(event) {
        try {
            const files = event?.target?.files || [];
            if (!files.length) return;
            this.setStatus("กำลังย่อและจัดเก็บรูปแบบ Lazy Payload...", "idle");
            await this.manager.addPhotos(files);
            event.target.value = "";
            await this.render(false);
            this.setStatus("เพิ่มรูปถ่ายแล้ว โดยยังไม่มีการเขียน Firebase", "success");
        } catch (error) {
            this.setStatus(error?.message || "ไม่สามารถเพิ่มรูปถ่ายได้", "error");
        }
    }

    async handlePhotoRemove(event) {
        const button = event?.target?.closest?.("[data-attendance-photo-remove]");
        if (!button) return;
        await this.manager.removePhoto(Number(button.dataset.attendancePhotoRemove));
        await this.render(false);
        this.setStatus("นำรูปออกจากร่างแล้ว", "success");
    }

    async handleSignatureCommit() {
        try {
            await this.manager.commitSignature();
            await this.render(false);
            this.setStatus("ยืนยันลายเซ็นครูในร่างแล้ว โดยยังไม่มีการเขียน Firebase", "success");
        } catch (error) {
            this.setStatus(error?.message || "ไม่สามารถยืนยันลายเซ็นได้", "error");
        }
    }

    async handleSignatureClear() {
        await this.manager.clearSignature();
        await this.render(false);
        this.setStatus("ล้างลายเซ็นออกจากร่างแล้ว", "success");
    }

    async handleLoadEvidence() {
        await this.render(true);
        this.setStatus("โหลดเฉพาะหลักฐานของวันที่เลือกแล้ว", "success");
    }

    async render(hydrate) {
        const state = this.manager.getState();
        this.setText("attendance-photo-count", `${state.photoCount} / 5 รูป`);
        this.setText("attendance-signature-status", state.signaturePresent ? "มีลายเซ็นครูพร้อมบันทึก" : "ยังไม่มีลายเซ็นที่ยืนยัน");
        this.element("attendance-signature-status").dataset.state = state.signaturePresent ? "success" : "idle";
        const previews = await this.manager.getPhotoPreviews({ hydrate });
        const list = this.element("attendance-photo-list");
        if (!list) return;
        if (!previews.length) {
            list.innerHTML = '<p class="attendance-evidence-status">ยังไม่มีรูปถ่าย</p>';
            return;
        }
        list.innerHTML = previews.map((preview, index) => `
            <article class="attendance-photo-card">
                ${preview.dataUrl ? `<img src="${this.escape(preview.dataUrl)}" alt="รูปหลักฐาน ${index + 1}">` : `<span>รูป ${index + 1}<br>กดโหลดหลักฐานเดิม</span>`}
                <button type="button" data-attendance-photo-remove="${index}">นำออก</button>
            </article>
        `).join("");
    }

    selectedDate() {
        const value = String(this.element("attendance-date")?.value || "").trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
    }

    setStatus(message, state = "idle") {
        const target = this.element("attendance-evidence-status");
        if (!target) return;
        target.textContent = String(message || "");
        target.dataset.state = state;
    }

    setText(id, value) {
        const target = this.element(id);
        if (target) target.textContent = String(value ?? "");
    }

    element(id) {
        return this.document?.getElementById?.(id) || null;
    }

    escape(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    getState() {
        return { initialized: this.initialized, active: this.active, evidence: this.manager.getState?.() || null };
    }
}

window.AttendanceEvidenceViewClass = AttendanceEvidenceView;
window.AttendanceEvidenceView = new AttendanceEvidenceView();
