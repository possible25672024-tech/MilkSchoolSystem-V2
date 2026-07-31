class AdminSystemView {
    constructor(
        manager = window.AdminSystemManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.window = options.window || window;
        this.document = options.document || document;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.documents = [];
        this.bound = false;
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelector?.('[data-admin-menu="documents"]')
            ?.addEventListener("click", () => this.loadDocuments());
        this.document.querySelector?.('[data-admin-menu="system-settings"]')
            ?.addEventListener("click", () => this.loadSettings());
        this.document.querySelector?.('[data-admin-menu="backup-restore"]')
            ?.addEventListener("click", () => this.resetRestoreStatus());
        this.document.querySelector?.('[data-admin-menu="drive-sync"]')
            ?.addEventListener("click", () => this.resetDriveStatus());
        this.element("admin-document-form")?.addEventListener("submit", event => this.saveDocument(event));
        this.element("admin-document-refresh")?.addEventListener("click", () => this.loadDocuments());
        this.element("admin-settings-form")?.addEventListener("submit", event => this.saveSettings(event));
        this.element("admin-settings-refresh")?.addEventListener("click", () => this.loadSettings());
        this.element("admin-backup-download")?.addEventListener("click", () => this.downloadBackup("download"));
        this.element("admin-restore-file")?.addEventListener("change", event => this.inspectRestoreFile(event));
        this.element("admin-restore-safety")?.addEventListener("click", () => this.downloadBackup("pre-restore"));
        this.element("admin-restore-confirm")?.addEventListener("input", () => this.updateRestoreButton());
        this.element("admin-restore-run")?.addEventListener("click", () => this.restore());
        this.element("admin-drive-export")?.addEventListener("click", () => this.downloadBackup("google-drive"));
        this.element("admin-drive-open")?.addEventListener("click", () => {
            this.window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener,noreferrer");
        });
        this.element("admin-drive-import")?.addEventListener("change", event => this.inspectDriveFile(event));
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    isAdmin() {
        return this.authService?.getSession?.()?.role === "admin";
    }

    async loadDocuments() {
        if (!this.isAdmin()) return null;
        this.setBusy("documents", true);
        this.showError("documents", "");
        this.setStatus("documents", "กำลังโหลดรายการเอกสาร (ยังไม่โหลดไฟล์จริง)...");
        try {
            const model = await this.manager.loadDocuments();
            this.documents = model.documents || [];
            this.renderDocuments();
            this.setStatus("documents", `โหลด ${model.total || 0} รายการ · ไฟล์จริงจะโหลดเมื่อกดดาวน์โหลด`);
            return model;
        } catch (error) {
            this.showError("documents", error?.message || "โหลดเอกสารไม่สำเร็จ");
            return null;
        } finally {
            this.setBusy("documents", false);
        }
    }

    renderDocuments() {
        const body = this.element("admin-document-body");
        if (!body) return;
        body.replaceChildren(...this.documents.map(documentModel => {
            const row = this.document.createElement("tr");
            [
                documentModel.title,
                documentModel.fileName || "—",
                this.formatBytes(documentModel.fileSize),
                this.formatDate(documentModel.uploadedAt),
                documentModel.uploadedBy || "—"
            ].forEach(value => {
                const cell = this.document.createElement("td");
                cell.textContent = String(value);
                row.appendChild(cell);
            });
            const actions = this.document.createElement("td");
            const download = this.document.createElement("button");
            download.type = "button";
            download.textContent = "ดาวน์โหลด";
            download.addEventListener("click", () => this.downloadDocument(documentModel));
            const remove = this.document.createElement("button");
            remove.type = "button";
            remove.className = "secondary";
            remove.textContent = "ลบ";
            remove.addEventListener("click", () => this.deleteDocument(documentModel));
            actions.append(download, remove);
            row.appendChild(actions);
            return row;
        }));
        if (!this.documents.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 6;
            cell.textContent = "ยังไม่มีเอกสาร";
            row.appendChild(cell);
            body.appendChild(row);
        }
        this.setText("admin-document-count", `${this.documents.length} รายการ`);
    }

    async saveDocument(event) {
        event?.preventDefault?.();
        const file = this.element("admin-document-file")?.files?.[0];
        if (!file) {
            this.showError("documents", "กรุณาเลือกไฟล์ PDF, JPG, JPEG หรือ PNG");
            return;
        }
        this.setBusy("documents", true);
        this.showError("documents", "");
        this.setStatus("documents", "กำลังอ่านและอัปโหลดเอกสาร...");
        try {
            const fileData = await this.readFile(file);
            await this.manager.saveDocument({
                title: this.element("admin-document-title")?.value,
                description: this.element("admin-document-description")?.value,
                uploadedBy: this.element("admin-document-uploader")?.value,
                fileName: file.name,
                contentType: file.type,
                fileSize: file.size,
                fileData
            });
            this.element("admin-document-form")?.reset?.();
            await this.loadDocuments();
            this.setStatus("documents", "บันทึกเอกสารและไฟล์จริงขึ้น Cloud สำเร็จ");
        } catch (error) {
            this.showError("documents", error?.message || "บันทึกเอกสารไม่สำเร็จ");
        } finally {
            this.setBusy("documents", false);
        }
    }

    async downloadDocument(documentModel) {
        this.showError("documents", "");
        this.setStatus("documents", `กำลังโหลด ${documentModel.fileName || documentModel.title}...`);
        try {
            const fileData = await this.manager.loadDocumentContent(documentModel.id);
            const anchor = this.document.createElement("a");
            anchor.href = fileData;
            anchor.download = documentModel.fileName || `${documentModel.title}.pdf`;
            anchor.click();
            this.setStatus("documents", "ดาวน์โหลดเอกสารสำเร็จ");
        } catch (error) {
            this.showError("documents", error?.message || "ดาวน์โหลดเอกสารไม่สำเร็จ");
        }
    }

    async deleteDocument(documentModel) {
        if (!this.confirm(`ยืนยันลบเอกสาร “${documentModel.title}” ทั้งชื่อและไฟล์จริงจาก Cloud?`)) return;
        try {
            await this.manager.deleteDocument(documentModel.id);
            await this.loadDocuments();
            this.setStatus("documents", "ลบเอกสารสำเร็จ");
        } catch (error) {
            this.showError("documents", error?.message || "ลบเอกสารไม่สำเร็จ");
        }
    }

    async loadSettings() {
        if (!this.isAdmin()) return null;
        this.setBusy("settings", true);
        this.showError("settings", "");
        try {
            const model = await this.manager.loadSettings();
            Object.entries(model.settings || {}).forEach(([key, value]) => {
                const element = this.element(`admin-settings-${key.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`)}`);
                if (element) element.value = value;
            });
            this.setText("admin-settings-firebase-url", window.ConfigManager?.getDatabaseURL?.() || "ไม่ได้ตั้งค่า");
            this.setStatus("settings", "โหลดค่าปัจจุบันแล้ว · รหัส Firebase ไม่แสดงบนหน้าจอ");
            return model;
        } catch (error) {
            this.showError("settings", error?.message || "โหลดการตั้งค่าไม่สำเร็จ");
            return null;
        } finally {
            this.setBusy("settings", false);
        }
    }

    settingsInput() {
        return {
            school: this.element("admin-settings-school")?.value,
            year: this.element("admin-settings-year")?.value,
            semester: this.element("admin-settings-semester")?.value,
            perCrate: this.element("admin-settings-per-crate")?.value,
            warnLevel: this.element("admin-settings-warn-level")?.value
        };
    }

    async saveSettings(event) {
        event?.preventDefault?.();
        if (!this.confirm("ยืนยันบันทึกการตั้งค่าทั่วไป? การตั้งค่านี้ไม่เปลี่ยน Firebase URL หรือรหัสเชื่อมต่อ")) return;
        this.setBusy("settings", true);
        this.showError("settings", "");
        try {
            await this.manager.saveSettings(this.settingsInput());
            this.setStatus("settings", "บันทึกการตั้งค่าสำเร็จ");
        } catch (error) {
            this.showError("settings", error?.message || "บันทึกการตั้งค่าไม่สำเร็จ");
        } finally {
            this.setBusy("settings", false);
        }
    }

    async downloadBackup(purpose) {
        const prefix = purpose === "google-drive" ? "drive" : "backup";
        this.setBusy(prefix, true);
        this.showError(prefix, "");
        this.setStatus(prefix, "กำลังอ่านข้อมูลทั้งหมดและคำนวณ SHA-256...");
        try {
            const backup = await this.manager.createBackup(purpose);
            const date = String(backup.envelope.createdAt).slice(0, 10);
            const name = `milk-v2-backup-${date}.json`;
            this.downloadJson(backup.envelope, name);
            this.renderBackupSummary(backup.summary, prefix);
            this.setStatus(prefix, `ดาวน์โหลด ${name} สำเร็จ · SHA-256 ${backup.envelope.integrity.checksum.slice(0, 12)}…`);
            this.updateRestoreButton();
            return backup;
        } catch (error) {
            this.showError(prefix, error?.message || "สร้างข้อมูลสำรองไม่สำเร็จ");
            return null;
        } finally {
            this.setBusy(prefix, false);
            if (prefix === "backup") this.updateRestoreButton();
        }
    }

    async inspectRestoreFile(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;
        this.setBusy("backup", true);
        this.showError("backup", "");
        this.setStatus("backup", "กำลังตรวจรูปแบบและ SHA-256...");
        try {
            const envelope = JSON.parse(await file.text());
            const preview = await this.manager.inspectBackup(envelope);
            this.renderRestorePreview(preview);
            this.setStatus("backup", "ไฟล์สำรองสมบูรณ์ · ยังไม่มีการเขียนข้อมูล");
        } catch (error) {
            this.element("admin-restore-preview")?.setAttribute("hidden", "");
            this.showError("backup", error?.message || "ตรวจไฟล์สำรองไม่สำเร็จ");
        } finally {
            this.setBusy("backup", false);
            this.updateRestoreButton();
        }
    }

    async inspectDriveFile(event) {
        const file = event?.target?.files?.[0];
        if (!file) return;
        this.setBusy("drive", true);
        this.showError("drive", "");
        try {
            const preview = await this.manager.inspectBackup(JSON.parse(await file.text()));
            this.renderRestorePreview(preview);
            this.renderBackupSummary(preview.summary, "drive");
            this.setStatus("drive", "ตรวจไฟล์จาก Google Drive แล้ว · ให้ไปแท็บสำรอง/กู้คืนหากต้องการกู้คืนจริง");
            const restoreInput = this.element("admin-restore-file");
            if (restoreInput) restoreInput.value = "";
        } catch (error) {
            this.showError("drive", error?.message || "ไฟล์จาก Google Drive ไม่ถูกต้อง");
        } finally {
            this.setBusy("drive", false);
            this.updateRestoreButton();
        }
    }

    renderRestorePreview(preview) {
        const area = this.element("admin-restore-preview");
        if (!area) return;
        area.hidden = false;
        this.setText("admin-restore-source-date", preview.envelope.createdAt || "—");
        this.setText("admin-restore-checksum", preview.checksum);
        this.setText("admin-restore-source-summary", this.summaryText(preview.summary));
        this.setText("admin-restore-current-summary", this.summaryText(preview.currentSummary));
    }

    renderBackupSummary(summary, prefix) {
        this.setText(`admin-${prefix}-summary`, this.summaryText(summary));
    }

    summaryText(summary = {}) {
        return `Main ${summary.mainStock || 0} · ห้อง ${summary.rooms || 0} · รับ ${summary.receipts || 0} · จ่าย ${summary.distributions || 0} · เช็กดื่ม ${summary.attendance || 0} · เอกสาร ${summary.documents || 0}`;
    }

    updateRestoreButton() {
        const button = this.element("admin-restore-run");
        if (!button) return;
        button.disabled = !this.manager.restorePreview
            || !this.manager.safetyBackupReady
            || this.element("admin-restore-confirm")?.value !== "กู้คืนข้อมูล";
    }

    async restore() {
        if (!this.confirm("ยืนยันขั้นสุดท้าย: แทนที่ข้อมูล milkApp ทั้งหมดด้วยไฟล์ที่ตรวจแล้ว?")) return;
        this.setBusy("backup", true);
        this.showError("backup", "");
        let completed = false;
        try {
            const result = await this.manager.restore(this.element("admin-restore-confirm")?.value);
            this.setStatus("backup", `กู้คืนสำเร็จ · ${result.restoreId} · กรุณาโหลดหน้าใหม่ก่อนทำรายการต่อ`);
            completed = true;
        } catch (error) {
            this.showError("backup", error?.message || "กู้คืนข้อมูลไม่สำเร็จ");
        } finally {
            this.setBusy("backup", false);
            if (completed) {
                this.manager.restorePreview = null;
                this.manager.safetyBackupReady = false;
                const confirmInput = this.element("admin-restore-confirm");
                if (confirmInput) confirmInput.value = "";
            }
            this.updateRestoreButton();
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error || new Error("อ่านไฟล์ไม่สำเร็จ"));
            reader.readAsDataURL(file);
        });
    }

    downloadJson(value, filename) {
        const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const anchor = this.document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    formatBytes(bytes) {
        const value = Number(bytes) || 0;
        if (value < 1024) return `${value} B`;
        if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
        return `${(value / 1024 / 1024).toFixed(2)} MB`;
    }

    formatDate(value) {
        if (!value) return "—";
        try { return new Date(value).toLocaleString("th-TH"); } catch (error) { return value; }
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(prefix, message) {
        this.setText(`admin-${prefix}-status`, message);
    }

    showError(prefix, message) {
        const element = this.element(`admin-${prefix}-error`);
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(prefix, busy) {
        this.document.querySelectorAll?.(`[data-admin-${prefix}-control]`)?.forEach(element => {
            element.disabled = Boolean(busy);
        });
    }

    resetRestoreStatus() {
        this.setStatus("backup", "เลือกดาวน์โหลดข้อมูลสำรอง หรือเลือกไฟล์เพื่อตรวจสอบก่อนกู้คืน");
        this.updateRestoreButton();
    }

    resetDriveStatus() {
        this.setStatus("drive", "ระบบใช้ไฟล์ JSON เป็นตัวกลาง ไม่เก็บรหัสผ่าน Google");
    }

    reset() {
        this.manager?.clear?.();
        this.documents = [];
        this.element("admin-document-body")?.replaceChildren?.();
        ["documents", "settings", "backup", "drive"].forEach(prefix => {
            this.setStatus(prefix, "");
            this.showError(prefix, "");
        });
    }
}

window.AdminSystemView = new AdminSystemView();
