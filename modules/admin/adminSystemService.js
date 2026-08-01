class AdminSystemService {
    constructor(repository = window.AdminSystemRepository, options = {}) {
        this.repository = repository;
        this.clock = options.clock || (() => new Date());
        this.digestOverride = options.digest || null;
        this.backupFormat = "MilkSchoolSystemV2Backup";
        this.backupVersion = 1;
        this.restorePhrase = "กู้คืนข้อมูล";
        this.allowedDocumentTypes = new Set([
            "application/pdf", "image/jpeg", "image/png"
        ]);
        this.maxDocumentBytes = 12 * 1024 * 1024;
    }

    ensureRepository() {
        this.repository ||= window.AdminSystemRepository;
        const required = [
            "loadSettingsWithEtag", "saveSettingsIfMatch", "loadDocumentMetadata",
            "loadDocumentContent", "saveDocument", "deleteDocument",
            "loadRootWithEtag", "restoreRootIfMatch"
        ];
        const missing = required.find(method => !this.repository?.[method]);
        if (missing) throw new Error(`AdminSystemRepository method ${missing} is not available.`);
        return this.repository;
    }

    businessError(code, message, details = null) {
        const error = new Error(message);
        error.code = code;
        if (details) error.details = details;
        return error;
    }

    assertAdmin(session) {
        if (!session || (session.role !== "admin" && session.isAdmin !== true)) {
            throw this.businessError("ADMIN_SESSION_REQUIRED", "ต้องเข้าสู่ระบบด้วยผู้ดูแลระบบ");
        }
        return session;
    }

    normalizeCollection(raw = {}) {
        if (Array.isArray(raw)) {
            return raw.filter(Boolean).map((record, index) => ({
                id: String(record?.id || index), ...record
            }));
        }
        return Object.entries(raw || {}).filter(([, record]) => record && typeof record === "object")
            .map(([id, record]) => ({ id: String(record.id || id), ...record }));
    }

    async loadSettings(session) {
        this.assertAdmin(session);
        const result = await this.ensureRepository().loadSettingsWithEtag();
        const settings = result.value || {};
        return {
            settings: {
                school: String(settings.school || settings.schoolName || ""),
                year: String(settings.year || settings.academicYear || ""),
                semester: String(settings.semester || settings.term || ""),
                perCrate: Number(settings.perCrate) || 36,
                warnLevel: Math.max(0, Number(settings.warnLevel) || 0)
            },
            etag: result.etag
        };
    }

    validateSettings(input = {}) {
        const school = String(input.school || "").trim();
        const year = String(input.year || "").trim();
        const semester = String(input.semester || "").trim();
        const perCrate = Number(input.perCrate);
        const warnLevel = Number(input.warnLevel);
        if (!school) throw this.businessError("SETTINGS_SCHOOL_REQUIRED", "กรุณากรอกชื่อโรงเรียน");
        if (!year) throw this.businessError("SETTINGS_YEAR_REQUIRED", "กรุณากรอกปีการศึกษา");
        if (!Number.isInteger(perCrate) || perCrate < 1 || perCrate > 500) {
            throw this.businessError("SETTINGS_PER_CRATE_INVALID", "จำนวนกล่องต่อลังต้องอยู่ระหว่าง 1–500");
        }
        if (!Number.isInteger(warnLevel) || warnLevel < 0 || warnLevel > 10_000_000) {
            throw this.businessError("SETTINGS_WARN_LEVEL_INVALID", "ระดับแจ้งเตือนสต็อกไม่ถูกต้อง");
        }
        return { school, year, semester, perCrate, warnLevel };
    }

    async saveSettings(session, input, etag) {
        this.assertAdmin(session);
        if (!String(etag || "").trim()) {
            throw this.businessError("SETTINGS_ETAG_REQUIRED", "กรุณาโหลดค่าปัจจุบันก่อนบันทึก");
        }
        const editable = this.validateSettings(input);
        const current = await this.ensureRepository().loadSettingsWithEtag();
        if (current.etag !== etag) {
            throw this.businessError("SETTINGS_CONFLICT", "มีผู้ใช้อื่นแก้การตั้งค่าแล้ว กรุณาโหลดใหม่");
        }
        const protectedSettings = current.value || {};
        const next = { ...protectedSettings, ...editable, updatedAt: this.clock().toISOString() };
        const result = await this.repository.saveSettingsIfMatch(next, etag);
        if (result.status === "conflict") {
            throw this.businessError("SETTINGS_CONFLICT", "มีผู้ใช้อื่นบันทึกการตั้งค่าพร้อมกัน กรุณาโหลดใหม่");
        }
        return { settings: editable, etag: result.etag || "", saved: true };
    }

    async loadDocuments(session) {
        this.assertAdmin(session);
        const raw = await this.ensureRepository().loadDocumentMetadata();
        const documents = this.normalizeCollection(raw).map(document => ({
            id: document.id,
            title: String(document.title || "เอกสารไม่มีชื่อ"),
            description: String(document.description || ""),
            uploadedBy: String(document.uploadedBy || ""),
            uploadedAt: String(document.uploadedAt || document.createdAt || ""),
            updatedAt: String(document.updatedAt || ""),
            fileName: String(document.fileName || ""),
            fileType: String(document.fileType || document.contentType || ""),
            fileSize: Math.max(0, Number(document.fileSize) || 0),
            cloudSynced: document.cloudSynced !== false
        })).sort((left, right) => (
            String(right.uploadedAt || right.updatedAt).localeCompare(String(left.uploadedAt || left.updatedAt))
        ));
        return { documents, total: documents.length };
    }

    async loadDocumentContent(session, id) {
        this.assertAdmin(session);
        const fileData = await this.ensureRepository().loadDocumentContent(id);
        if (!fileData) throw this.businessError("DOCUMENT_CONTENT_MISSING", "ไม่พบไฟล์เอกสารใน Cloud");
        return fileData;
    }

    documentInput(input = {}) {
        const title = String(input.title || "").trim();
        const fileName = String(input.fileName || "").trim();
        const suppliedType = String(input.contentType || "").toLowerCase();
        const extension = fileName.split(".").pop()?.toLowerCase() || "";
        const inferredType = extension === "pdf"
            ? "application/pdf"
            : ["jpg", "jpeg"].includes(extension)
                ? "image/jpeg"
                : extension === "png" ? "image/png" : "";
        const contentType = suppliedType || inferredType;
        const fileSize = Number(input.fileSize) || 0;
        const fileData = input.fileData;
        if (!title) throw this.businessError("DOCUMENT_TITLE_REQUIRED", "กรุณากรอกชื่อเอกสาร");
        if (!fileName || !this.allowedDocumentTypes.has(contentType)) {
            throw this.businessError("DOCUMENT_TYPE_INVALID", "รองรับเฉพาะ PDF, JPG, JPEG และ PNG");
        }
        if (!Number.isInteger(fileSize) || fileSize < 1 || fileSize > this.maxDocumentBytes) {
            throw this.businessError("DOCUMENT_SIZE_INVALID", "ไฟล์เอกสารต้องมีขนาดไม่เกิน 12 MB");
        }
        if (typeof fileData !== "string" || !fileData.startsWith("data:")) {
            throw this.businessError("DOCUMENT_CONTENT_INVALID", "อ่านไฟล์เอกสารไม่สำเร็จ");
        }
        return {
            title,
            description: String(input.description || "").trim(),
            uploadedBy: String(input.uploadedBy || "ผู้ดูแลระบบ").trim(),
            fileName,
            fileType: contentType,
            contentType,
            fileSize,
            fileData
        };
    }

    async saveDocument(session, input = {}) {
        this.assertAdmin(session);
        const document = this.documentInput(input);
        const now = this.clock().toISOString();
        const id = String(input.id || `doc_${this.clock().getTime()}_${Math.random().toString(36).slice(2, 9)}`);
        const { fileData, ...metadata } = document;
        await this.ensureRepository().saveDocument(id, {
            ...metadata,
            id,
            uploadedAt: String(input.uploadedAt || now),
            updatedAt: now,
            cloudSynced: true
        }, fileData);
        return { id, ...metadata, uploadedAt: String(input.uploadedAt || now), updatedAt: now };
    }

    async deleteDocument(session, id) {
        this.assertAdmin(session);
        if (!String(id || "").trim()) throw this.businessError("DOCUMENT_ID_REQUIRED", "ไม่พบรหัสเอกสาร");
        await this.ensureRepository().deleteDocument(id);
        return { id: String(id), deleted: true };
    }

    stableDataJson(data) {
        return JSON.stringify(data ?? {});
    }

    async canonicalizeForDigest(value, largeStringThreshold = 64 * 1024) {
        if (typeof value === "string") {
            if (value.length <= largeStringThreshold) return value;
            return {
                $milkAppLargeValue: true,
                length: value.length,
                sha256: await this.sha256(value)
            };
        }
        if (Array.isArray(value)) {
            return Promise.all(value.map(item => this.canonicalizeForDigest(item, largeStringThreshold)));
        }
        if (value && typeof value === "object") {
            const entries = [];
            for (const key of Object.keys(value).sort((left, right) => left.localeCompare(right))) {
                entries.push([
                    key,
                    await this.canonicalizeForDigest(value[key], largeStringThreshold)
                ]);
            }
            return Object.fromEntries(entries);
        }
        return value;
    }

    async checksumData(data) {
        const canonical = await this.canonicalizeForDigest(data ?? {});
        return this.sha256(JSON.stringify(canonical));
    }

    async sha256(value) {
        if (this.digestOverride) return this.digestOverride(value);
        const cryptoApi = globalThis.crypto || window.crypto;
        const Encoder = globalThis.TextEncoder || window.TextEncoder;
        if (!cryptoApi?.subtle || !Encoder) throw new Error("SHA-256 is not available in this browser.");
        const bytes = new Encoder().encode(String(value));
        const digest = await cryptoApi.subtle.digest("SHA-256", bytes);
        return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
    }

    countCollection(value) {
        if (Array.isArray(value)) return value.filter(Boolean).length;
        return value && typeof value === "object" ? Object.keys(value).length : 0;
    }

    summarizeRoot(data = {}) {
        return {
            mainStock: Number(data.stock) || 0,
            rooms: this.countCollection(data.rooms),
            roomStocks: this.countCollection(data.roomStock),
            receipts: this.countCollection(data.receives),
            distributions: this.countCollection(data.distributes),
            attendance: this.countCollection(data.mcAttendance),
            pending: this.countCollection(data.absentMilk),
            retroactive: this.countCollection(data.retroMilk),
            vacation: this.countCollection(data.vacationMilk),
            documents: this.countCollection(data.documents)
        };
    }

    validateRootShape(data) {
        const isCollection = value => Array.isArray(value)
            || (value && typeof value === "object");
        if (!data.settings || typeof data.settings !== "object" || Array.isArray(data.settings)) {
            throw this.businessError("BACKUP_SCHEMA_INVALID", "ไฟล์สำรองไม่มี settings ที่ถูกต้อง");
        }
        if (!Object.prototype.hasOwnProperty.call(data, "stock") || !Number.isFinite(Number(data.stock))) {
            throw this.businessError("BACKUP_SCHEMA_INVALID", "ไฟล์สำรองไม่มี Main Stock ที่ถูกต้อง");
        }
        for (const key of ["rooms", "roomStock", "receives", "distributes"]) {
            if (!isCollection(data[key])) {
                throw this.businessError("BACKUP_SCHEMA_INVALID", `ไฟล์สำรองไม่มี ${key} ที่ถูกต้อง`);
            }
        }
        return true;
    }

    async createBackup(session, purpose = "download", profile = "full") {
        this.assertAdmin(session);
        const normalizedProfile = profile === "core" ? "core" : "full";
        const repository = this.ensureRepository();
        if (normalizedProfile === "core" && !repository.loadCoreWithEtag) {
            throw this.businessError("CORE_BACKUP_UNAVAILABLE", "ระบบสำรองข้อมูลหลักแบบเร็วยังไม่พร้อม");
        }
        const snapshot = normalizedProfile === "core"
            ? await repository.loadCoreWithEtag()
            : await repository.loadRootWithEtag();
        const data = snapshot.value || {};
        const checksum = await this.checksumData(data);
        const createdAt = this.clock().toISOString();
        return {
            envelope: {
                format: this.backupFormat,
                formatVersion: this.backupVersion,
                createdAt,
                purpose: String(purpose || "download"),
                profile: normalizedProfile,
                restoreScope: normalizedProfile === "full" ? "full-root" : "reference-only",
                school: String(data.settings?.school || data.settings?.schoolName || ""),
                summary: this.summarizeRoot(data),
                integrity: {
                    algorithm: "SHA-256",
                    serialization: "MilkSchoolSystemV2-large-value-canonical-v1",
                    checksum
                },
                data
            },
            etag: snapshot.etag,
            summary: this.summarizeRoot(data)
        };
    }

    async validateBackup(session, envelope) {
        this.assertAdmin(session);
        if (!envelope || envelope.format !== this.backupFormat || envelope.formatVersion !== this.backupVersion) {
            throw this.businessError("BACKUP_FORMAT_INVALID", "ไฟล์นี้ไม่ใช่ข้อมูลสำรอง MilkSchoolSystem V2 ที่รองรับ");
        }
        if (!envelope.data || typeof envelope.data !== "object" || Array.isArray(envelope.data)) {
            throw this.businessError("BACKUP_DATA_INVALID", "ไฟล์สำรองไม่มีข้อมูล milkApp ที่ถูกต้อง");
        }
        this.validateRootShape(envelope.data);
        const expected = String(envelope.integrity?.checksum || "").toLowerCase();
        if (!expected || envelope.integrity?.algorithm !== "SHA-256") {
            throw this.businessError("BACKUP_CHECKSUM_MISSING", "ไฟล์สำรองไม่มี SHA-256 สำหรับตรวจความสมบูรณ์");
        }
        const actual = envelope.integrity?.serialization === "MilkSchoolSystemV2-large-value-canonical-v1"
            ? await this.checksumData(envelope.data)
            : await this.sha256(this.stableDataJson(envelope.data));
        if (actual !== expected) {
            throw this.businessError("BACKUP_CHECKSUM_MISMATCH", "ไฟล์สำรองถูกแก้ไขหรือเสียหาย (SHA-256 ไม่ตรง)");
        }
        const repository = this.ensureRepository();
        const current = repository.loadRootSummaryWithEtag
            ? await repository.loadRootSummaryWithEtag()
            : await repository.loadRootWithEtag();
        return {
            envelope,
            summary: this.summarizeRoot(envelope.data),
            currentSummary: this.summarizeRoot(current.value || {}),
            currentEtag: current.etag,
            checksum: actual,
            valid: true
        };
    }

    async restoreBackup(session, preview, options = {}) {
        this.assertAdmin(session);
        if (!preview?.valid || !preview.currentEtag || !preview.envelope?.data) {
            throw this.businessError("RESTORE_PREVIEW_REQUIRED", "กรุณาตรวจไฟล์สำรองใหม่ก่อนกู้คืน");
        }
        if (options.confirmation !== this.restorePhrase) {
            throw this.businessError("RESTORE_CONFIRMATION_INVALID", `กรุณาพิมพ์คำว่า ${this.restorePhrase}`);
        }
        if (options.safetyBackupReady !== true) {
            throw this.businessError("RESTORE_SAFETY_BACKUP_REQUIRED", "ต้องดาวน์โหลดข้อมูลสำรองปัจจุบันก่อนกู้คืน");
        }
        if (preview.envelope?.profile === "core" || preview.envelope?.restoreScope === "reference-only") {
            throw this.businessError(
                "CORE_BACKUP_RESTORE_BLOCKED",
                "ไฟล์ข้อมูลหลักแบบเร็วใช้ตรวจสอบและเก็บประจำวัน แต่ไม่ใช้เขียนทับฐานทั้งก้อน กรุณาเลือกไฟล์สำรองครบถ้วน"
            );
        }
        const restoreId = `restore_${this.clock().getTime()}`;
        const restoredData = {
            ...preview.envelope.data,
            systemAudit: {
                ...(preview.envelope.data.systemAudit || {}),
                restores: {
                    ...(preview.envelope.data.systemAudit?.restores || {}),
                    [restoreId]: {
                        restoredAt: this.clock().toISOString(),
                        restoredBy: String(session.username || session.teacher || "admin"),
                        sourceCreatedAt: String(preview.envelope.createdAt || ""),
                        checksum: String(preview.checksum || "")
                    }
                }
            }
        };
        const result = await this.ensureRepository().restoreRootIfMatch(restoredData, preview.currentEtag);
        if (result.status === "conflict") {
            throw this.businessError(
                "RESTORE_CONFLICT",
                "ข้อมูลจริงเปลี่ยนหลังการตรวจไฟล์ ระบบจึงยกเลิกการกู้คืน กรุณาตรวจไฟล์ใหม่"
            );
        }
        return { restored: true, restoreId, checksum: preview.checksum };
    }
}

window.AdminSystemService = new AdminSystemService();
