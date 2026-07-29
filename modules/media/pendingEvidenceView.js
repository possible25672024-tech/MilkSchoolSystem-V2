class PendingEvidenceView {
    constructor(
        manager = window.PendingEvidenceManager,
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
        this.handleWeekLoaded = this.handleWeekLoaded.bind(this);
        this.handleSelectionChanged = this.handleSelectionChanged.bind(this);
        this.handleFiles = this.handleFiles.bind(this);
        this.handlePhotoRemove = this.handlePhotoRemove.bind(this);
        this.handleOwnerChange = this.handleOwnerChange.bind(this);
        this.handleSignatureCommit = this.handleSignatureCommit.bind(this);
        this.handleSignatureClear = this.handleSignatureClear.bind(this);
        this.handleLoadEvidence = this.handleLoadEvidence.bind(this);
    }

    ensureDependencies() {
        if (!this.manager?.setRecordContext || !this.manager?.commitActiveSignature) throw new Error("PendingEvidenceManager is not available.");
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
        if (this.document.getElementById("pending-evidence-style")) return;
        const style = this.document.createElement("style");
        style.id = "pending-evidence-style";
        style.textContent = `
            .pending-evidence-panel{margin-top:16px;border:1px solid #ddd6fe;border-radius:14px;padding:16px;background:#faf5ff}
            .pending-evidence-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
            .pending-evidence-photo-list{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}
            .pending-evidence-photo{border:1px solid #ddd6fe;border-radius:10px;padding:8px;background:#fff}
            .pending-evidence-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:7px}
            .pending-evidence-photo button{width:100%;margin-top:6px}
            .pending-evidence-signature canvas{display:block;width:100%;max-width:640px;height:150px;border:1px dashed #8b5cf6;border-radius:10px;background:#fff;touch-action:none}
            .pending-evidence-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
            .pending-evidence-status[data-state=success]{color:#166534}.pending-evidence-status[data-state=error]{color:#991b1b}
            @media(max-width:760px){.pending-evidence-grid{grid-template-columns:1fr}.pending-evidence-photo-list{grid-template-columns:repeat(2,minmax(0,1fr))}}
        `;
        this.document.head?.appendChild?.(style);
    }

    ensureStructure() {
        if (this.document.getElementById("pending-evidence-panel")) return;
        const list = this.document.getElementById("pending-milk-list");
        if (!list?.parentElement) throw new Error("Pending Milk panel is not available for evidence UI.");
        const panel = this.document.createElement("section");
        panel.id = "pending-evidence-panel";
        panel.className = "pending-evidence-panel";
        panel.hidden = true;
        panel.innerHTML = `
            <h4>รูปถ่ายและลายเซ็นผู้รับนมค้าง</h4>
            <p class="pending-milk-meta">เลือกสิทธิ์รับนมก่อน แล้วลงลายเซ็นแยกตามนักเรียนและวันที่ รูปถ่ายสูงสุด 5 รูปต่อรายการ</p>
            <div class="pending-evidence-grid">
                <div>
                    <label for="pending-evidence-photo-input">รูปถ่ายหลักฐาน</label>
                    <input id="pending-evidence-photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple>
                    <p id="pending-evidence-photo-count" class="pending-milk-meta">0 / 5 รูป</p>
                    <button id="pending-evidence-load-button" type="button">โหลดหลักฐานของสัปดาห์นี้</button>
                    <div id="pending-evidence-photo-list" class="pending-evidence-photo-list"></div>
                </div>
                <div class="pending-evidence-signature">
                    <label for="pending-evidence-owner">นักเรียนและวันที่รับนม</label>
                    <select id="pending-evidence-owner"><option value="">-- เลือกรายการที่ติ๊กไว้ --</option></select>
                    <label for="pending-evidence-receiver">ชื่อผู้รับนม</label>
                    <input id="pending-evidence-receiver" type="text" maxlength="120" placeholder="ชื่อผู้ปกครอง/ผู้รับนม">
                    <canvas id="pending-evidence-signature-canvas" width="640" height="240" aria-label="ลายเซ็นผู้รับนมค้าง"></canvas>
                    <div class="pending-evidence-actions">
                        <button id="pending-evidence-signature-use" type="button">ใช้ลายเซ็นนี้</button>
                        <button id="pending-evidence-signature-clear" type="button" class="secondary">ล้างลายเซ็น</button>
                    </div>
                    <p id="pending-evidence-signature-summary" class="pending-milk-meta">ยังไม่ได้เลือกผู้รับนม</p>
                </div>
            </div>
            <p id="pending-evidence-status" class="pending-evidence-status" data-state="idle" aria-live="polite">การเลือกรูปและเซ็นชื่อยังไม่เขียน Firebase</p>
        `;
        list.parentElement.insertBefore(panel, list.nextSibling);
    }

    bindEvents() {
        this.eventTarget.addEventListener?.("milkapp:login-success", this.handleLoginSuccess);
        this.eventTarget.addEventListener?.("milkapp:logout", this.handleLogout);
        this.eventTarget.addEventListener?.("milkapp:pending-week-loaded", this.handleWeekLoaded);
        this.eventTarget.addEventListener?.("milkapp:pending-selection-changed", this.handleSelectionChanged);
        this.element("pending-evidence-photo-input")?.addEventListener?.("change", this.handleFiles);
        this.element("pending-evidence-photo-list")?.addEventListener?.("click", this.handlePhotoRemove);
        this.element("pending-evidence-owner")?.addEventListener?.("change", this.handleOwnerChange);
        this.element("pending-evidence-signature-use")?.addEventListener?.("click", this.handleSignatureCommit);
        this.element("pending-evidence-signature-clear")?.addEventListener?.("click", this.handleSignatureClear);
        this.element("pending-evidence-load-button")?.addEventListener?.("click", this.handleLoadEvidence);
        const canvas = this.element("pending-evidence-signature-canvas");
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
        const panel = this.element("pending-evidence-panel");
        if (panel) panel.hidden = false;
    }

    async handleWeekLoaded(event) {
        if (!this.active) return;
        const state = event?.detail || {};
        await this.manager.setRecordContext({
            roomId: state.roomId,
            weekStart: state.weekStart,
            weekEnd: state.weekEnd,
            record: null,
            owners: []
        });
        await this.render(false);
    }

    async handleSelectionChanged(event) {
        if (!this.active) return;
        await this.manager.setOwners(event?.detail?.selected || []);
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
        const button = event?.target?.closest?.("[data-pending-evidence-remove]");
        if (!button) return;
        await this.manager.removePhoto(Number(button.dataset.pendingEvidenceRemove));
        await this.render(false);
    }

    async handleOwnerChange() {
        this.manager.selectOwner(this.value("pending-evidence-owner"));
        await this.render(false);
    }

    async handleSignatureCommit() {
        try {
            await this.manager.commitActiveSignature(this.value("pending-evidence-receiver"));
            this.setValue("pending-evidence-receiver", "");
            await this.render(false);
            this.setStatus("ยืนยันลายเซ็นผู้รับนมในร่างแล้ว โดยยังไม่มีการเขียน Firebase", "success");
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
        this.setStatus("โหลดเฉพาะหลักฐานของสัปดาห์ที่เลือกแล้ว", "success");
    }

    async render(hydrate) {
        const state = this.manager.getState();
        this.setText("pending-evidence-photo-count", `${state.photoCount} / 5 รูป`);
        const ownerSelect = this.element("pending-evidence-owner");
        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">-- เลือกรายการที่ติ๊กไว้ --</option>' + state.owners.map(owner =>
                `<option value="${this.escape(owner.key)}"${owner.key === state.activeOwnerKey ? " selected" : ""}>${this.escape(owner.name)} · ${this.escape(owner.date)}</option>`
            ).join("");
        }
        const signed = new Set(state.signatures.map(item => item.ownerKey));
        this.setText("pending-evidence-signature-summary", state.selectedOwnerCount
            ? `เลือก ${state.selectedOwnerCount} รายการ · มีลายเซ็น ${state.signatureCount} รายการ${state.activeOwnerKey && signed.has(state.activeOwnerKey) ? " · รายการปัจจุบันเซ็นแล้ว" : ""}`
            : "ติ๊กรายการนักเรียนก่อนลงลายเซ็น");
        const previews = await this.manager.getPhotoPreviews({ hydrate });
        const list = this.element("pending-evidence-photo-list");
        if (list) list.innerHTML = previews.length ? previews.map((preview, index) => `
            <article class="pending-evidence-photo">
                ${preview.dataUrl ? `<img src="${this.escape(preview.dataUrl)}" alt="รูปนมค้าง ${index + 1}">` : `<span>รูป ${index + 1}<br>กดโหลดหลักฐาน</span>`}
                <button type="button" data-pending-evidence-remove="${index}">นำออก</button>
            </article>
        `).join("") : '<p class="pending-milk-meta">ยังไม่มีรูปถ่าย</p>';
    }

    async clear() {
        this.active = false;
        await this.manager.clear?.();
        const panel = this.element("pending-evidence-panel");
        if (panel) panel.hidden = true;
    }

    setStatus(message, state = "idle") {
        const target = this.element("pending-evidence-status");
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

window.PendingEvidenceViewClass = PendingEvidenceView;
window.PendingEvidenceView = new PendingEvidenceView();
