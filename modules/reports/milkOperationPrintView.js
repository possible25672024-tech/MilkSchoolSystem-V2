class MilkOperationPrintView {
    constructor(options = {}) {
        this.openWindow = options.openWindow || ((...args) => window.open(...args));
        this.schedule = options.schedule || (callback => window.setTimeout(callback, 250));
        this.now = options.now || (() => new Date().toISOString());
        this.eventTarget = options.eventTarget || window;
    }

    typeConfig(kind) {
        const configs = {
            pending: {
                title: "รายงานจ่ายนมค้างรายสัปดาห์",
                quantityLabel: "นมค้าง"
            },
            retroactive: {
                title: "รายงานจ่ายนมย้อนหลัง",
                quantityLabel: "นมย้อนหลัง"
            },
            vacation: {
                title: "รายงานจ่ายนมช่วงปิดเทอม",
                quantityLabel: "นมช่วงปิดเทอม"
            }
        };
        const config = configs[String(kind || "").trim()];
        if (!config) {
            throw new Error("ประเภทรายงานจ่ายนมไม่ถูกต้อง");
        }
        return config;
    }

    print(input = {}) {
        const record = input.record && typeof input.record === "object" ? input.record : null;
        if (!record) {
            throw new Error("ไม่พบรายการสำหรับพิมพ์รายงาน");
        }
        const html = this.buildDocument(input);
        const printWindow = this.openWindow("", "_blank");
        if (!printWindow?.document) {
            throw new Error("เบราว์เซอร์ปิดกั้นหน้าต่างพิมพ์ กรุณาอนุญาต Pop-up");
        }
        printWindow.document.write(html);
        printWindow.document.close();
        this.emit("milkapp:milk-operation-print-opened", {
            kind: String(input.kind || ""),
            roomId: String(record.roomId || input.session?.roomId || ""),
            recordId: String(record.id || input.recordId || ""),
            photoCount: this.photos(record).length,
            signatureCount: this.signatureEntries(record).length
        });
        this.schedule(() => {
            printWindow.focus?.();
            printWindow.print?.();
        });
        return { html, printWindow };
    }

    buildDocument(input = {}) {
        const config = this.typeConfig(input.kind);
        const record = input.record || {};
        const session = input.session || {};
        const students = this.normalizeStudents(input.students || []);
        const rows = this.buildRows(input.kind, record, students);
        const photos = this.photos(record);
        const signatures = this.signatureEntries(record, students);
        const schoolName = String(
            input.schoolName ||
            session.schoolName ||
            input.settings?.schoolName ||
            "โรงเรียน"
        );
        const roomName = String(record.roomName || session.roomName || record.roomId || "ห้องเรียน");
        const teacher = String(record.teacher || session.teacher || "ครูประจำชั้น");
        const totalBoxes = Math.max(0, Number(record.totalBoxes) || rows.reduce(
            (sum, row) => sum + row.quantity,
            0
        ));

        return `<!doctype html><html lang="th"><head><meta charset="utf-8">
            <title>${this.escape(config.title)}</title>
            <style>
                @page{size:A4 portrait;margin:10mm}
                *{box-sizing:border-box}
                body{margin:0;color:#111;font-family:"Sarabun","Noto Sans Thai",sans-serif;font-size:9pt}
                .report{width:100%}
                header{text-align:center;margin-bottom:4mm}
                h1{margin:0;font-size:16pt}h2{margin:2mm 0 0;font-size:12pt}p{margin:1mm 0}
                .totals{margin:0 0 3mm;padding:2mm;border:1px solid #999;text-align:center;font-weight:700}
                table{width:100%;border-collapse:collapse}
                thead{display:table-header-group}
                th,td{border:.5pt solid #777;padding:1.7mm 1mm;text-align:center;vertical-align:middle}
                th{background:#174b68;color:#fff;font-weight:700}
                td.name{text-align:left}
                tr{break-inside:avoid;page-break-inside:avoid}
                .evidence{margin-top:4mm;break-inside:avoid}
                .evidence h3,.signatures h3{margin:0 0 2mm;font-size:10pt}
                .evidence-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1.5mm}
                .evidence-gallery img{display:block;width:100%;height:25mm;border:1px solid #aaa;object-fit:cover}
                .evidence-empty{padding:3mm;border:1px dashed #aaa;text-align:center;color:#666}
                .signatures{margin-top:4mm;break-inside:avoid}
                .signature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2mm}
                .signature-card{min-width:0;text-align:center}
                .signature-card img{display:block;width:100%;height:16mm;object-fit:contain}
                .signature-name{border-top:1px solid #555;padding-top:1mm;font-size:8pt;overflow-wrap:anywhere}
                .teacher-signature{width:58mm;margin:5mm 6mm 0 auto;text-align:center;break-inside:avoid}
                .teacher-signature img{display:block;width:100%;height:18mm;object-fit:contain}
                .signature-line{border-top:1px solid #333;padding-top:1mm}
                footer{display:flex;justify-content:space-between;margin-top:5mm;padding-top:2mm;font-size:8pt}
                @media screen{body{background:#eef2f7;padding:12px}.report{max-width:210mm;margin:0 auto;padding:10mm;background:#fff;box-shadow:0 2px 12px #999}}
            </style></head><body><section class="report">
                <header>
                    <h1>${this.escape(config.title)}</h1>
                    <h2>${this.escape(schoolName)}</h2>
                    <p>ห้อง ${this.escape(roomName)} · ${this.escape(teacher)}</p>
                    <p>${this.escape(this.periodLabel(input.kind, record))}</p>
                </header>
                <div class="totals">${this.escape(config.quantityLabel)} ${this.number(totalBoxes)} กล่อง · นักเรียน ${this.number(rows.length)} รายการ</div>
                <table>
                    <thead><tr><th>ที่</th><th>เลขที่</th><th>ชื่อ-นามสกุล</th><th>วันที่/ช่วง</th><th>จำนวนกล่อง</th></tr></thead>
                    <tbody>${rows.map((row, index) => `<tr>
                        <td>${index + 1}</td>
                        <td>${this.escape(row.num || "—")}</td>
                        <td class="name">${this.escape(row.name)}</td>
                        <td>${this.escape(row.period)}</td>
                        <td>${this.number(row.quantity)}</td>
                    </tr>`).join("")}</tbody>
                </table>
                ${this.photoSection(photos)}
                ${this.receiverSignatureSection(signatures)}
                <div class="teacher-signature">
                    ${this.image(record.signature)
                        ? `<img src="${this.escape(record.signature)}" alt="ลายเซ็นครูประจำชั้น">`
                        : ""}
                    <div class="signature-line">ลงชื่อ ${this.escape(teacher)}<br>ครูประจำชั้น</div>
                </div>
                <footer><span>พิมพ์เมื่อ ${this.escape(this.formatTimestamp(this.now()))}</span><span>${this.escape(record.note || "")}</span></footer>
            </section></body></html>`;
    }

    buildRows(kind, record = {}, rawStudents = []) {
        const students = this.normalizeStudents(rawStudents);
        const studentMap = new Map(students.map(student => [student.id, student]));
        if (kind === "pending") {
            return Object.entries(record.students || {}).flatMap(([studentId, info], index) => {
                const student = studentMap.get(String(studentId)) || {};
                const days = Array.isArray(info?.days) ? info.days : [];
                return [{
                    id: String(studentId),
                    num: String(student.num || index + 1),
                    name: String(info?.name || student.name || studentId),
                    period: days.map(date => this.formatDate(date)).join(", ") || "—",
                    quantity: Math.max(0, days.length)
                }];
            });
        }
        const quantity = Math.max(0, Number(record.days) || 0);
        return students.map((student, index) => ({
            id: student.id,
            num: student.num || String(index + 1),
            name: student.name,
            period: kind === "retroactive"
                ? `${this.formatDate(record.retroStart)} – ${this.formatDate(record.retroEnd)}`
                : `${quantity} วัน`,
            quantity
        }));
    }

    normalizeStudents(rawStudents = []) {
        const values = Array.isArray(rawStudents) ? rawStudents : Object.values(rawStudents || {});
        return values
            .filter(student => student && typeof student === "object")
            .map((student, index) => ({
                id: String(student.id || student.studentId || student["รหัส"] || `student_${index + 1}`),
                num: String(student.num || student.no || student["เลขที่"] || index + 1),
                name: String(student.name || student["ชื่อ-นามสกุล"] || student["ชื่อ"] || `นักเรียนคนที่ ${index + 1}`)
            }));
    }

    periodLabel(kind, record = {}) {
        if (kind === "pending") {
            return `สัปดาห์ ${this.formatDate(record.weekStart)} – ${this.formatDate(record.weekEnd)} · จ่ายวันที่ ${this.formatDate(record.date)}`;
        }
        if (kind === "retroactive") {
            return `ปีการศึกษา ${String(record.academicYear || "—")} ภาคเรียนที่ ${String(record.semester || "—")} · ${this.formatDate(record.retroStart)} – ${this.formatDate(record.retroEnd)} · จ่ายวันที่ ${this.formatDate(record.date)}`;
        }
        return `ปีการศึกษา ${String(record.academicYear || "—")} · ปิดเทอมหลังภาค ${String(record.semester || "—")} · ${this.number(record.days)} วัน · จ่ายวันที่ ${this.formatDate(record.date)}`;
    }

    photos(record = {}) {
        return (Array.isArray(record.photos) ? record.photos : [])
            .filter(value => this.image(value))
            .slice(0, 5);
    }

    signatureEntries(record = {}, rawStudents = []) {
        const studentMap = new Map(this.normalizeStudents(rawStudents).map(student => [student.id, student]));
        return Object.entries(record.signatures || {})
            .map(([ownerKey, value]) => ({
                ownerKey: String(ownerKey),
                dataUrl: String(value?.sig || value?.signature || ""),
                receiverName: String(value?.receiverName || ""),
                studentName: studentMap.get(String(ownerKey))?.name || ""
            }))
            .filter(entry => this.image(entry.dataUrl));
    }

    photoSection(photos = []) {
        return `<section class="evidence">
            <h3>📷 รูปถ่ายแนบต่อรายงาน (${photos.length} รูป)</h3>
            ${photos.length
                ? `<div class="evidence-gallery">${photos.map((photo, index) => (
                    `<img src="${this.escape(photo)}" alt="รูปหลักฐาน ${index + 1}">`
                )).join("")}</div>`
                : '<div class="evidence-empty">ไม่มีรูปถ่ายแนบในรายการนี้</div>'}
        </section>`;
    }

    receiverSignatureSection(entries = []) {
        if (!entries.length) {
            return "";
        }
        return `<section class="signatures"><h3>✍️ ลายเซ็นผู้รับนม (${entries.length} รายการ)</h3>
            <div class="signature-grid">${entries.map(entry => `<div class="signature-card">
                <img src="${this.escape(entry.dataUrl)}" alt="ลายเซ็นผู้รับนม">
                <div class="signature-name">${this.escape(entry.receiverName || entry.studentName || entry.ownerKey)}</div>
            </div>`).join("")}</div>
        </section>`;
    }

    image(value) {
        return typeof value === "string" && value.startsWith("data:image/");
    }

    formatDate(value) {
        const text = String(value || "");
        const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : text || "—";
    }

    formatTimestamp(value) {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime())
            ? String(value || "")
            : parsed.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });
    }

    number(value) {
        const normalized = Number(value);
        return Number.isFinite(normalized) ? normalized.toLocaleString("th-TH") : "0";
    }

    emit(name, detail) {
        if (typeof this.eventTarget?.dispatchEvent === "function" && typeof CustomEvent === "function") {
            this.eventTarget.dispatchEvent(new CustomEvent(name, { detail }));
        }
    }

    escape(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}

window.MilkOperationPrintViewClass = MilkOperationPrintView;
window.MilkOperationPrintView = new MilkOperationPrintView();
