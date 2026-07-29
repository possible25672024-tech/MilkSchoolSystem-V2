class VacationEvidenceView {
    constructor(
        manager = window.VacationEvidenceManager,
        authService = window.AuthService,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.document = options.document || window.document;
        this.eventTarget = options.eventTarget || window;
        this.initialized = false;
        this.active = false;

        this.handleLoginSuccess = this.handleLoginSuccess.bind(this);
        this.handleLogout = this.handleLogout.bind(this);
        this.handlePreviewChanged = this.handlePreviewChanged.bind(this);
        this.handleFiles = this.handleFiles.bind(this);
        this.handlePhotoRemove = this.handlePhotoRemove.bind(this);
        this.handleOwnerChange = this.handleOwnerChange.bind(this);
        this.handleSignatureCommit = this.handleSignatureCommit.bind(this);
        this.handleSignatureClear = this.handleSignatureClear.bind(this);
        this.handleLoadEvidence = this.handleLoadEvidence.bind(this);
    }

    ensureDependencies() {
        if (!this.manager?.setRecordContext || !this.manager?.commitActiveSignature) throw new Error("VacationEvidenceManager is not available.");
        if (!this.authService?.getSession) throw new Error("AuthService is not available.");
    }

    async initialize() {
        if (this.initialized) return this.getState();
        this.ensureDependencies();
        this.ensureStyles();
        this.ensureStructure();
        this.bindEvents();
        this.initialized = true;
        const session = this.authService.getSession();
        if (session?.role === "teacher") this.activate();
        else await this.clear();
        return this.getState();
    }

    ensureStyles() {
        if (this.document.getElementById("vacation-evidence-style")) return;
        const style = this.document.createElement("style");
        style.id = "vacation-evidence-style";
        style.textContent = `
            .vacation-evidence-panel{margin-top:16px;border:1px solid #bbf7d0;border-radius:14px;padding:16px;background:#f0fdf4}
            .vacation-evidence-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
            .vacation-evidence-photo-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
            .vacation-evidence-photo{border:1px solid #bbf7d0;border-radius:10px;padding:8px;background:#fff}
            .vacation-evidence-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:7px}
            .vacation-evidence-photo button{width:100%;margin-top:6px}
            .vacation-evidence-signature canvas{display:block;width:100%;max-width:640px;height:150px;border:1px dashed #16a34a;border-radius:10px;background:#fff;touch-action:none}
            .vacation-evidence-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
            .vacation-evidence-status[data-state=success]{color:#166534}.vacation-evidence-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.vacation-evidence-grid{grid-template-columns:1fr}.vacation-evidence-photo-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("vacation-evidence-panel")) return;
        const summary = this.document.querySelector?.(".vacation-milk-summary");
        if (!summary?.parentElement) throw new Error("Vacation Milk panel is not available for evidence UI.");
        const panel = this.document.createElement("section");
        panel.id = "vacation-evidence-panel";
        panel.className = "vacation-evidence-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h4>รูปถ่ายและลายเซ็นผู้ปกครอง/ผู้รับนมช่วงปิดเทอม</h4>
            <p class="vacation-milk-history-meta">เลือกรูปสูงสุด 5 รูป และลงลายเซ็นแยกตามนักเรียนในห้อง การทำร่างยังไม่เขียน Firebase</p>
            <div class="vacation-evidence-grid">
                <div>
                    <label for="vacation-evidence-photo-input">รูปถ่ายหลักฐาน</label>
                    <input id="vacation-evidence-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple>
                    <p id="vacation-evidence-photo-count" class="vacation-milk-history-meta">0 / 5 รูป</p>
                    <button id="vacation-evidence-load-button" type="button">โหลดหลักฐานของรายการนี้</button>
                    <div id="vacation-evidence-photo-list" class="vacation-evidence-photo-list"></div>
                </div>
                <div class="vacation-evidence-signature">
                    <label for="vacation-evidence-owner">นักเรียนผู้รับนม</label>
                    <select id="vacation-evidence-owner"><option value="">-- เลือกนักเรียน --</option></select>
                    <label for="vacation-evidence-receiver">ชื่อผู้ปกครอง/ผู้รับนม</label>
                    <input id="vacation-evidence-receiver" type="text" maxlength="120" placeholder="ชื่อผู้ปกครองหรือผู้รับนม">
                    <canvas id="vacation-evidence-signature-canvas" width="640" height="240" aria-label="ลายเซ็นผู้รับนมช่วงปิดเทอม"></canvas>
                    <div class="vacation-evidence-actions">
                        <button id="vacation-evidence-signature-use" type="button">ใช้ลายเซ็นนี้</button>
                        <button id="vacation-evidence-signature-clear" type="button" class="secondary">ล้างลายเซ็น</button>
                    </div>
                    <p id="vacation-evidence-signature-summary" class="vacation-milk-history-meta">เลือกข้อมูลปิดเทอมเพื่อโหลดรายชื่อนักเรียน</p>
                </div>
            </div>
            <p id="vacation-evidence-status" class="vacation-evidence-status" data-state="idle" aria-live="polite">การเลือกรูปและเซ็นชื่อยังไม่เขียน Firebase</p>
        `;
        summary.parentElement.insertBefore(panel, summary.nextSibling);
    }

    bindEvents() {
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:vacation-preview-changed", this.handlePreviewChanged);
        this.element("vacation-evidence-photo-input")?.addEventListener?.("change", this.handleFiles);
        this.element("vacation-evidence-photo-list")?.addEventListener?.("click", this.handlePhotoRemove);
        this.element("vacation-evidence-owner")?.addEventListener?.("change", this.handleOwnerChange);
        this.element("vacation-evidence-signature-use")?.addEventListener?.("click", this.handleSignatureCommit);
        this.element("vacation-evidence-signature-clear")?.addEventListener?.("click", this.handleSignatureClear);
        this.element("vacation-evidence-load-button")?.addEventListener?.("click", this.handleLoadEvidence);
        const canvas = this.element("vacation-evidence-signature-canvas");
        if (canvas) this.manager.attachSignaturePad(canvas);
    }

    handleLoginSuccess(event) {
        if (event?.detail?.session?.role === "teacher") this.activate();
        else void this.clear();
    }

    handleLogout() {
        void this.clear();
    }

    activate() {
        this.active = true;
        const panel = this.element("vacation-evidence-panel");
        if (panel) panel.hidden = false;
    }

    async handlePreviewChanged(event) {
        if (!this.active) return;
        const preview = event?.detail || null;
        if (!preview) {
            await this.manager.clear();
            const canvas = this.element("vacation-evidence-signature-canvas");
            if (canvas) this.manager.attachSignaturePad(canvas);
            await this.render(false);
            return;
        }
        await this.manager.setRecordContext({
            roomId: preview.roomId,
            academicYear: preview.academicYear,
            semester: preview.semester,
            issueDate: preview.issueDate,
            days: preview.days,
            record: null,
            owners: preview.students || []
        });
        await this.render(false);
    }

    async handleFiles(event) {
        try {
            const files = event?.target?.files || [];
            if (!files.length) return;
            await this.manager.addPhotos(files);
            event.target.value = "";
            await this.render(false);
            this.setStatus("เพิ่มรูปถ่ายในร่างแล้ว โดยยังไม่มีการเขียน Firebase", "success");
        } catch (error) {
            this.setStatus(error?.message || "ไม่สามารถเพิ่มรูปถ่ายได้", "error");
        }
    }

    async handlePhotoRemove(event) {
        const button = event?.target?.closest?.("[data-vacation-evidence-remove]");
        if (!button) return;
        await this.manager.removePhoto(Number(button.dataset.vacationEvidenceRemove));
        await this.render(false);
    }

    async handleOwnerChange() {
        this.manager.selectOwner(this.value("vacation-evidence-owner"));
        await this.render(false);
    }

    async handleSignatureCommit() {
        try {
            await this.manager.commitActiveSignature(this.value("vacation-evidence-receiver"));
            this.setValue("vacation-evidence-receiver", "");
            await this.render(false);
            this.setStatus("ยืนยันลายเซ็นผู้รับนมช่วงปิดเทอมในร่างแล้ว โดยยังไม่มีการเขียน Firebase", "success");
        } catch (error) {
            this.setStatus(error?.message || "ไม่สามารถยืนยันลายเซ็นได้", "error");
        }
    }

    async handleSignatureClear() {
        await this.manager.clearActiveSignature();
        await this.render(false);
    }

    async handleLoadEvidence() {
        await this.render(true);
        this.setStatus("โหลดเฉพาะหลักฐานของรายการปิดเทอมที่เลือกแล้ว", "success");
    }

    async render(hydrate) {
        const state = this.manager.getState();
        this.setText("vacation-evidence-photo-count", `${state.photoCount} / 5 รูป`);
        const ownerSelect = this.element("vacation-evidence-owner");
        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">-- เลือกนักเรียน --</option>' + state.owners.map(owner =>
                `<option value="${this.escape(owner.key)}"${owner.key === state.activeOwnerKey ? " selected" : ""}>${this.escape(owner.name)}</option>`
            ).join("");
        }
        const signed = new Set(state.signatureReferences.map(item => item.ownerKey));
        this.setText("vacation-evidence-signature-summary", state.ownerCount
            ? `นักเรียน ${state.ownerCount} คน · มีลายเซ็น ${state.signatureCount} คน${state.activeOwnerKey && signed.has(state.activeOwnerKey) ? " · คนปัจจุบันเซ็นแล้ว" : ""}`
            : "เลือกข้อมูลปิดเทอมเพื่อโหลดรายชื่อนักเรียน");
        const previews = await this.manager.getPhotoPreviews({ hydrate });
        const list = this.element("vacation-evidence-photo-list");
        if (list) list.innerHTML = previews.length ? previews.map((preview, index) => `
            <article class="vacation-evidence-photo">
                ${preview.dataUrl ? `<img src="${this.escape(preview.dataUrl)}" alt="รูปนมช่วงปิดเทอม ${index + 1}">` : `<span>รูป ${index + 1}<br>กดโหลดหลักฐาน</span>`}
                <button type="button" data-vacation-evidence-remove="${index}">นำออก</button>
            </article>
        `).join("") : '<p class="vacation-milk-history-meta">ยังไม่มีรูปถ่าย</p>';
    }

    async clear() {
        this.active = false;
        await this.manager.clear?.();
        const panel = this.element("vacation-evidence-panel");
        if (panel) panel.hidden = true;
    }

    setStatus(message, state = "idle") {
        const target = this.element("vacation-evidence-status");
        if (target) {
            target.textContent = String(message || "");
            target.dataset.state = state;
        }
    }

    setText(id, value) {
        const target = this.element(id);
        if (target) target.textContent = String(value ?? "");
    }

    setValue(id, value) {
        const target = this.element(id);
        if (target) target.value = String(value ?? "");
    }

    value(id) {
        return String(this.element(id)?.value || "").trim();
    }

    element(id) {
        return this.document.getElementById(id);
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

window.VacationEvidenceViewClass = VacationEvidenceView;
window.VacationEvidenceView = new VacationEvidenceView();