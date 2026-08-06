class StudentImportParser {
    constructor(xlsx = window.XLSX) {
        this.xlsx = xlsx;
        this.supportedExtensions = new Set(["xlsx", "xls", "csv"]);
    }

    ensureXlsx() {
        if (!this.xlsx) {
            this.xlsx = window.XLSX;
        }
        if (!this.xlsx?.read || !this.xlsx?.utils?.sheet_to_json) {
            const error = new Error("ไม่พบตัวอ่าน Excel ภายในระบบ");
            error.code = "STUDENT_IMPORT_READER_UNAVAILABLE";
            throw error;
        }
        return this.xlsx;
    }

    fileExtension(fileName = "") {
        return String(fileName).trim().toLocaleLowerCase("en").split(".").pop() || "";
    }

    async parseFile(file) {
        if (!file) {
            return this.failure("STUDENT_IMPORT_FILE_REQUIRED", "กรุณาเลือกไฟล์นักเรียน");
        }

        const extension = this.fileExtension(file.name);
        if (!this.supportedExtensions.has(extension)) {
            return this.failure(
                "STUDENT_IMPORT_FILE_TYPE",
                "รองรับเฉพาะไฟล์ .xlsx, .xls และ .csv"
            );
        }

        const workbook = await this.readWorkbook(file, extension);
        return this.parseWorkbook(workbook, {
            fileName: String(file.name || ""),
            extension
        });
    }

    async readWorkbook(file, extension) {
        const xlsx = this.ensureXlsx();
        if (extension === "csv") {
            const text = typeof file.text === "function"
                ? await file.text()
                : await this.readFile(file, "text");
            return xlsx.read(String(text || "").replace(/^\uFEFF/, ""), {
                type: "string",
                raw: false
            });
        }

        const data = typeof file.arrayBuffer === "function"
            ? await file.arrayBuffer()
            : await this.readFile(file, "arrayBuffer");
        return xlsx.read(new Uint8Array(data), { type: "array", raw: false });
    }

    readFile(file, mode) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error || new Error("อ่านไฟล์ไม่สำเร็จ"));
            reader.onload = event => resolve(event?.target?.result);
            if (mode === "text") reader.readAsText(file, "utf-8");
            else reader.readAsArrayBuffer(file);
        });
    }

    parseWorkbook(workbook = {}, metadata = {}) {
        const xlsx = this.ensureXlsx();
        const sheets = [];
        const errors = [];
        const warnings = [];
        const sheetNames = Array.isArray(workbook.SheetNames) ? workbook.SheetNames : [];

        sheetNames.forEach((sourceName, sheetIndex) => {
            const worksheet = workbook.Sheets?.[sourceName];
            const rows = worksheet
                ? xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "", raw: false })
                : [];
            if (!this.hasMeaningfulRows(rows)) {
                warnings.push({
                    sheetIndex,
                    roomName: sourceName,
                    code: "STUDENT_IMPORT_EMPTY_SHEET",
                    message: `ข้าม Sheet ว่าง: ${sourceName}`
                });
                return;
            }

            const roomName = metadata.extension === "csv"
                ? this.baseName(metadata.fileName)
                : String(sourceName || "").trim();
            const parsed = this.parseRows(rows, roomName);
            if (!parsed.valid) {
                errors.push(...parsed.errors.map(error => ({
                    ...error,
                    sheetIndex,
                    roomName
                })));
                return;
            }

            sheets.push({
                name: roomName,
                sourceName,
                parsed: {
                    headers: parsed.headers,
                    students: parsed.students,
                    teacher: parsed.teacher,
                    year: parsed.year
                }
            });
        });

        if (!sheets.length && !errors.length) {
            errors.push({
                code: "STUDENT_IMPORT_NO_SHEETS",
                message: "ไม่พบ Sheet ที่มีข้อมูลนักเรียน"
            });
        }

        return {
            valid: errors.length === 0,
            fileName: metadata.fileName || "",
            sheets,
            errors,
            warnings
        };
    }

    parseRows(rows = [], roomName = "") {
        const headerRowIndex = this.findHeaderRow(rows);
        if (headerRowIndex < 0) {
            return this.failure(
                "STUDENT_IMPORT_HEADER_NOT_FOUND",
                `ไม่พบหัวตารางนักเรียนในห้อง ${roomName || "ที่เลือก"}`
            );
        }

        const headerModel = this.buildHeaderModel(rows[headerRowIndex] || []);
        const headerErrors = this.validateHeaders(headerModel.headers);
        if (headerErrors.length) {
            return {
                valid: false,
                errors: headerErrors,
                headers: headerModel.headers,
                students: []
            };
        }

        const students = rows
            .slice(headerRowIndex + 1)
            .map(row => this.parseStudentRow(row, headerModel))
            .filter(Boolean);

        if (!students.length) {
            return this.failure(
                "STUDENT_IMPORT_NO_STUDENTS",
                `ไม่พบแถวนักเรียนในห้อง ${roomName || "ที่เลือก"}`
            );
        }

        return {
            valid: true,
            errors: [],
            headers: headerModel.headers,
            students,
            teacher: this.extractTeacher(rows),
            year: this.extractAcademicYear(rows),
            headerRowIndex
        };
    }

    findHeaderRow(rows = []) {
        const limit = Math.min(rows.length, 10);
        for (let index = 0; index < limit; index += 1) {
            const cells = Array.isArray(rows[index]) ? rows[index] : [];
            const normalized = cells.map(cell => this.clean(cell));
            const first = normalized[0] || "";
            const joined = normalized.join("|");
            const hasNumber = /^(เลขที่|เลข|ลำดับ|ที่)$/i.test(first);
            const hasName = /ชื่อ|name/i.test(joined);
            if ((hasNumber && hasName) || (hasName && normalized.filter(Boolean).length >= 2)) {
                return index;
            }
        }
        return -1;
    }

    buildHeaderModel(rawHeaders = []) {
        const normalized = rawHeaders.map(header => this.clean(header));
        const nameHeaderIndex = normalized.findIndex(header =>
            /ชื่อ/.test(header) && /(นามสกุล|สกุล)/.test(header)
        );
        const mergedNameIndex = nameHeaderIndex >= 0 &&
            normalized.length > nameHeaderIndex + 2 &&
            !normalized[nameHeaderIndex + 1] &&
            !normalized[nameHeaderIndex + 2]
            ? nameHeaderIndex
            : -1;
        const headers = [];
        const columns = [];

        if (mergedNameIndex >= 0) {
            normalized.forEach((header, rawIndex) => {
                if (rawIndex === mergedNameIndex) {
                    ["เพศ", "ชื่อ", "นามสกุล"].forEach((virtualHeader, offset) => {
                        headers.push(virtualHeader);
                        columns.push({ header: virtualHeader, rawIndex: rawIndex + offset });
                    });
                    return;
                }
                if (!header || (rawIndex > mergedNameIndex && rawIndex <= mergedNameIndex + 2)) {
                    return;
                }
                headers.push(header);
                columns.push({ header, rawIndex });
            });
        } else {
            normalized.forEach((header, rawIndex) => {
                if (!header || /^col\d+$/i.test(header)) {
                    return;
                }
                headers.push(header);
                columns.push({ header, rawIndex });
            });
        }

        return { headers, columns };
    }

    validateHeaders(headers = []) {
        const joined = headers.map(header => this.clean(header)).join("|");
        const errors = [];
        if (!/(เลขที่|ลำดับ|รหัส|student.?id|citizen|เลขประจำตัว)/i.test(joined)) {
            errors.push({
                code: "STUDENT_IMPORT_NUMBER_HEADER_REQUIRED",
                message: "หัวตารางต้องมี เลขที่ ลำดับ หรือรหัสนักเรียน"
            });
        }
        if (!/(ชื่อ|name)/i.test(joined)) {
            errors.push({
                code: "STUDENT_IMPORT_NAME_HEADER_REQUIRED",
                message: "หัวตารางต้องมีชื่อหรือชื่อ-นามสกุล"
            });
        }
        return errors;
    }

    parseStudentRow(row = [], headerModel = {}) {
        const firstValue = this.clean(row[0]);
        if (!firstValue || !/^\d+$/.test(firstValue)) {
            return null;
        }

        const student = {};
        (headerModel.columns || []).forEach(column => {
            student[column.header] = this.clean(row[column.rawIndex]);
        });

        const meaningful = Object.entries(student).some(([header, value]) =>
            value && value !== "-" && !/^(เลขที่|ลำดับ|ที่)$/i.test(header)
        );
        return meaningful ? student : null;
    }

    extractAcademicYear(rows = []) {
        for (const row of rows.slice(0, 5)) {
            const text = (Array.isArray(row) ? row : []).map(value => this.clean(value)).join(" ");
            const match = text.match(/ปีการศึกษา\s*(\d{4})/);
            if (match) return match[1];
        }
        return "";
    }

    extractTeacher(rows = []) {
        for (const row of rows) {
            const values = (Array.isArray(row) ? row : []).map(value => this.clean(value));
            const teacherCell = values.find(value => /ครูประจำชั้น/.test(value));
            if (!teacherCell) continue;
            return teacherCell
                .replace(/ครูประจำชั้น\s*[:：-]?\s*/g, "")
                .replace(/[()]/g, "")
                .trim();
        }
        return "";
    }

    hasMeaningfulRows(rows = []) {
        return rows.some(row =>
            Array.isArray(row) && row.some(value => this.clean(value))
        );
    }

    baseName(fileName = "") {
        return String(fileName).replace(/\.[^.]+$/, "").trim() || "CSV";
    }

    clean(value) {
        return String(value ?? "").replace(/\u00a0/g, " ").trim();
    }

    failure(code, message) {
        return {
            valid: false,
            sheets: [],
            errors: [{ code, message }],
            warnings: []
        };
    }
}

window.StudentImportParser = new StudentImportParser();
