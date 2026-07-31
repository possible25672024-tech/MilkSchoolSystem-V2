class AdminReceiptView {
    constructor(
        manager = window.AdminReceiptManager,
        authService = window.AuthService,
        eventTarget = window,
        options = {}
    ) {
        this.manager = manager;
        this.authService = authService;
        this.eventTarget = eventTarget;
        this.document = options.document || document;
        this.confirm = options.confirm || (message => window.confirm(message));
        this.bound = false;
        this.photos = [];
        this.detailPhotos = [];
        this.receiverSignature = null;
        this.senderSignature = null;
        this.detailReceiverSignature = null;
        this.detailSenderSignature = null;
        this.detailMode = "view";
    }

    element(id) {
        return this.document.getElementById(id);
    }

    initialize() {
        this.bindEvents();
        this.setDefaultDate();
        this.attachSignaturePads();
    }

    bindEvents() {
        if (this.bound) return;
        this.document.querySelector?.('[data-admin-menu="receipts"]')?.addEventListener("click", () => this.load("form"));
        this.document.querySelector?.('[data-admin-menu="receipt-history"]')?.addEventListener("click", () => this.load("history"));
        this.element("admin-receipt-refresh")?.addEventListener("click", () => this.load("form"));
        this.element("admin-receipt-history-refresh")?.addEventListener("click", () => this.load("history"));
        this.element("admin-receipt-form")?.addEventListener("input", () => this.renderPreview());
        this.element("admin-receipt-form")?.addEventListener("submit", event => this.submit(event));
        this.element("admin-receipt-photos")?.addEventListener("change", event => this.processPhotos(event, "create"));
        this.element("admin-receipt-receiver-clear")?.addEventListener("click", () => this.receiverSignature?.clear?.());
        this.element("admin-receipt-sender-clear")?.addEventListener("click", () => this.senderSignature?.clear?.());
        this.element("admin-receipt-history-body")?.addEventListener("click", event => this.handleHistoryAction(event));
        this.element("admin-receipt-detail-form")?.addEventListener("submit", event => this.saveDetail(event));
        this.element("admin-receipt-detail-close")?.addEventListener("click", () => this.closeDetail());
        this.element("admin-receipt-detail-photos")?.addEventListener("change", event => this.processPhotos(event, "detail"));
        this.element("admin-receipt-detail-receiver-clear")?.addEventListener("click", () => this.detailReceiverSignature?.clear?.());
        this.element("admin-receipt-detail-sender-clear")?.addEventListener("click", () => this.detailSenderSignature?.clear?.());
        this.eventTarget.addEventListener?.("milkapp:logout", () => this.reset());
        this.bound = true;
    }

    attachSignaturePads() {
        const Pad = window.SignaturePadClass;
        if (!Pad || !window.MediaPolicy) return;
        [
            ["admin-receipt-receiver-signature", "receiverSignature"],
            ["admin-receipt-sender-signature", "senderSignature"],
            ["admin-receipt-detail-receiver-signature", "detailReceiverSignature"],
            ["admin-receipt-detail-sender-signature", "detailSenderSignature"]
        ].forEach(([id, property]) => {
            const canvas = this.element(id);
            if (canvas && !this[property]) {
                this[property] = new Pad(canvas, window.MediaPolicy);
                this[property].initialize();
            }
        });
    }

    signatureValue(pad, existing, nameId) {
        const exported = pad?.exportSignature?.({ required: false });
        if (exported && !exported.empty) {
            return {
                receiverName: this.element(nameId)?.value,
                dataUrl: exported.dataUrl
            };
        }
        if (existing?.signature) {
            return {
                receiverName: this.element(nameId)?.value || existing.receiverName,
                dataUrl: existing.signature
            };
        }
        return null;
    }

    createInput() {
        const signatures = {};
        const receiver = this.signatureValue(this.receiverSignature, null, "admin-receipt-receiver-name");
        const sender = this.signatureValue(this.senderSignature, null, "admin-receipt-sender-name");
        if (receiver) signatures.receiver = receiver;
        if (sender) signatures.sender = sender;
        return {
            date: this.element("admin-receipt-date")?.value,
            crates: this.element("admin-receipt-crates")?.value,
            extra: this.element("admin-receipt-extra")?.value,
            perCrate: this.element("admin-receipt-per-crate")?.value,
            year: this.element("admin-receipt-year")?.value,
            note: this.element("admin-receipt-note")?.value,
            supplier: "อบต.",
            photos: this.photos.map(photo => photo.dataUrl || photo),
            signatures
        };
    }

    detailInput() {
        const existing = this.manager.detail?.receipt?.signatures || {};
        const signatures = {};
        const receiver = this.signatureValue(
            this.detailReceiverSignature,
            existing.receiver,
            "admin-receipt-detail-receiver-name"
        );
        const sender = this.signatureValue(
            this.detailSenderSignature,
            existing.sender,
            "admin-receipt-detail-sender-name"
        );
        if (receiver) signatures.receiver = receiver;
        if (sender) signatures.sender = sender;
        return {
            date: this.element("admin-receipt-detail-date")?.value,
            crates: this.element("admin-receipt-detail-crates")?.value,
            extra: this.element("admin-receipt-detail-extra")?.value,
            perCrate: this.element("admin-receipt-detail-per-crate")?.value,
            year: this.element("admin-receipt-detail-year")?.value,
            note: this.element("admin-receipt-detail-note")?.value,
            supplier: "อบต.",
            photos: this.detailPhotos.map(photo => photo.dataUrl || photo),
            signatures
        };
    }

    renderPreview() {
        try {
            const preview = this.manager.preview(this.createInput());
            this.setText("admin-receipt-preview", `${preview.total} กล่อง`);
            this.setText("admin-receipt-summary-crates", `${preview.crates} หีบ`);
            this.setText("admin-receipt-summary-contained", `${preview.crates * preview.perCrate} กล่อง`);
            this.setText("admin-receipt-summary-extra", `${preview.extra} กล่อง`);
            this.setText("admin-receipt-summary-total", `${preview.total} กล่อง`);
            this.showError("");
            return preview;
        } catch (error) {
            ["admin-receipt-preview", "admin-receipt-summary-crates", "admin-receipt-summary-contained", "admin-receipt-summary-extra", "admin-receipt-summary-total"]
                .forEach(id => this.setText(id, id.endsWith("preview") ? "—" : "0"));
            return null;
        }
    }

    async processPhotos(event, target) {
        const files = Array.from(event?.target?.files || []);
        const property = target === "detail" ? "detailPhotos" : "photos";
        const summaryId = target === "detail" ? "admin-receipt-detail-photo-summary" : "admin-receipt-photo-summary";
        if (!files.length) {
            if (target !== "detail") this[property] = [];
            this.setText(summaryId, this[property].length ? `คงรูปเดิม ${this[property].length} รูป` : "ยังไม่ได้เลือกรูป");
            return;
        }
        this.setBusy(true);
        this.showError("");
        this.setText(summaryId, "กำลังย่อและตรวจรูปภาพ...");
        try {
            if (!window.MediaProcessor?.processFiles) throw new Error("ระบบประมวลผลรูปภาพยังไม่พร้อม");
            this[property] = await window.MediaProcessor.processFiles(files);
            this.setText(summaryId, `พร้อมบันทึก ${this[property].length} รูป`);
        } catch (error) {
            if (event?.target) event.target.value = "";
            this.showError(error?.message || "ประมวลผลรูปภาพไม่สำเร็จ");
            this.setText(summaryId, this[property].length ? `คงรูปเดิม ${this[property].length} รูป` : "ยังไม่ได้เลือกรูป");
        } finally {
            this.setBusy(false);
        }
    }

    async load(target = "history") {
        this.setBusy(true);
        this.showError("");
        this.showHistoryError("");
        if (target === "history") this.setHistoryStatus("กำลังโหลดรายการรับนม...");
        else this.setStatus("กำลังโหลด Main Stock...");
        try {
            const model = await this.manager.refresh();
            this.setText("admin-receipt-main-stock", `${model.mainStock || 0} กล่อง`);
            this.renderHistory(model);
            if (target === "history") this.setHistoryStatus(`โหลดรายการรับนม ${model.receipts.length} รายการ`);
            else this.setStatus(`พร้อมรับนม · Main Stock ${model.mainStock} กล่อง`);
            return model;
        } catch (error) {
            const message = error?.message || "โหลดข้อมูลรับนมไม่สำเร็จ";
            if (target === "history") this.showHistoryError(message);
            else this.showError(message);
            if (target === "history") this.setHistoryStatus("");
            else this.setStatus("");
            return null;
        } finally {
            this.setBusy(false);
        }
    }

    renderHistory(model = {}) {
        this.setText("admin-receipt-history-main-stock", `${model.mainStock || 0} กล่อง`);
        this.setText("admin-receipt-history-count", `${model.receipts?.length || 0} รายการ`);
        this.setText("admin-receipt-history-total", `${model.totalBoxes || 0} กล่อง`);
        const body = this.element("admin-receipt-history-body");
        if (!body) return;
        body.replaceChildren(...(model.receipts || []).map((receipt, index) => {
            const row = this.document.createElement("tr");
            const values = [
                index + 1,
                receipt.date || "—",
                receipt.year || "—",
                `${receipt.crates} หีบ + ${receipt.extra} กล่อง`,
                `${receipt.total} กล่อง`,
                receipt.note || "—"
            ];
            values.forEach((value, cellIndex) => {
                const cell = this.document.createElement("td");
                cell.dataset.label = ["#", "วันที่รับ", "ปีการศึกษา", "หีบ/เศษ", "รวม", "หมายเหตุ"][cellIndex];
                cell.textContent = String(value);
                row.appendChild(cell);
            });
            const actions = this.document.createElement("td");
            actions.dataset.label = "การจัดการ";
            actions.className = "admin-row-actions";
            [
                ["view", "ดู", ""],
                ["edit", "แก้ไข", "secondary"],
                ["delete", "ลบ", "danger"]
            ].forEach(([action, label, className]) => {
                const button = this.document.createElement("button");
                button.type = "button";
                button.dataset.receiptAction = action;
                button.dataset.receiptId = receipt.id;
                button.className = className;
                button.textContent = label;
                actions.appendChild(button);
            });
            row.appendChild(actions);
            return row;
        }));
        if (!model.receipts?.length) {
            const row = this.document.createElement("tr");
            const cell = this.document.createElement("td");
            cell.colSpan = 7;
            cell.textContent = "ยังไม่มีรายการรับนม";
            row.appendChild(cell);
            body.appendChild(row);
        }
    }

    async handleHistoryAction(event) {
        const button = event?.target?.closest?.("[data-receipt-action]");
        if (!button) return;
        const action = button.dataset.receiptAction;
        const receiptId = button.dataset.receiptId;
        if (action === "delete") {
            await this.deleteReceipt(receiptId);
            return;
        }
        await this.openDetail(receiptId, action === "edit" ? "edit" : "view");
    }

    async openDetail(receiptId, mode = "view") {
        this.setHistoryBusy(true);
        this.showHistoryError("");
        try {
            const detail = await this.manager.loadDetail(receiptId);
            this.detailMode = mode;
            this.detailPhotos = [...(detail.receipt.photos || [])];
            this.renderDetail(detail.receipt, mode);
            this.element("admin-receipt-detail")?.removeAttribute("hidden");
            this.element("admin-receipt-detail")?.scrollIntoView?.({ behavior: "smooth", block: "start" });
            return detail;
        } catch (error) {
            this.showHistoryError(error?.message || "โหลดรายละเอียดรายการรับนมไม่สำเร็จ");
            return null;
        } finally {
            this.setHistoryBusy(false);
        }
    }

    renderDetail(receipt, mode) {
        const editable = mode === "edit";
        this.setText("admin-receipt-detail-title", editable ? "แก้ไขรายการรับนม" : "รายละเอียดรายการรับนม");
        const fields = {
            "admin-receipt-detail-date": receipt.date,
            "admin-receipt-detail-crates": receipt.crates,
            "admin-receipt-detail-extra": receipt.extra,
            "admin-receipt-detail-per-crate": receipt.perCrate,
            "admin-receipt-detail-year": receipt.year,
            "admin-receipt-detail-note": receipt.note,
            "admin-receipt-detail-receiver-name": receipt.signatures?.receiver?.receiverName || "",
            "admin-receipt-detail-sender-name": receipt.signatures?.sender?.receiverName || ""
        };
        Object.entries(fields).forEach(([id, value]) => {
            const input = this.element(id);
            if (input) {
                input.value = value ?? "";
                input.disabled = !editable;
            }
        });
        this.document.querySelectorAll?.("#admin-receipt-detail-form canvas, #admin-receipt-detail-form input[type=file]")?.forEach(element => {
            element.hidden = !editable;
        });
        ["admin-receipt-detail-receiver-clear", "admin-receipt-detail-sender-clear", "admin-receipt-detail-save"]
            .forEach(id => { const element = this.element(id); if (element) element.hidden = !editable; });
        this.detailReceiverSignature?.clear?.();
        this.detailSenderSignature?.clear?.();
        this.setText("admin-receipt-detail-photo-summary", `${receipt.photos?.length || 0} รูป`);
        this.renderEvidence(receipt);
    }

    renderEvidence(receipt) {
        const gallery = this.element("admin-receipt-detail-gallery");
        if (!gallery) return;
        const images = [
            ...(receipt.photos || []).map((src, index) => ({ src, alt: `รูปหลักฐาน ${index + 1}` })),
            ...["receiver", "sender"].flatMap(key => {
                const signature = receipt.signatures?.[key];
                return signature?.signature ? [{
                    src: signature.signature,
                    alt: key === "receiver" ? "ลายเซ็นผู้รับนม" : "ลายเซ็นผู้ส่งนม"
                }] : [];
            })
        ];
        gallery.replaceChildren(...images.map(item => {
            const figure = this.document.createElement("figure");
            const image = this.document.createElement("img");
            image.src = item.src;
            image.alt = item.alt;
            const caption = this.document.createElement("figcaption");
            caption.textContent = item.alt;
            figure.append(image, caption);
            return figure;
        }));
        if (!images.length) {
            const paragraph = this.document.createElement("p");
            paragraph.textContent = "รายการนี้ไม่มีรูปหรือลายเซ็นแนบ";
            gallery.appendChild(paragraph);
        }
    }

    async saveDetail(event) {
        event?.preventDefault?.();
        if (this.detailMode !== "edit") return;
        const receiptId = this.manager.detail?.receipt?.id;
        let preview;
        try {
            preview = this.manager.preview(this.detailInput());
        } catch (error) {
            this.showHistoryError("กรุณากรอกรายละเอียดรับนมให้ถูกต้อง");
            return;
        }
        if (!this.confirm(`ยืนยันแก้ไขรายการรับนมเป็น ${preview.total} กล่อง? Main Stock จะปรับตามผลต่าง`)) return;
        this.setHistoryBusy(true);
        try {
            const result = await this.manager.update(receiptId, this.detailInput());
            this.renderHistory(this.manager.current);
            this.closeDetail();
            this.setHistoryStatus(`แก้ไขสำเร็จ · Main Stock ${result.stockBefore} → ${result.stockAfter} กล่อง`);
        } catch (error) {
            this.showHistoryError(this.errorMessage(error));
        } finally {
            this.setHistoryBusy(false);
        }
    }

    async deleteReceipt(receiptId) {
        this.setHistoryBusy(true);
        this.showHistoryError("");
        try {
            const detail = await this.manager.loadDetail(receiptId);
            if (!this.confirm(`ยืนยันลบรายการรับนม ${detail.receipt.total} กล่อง? Main Stock จะลดลงเท่าจำนวนนี้`)) return;
            const result = await this.manager.delete(receiptId);
            this.renderHistory(this.manager.current);
            this.closeDetail();
            this.setHistoryStatus(`ลบสำเร็จ · Main Stock ${result.stockBefore} → ${result.stockAfter} กล่อง`);
        } catch (error) {
            this.showHistoryError(this.errorMessage(error));
        } finally {
            this.setHistoryBusy(false);
        }
    }

    errorMessage(error) {
        return {
            RECEIPT_LOCKED: "มีผู้ดูแลอีกหน้ากำลังแก้รายการรับนม กรุณารอแล้วโหลดใหม่",
            RECEIPT_CONFLICT: "รายการนี้ถูกแก้จากอีกหน้าหนึ่งแล้ว กรุณาเปิดรายการใหม่",
            INSUFFICIENT_MAIN_STOCK_FOR_RECEIPT_CHANGE: "Main Stock ไม่พอสำหรับลดหรือลบรายการนี้ เนื่องจากนมบางส่วนถูกจ่ายออกไปแล้ว"
        }[error?.code] || error?.message || "จัดการรายการรับนมไม่สำเร็จ";
    }

    async submit(event) {
        event?.preventDefault?.();
        const preview = this.renderPreview();
        if (!preview) {
            this.showError("กรุณากรอกจำนวนหีบและวันที่รับนมให้ถูกต้อง");
            return;
        }
        if (!this.confirm(`ยืนยันรับนมจาก อบต. ${preview.total} กล่อง เข้า Main Stock?`)) return;
        this.setBusy(true);
        this.showError("");
        try {
            const result = await this.manager.receive(this.createInput());
            this.setText("admin-receipt-main-stock", `${this.manager.current?.mainStock || result.stockAfter} กล่อง`);
            this.renderHistory(this.manager.current);
            this.setStatus(`รับนมสำเร็จ · Main Stock ${result.stockBefore} → ${result.stockAfter} กล่อง`);
            this.clearCreateForm();
        } catch (error) {
            this.showError(error?.message || "บันทึกรับนมไม่สำเร็จ");
        } finally {
            this.setBusy(false);
        }
    }

    clearCreateForm() {
        this.element("admin-receipt-form")?.reset?.();
        this.photos = [];
        this.receiverSignature?.clear?.();
        this.senderSignature?.clear?.();
        this.setText("admin-receipt-photo-summary", "ยังไม่ได้เลือกรูป");
        this.setDefaultDate();
        this.renderPreview();
    }

    closeDetail() {
        const panel = this.element("admin-receipt-detail");
        if (panel) panel.hidden = true;
        this.manager.detail = null;
        this.detailPhotos = [];
        this.detailReceiverSignature?.clear?.();
        this.detailSenderSignature?.clear?.();
    }

    setDefaultDate() {
        const input = this.element("admin-receipt-date");
        if (input && !input.value) {
            const now = new Date();
            const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
            input.value = localTime.toISOString().slice(0, 10);
        }
        const perCrate = this.element("admin-receipt-per-crate");
        if (perCrate && !perCrate.value) perCrate.value = "36";
        const extra = this.element("admin-receipt-extra");
        if (extra && !extra.value) extra.value = "0";
    }

    setText(id, value) {
        const element = this.element(id);
        if (element) element.textContent = String(value ?? "");
    }

    setStatus(message) { this.setText("admin-receipt-status", message); }
    setHistoryStatus(message) { this.setText("admin-receipt-history-status", message); }

    showError(message) {
        const element = this.element("admin-receipt-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    showHistoryError(message) {
        const element = this.element("admin-receipt-history-error");
        if (!element) return;
        element.textContent = String(message || "");
        element.hidden = !message;
    }

    setBusy(busy) {
        this.document.querySelectorAll?.(
            "#admin-receipt-form input, #admin-receipt-form button, #admin-receipt-refresh"
        )?.forEach(element => { element.disabled = Boolean(busy); });
    }

    setHistoryBusy(busy) {
        this.document.querySelectorAll?.(
            "#admin-receipt-history-refresh, #admin-receipt-history-body button, #admin-receipt-detail-form button"
        )?.forEach(element => { element.disabled = Boolean(busy); });
    }

    reset() {
        this.manager?.clear?.();
        this.element("admin-receipt-history-body")?.replaceChildren?.();
        this.setStatus("");
        this.setHistoryStatus("");
        this.showError("");
        this.showHistoryError("");
        this.photos = [];
        this.closeDetail();
        this.receiverSignature?.clear?.();
        this.senderSignature?.clear?.();
    }
}

window.AdminReceiptView = new AdminReceiptView();
