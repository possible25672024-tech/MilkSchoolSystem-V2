class BrowserLocalReportAdapter {
    constructor(storage = window.localStorage, options = {}) {
        this.storage = storage;
        this.keys = {
            pending: options.pendingKey || "storedMilkDB_v1",
            retro: options.retroKey || "backdateDistDB_v1",
            vacation: options.vacationKey || "vacationDistDB_v1"
        };
    }

    ensureStorage() {
        if (!this.storage?.getItem) {
            throw new Error("Browser report storage is not available.");
        }
        return this.storage;
    }

    entries(collection) {
        if (Array.isArray(collection)) {
            return collection
                .map((record, index) => [String(record?.id || index), record])
                .filter(([, record]) => record && typeof record === "object");
        }
        if (collection && typeof collection === "object") {
            return Object.entries(collection)
                .filter(([, record]) => record && typeof record === "object");
        }
        return [];
    }

    readJson(key, fallback, diagnostics) {
        const raw = this.ensureStorage().getItem(key);
        if (raw === null || raw === "") {
            diagnostics.missing.push(key);
            return fallback;
        }
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch {
            diagnostics.invalid.push(key);
            return fallback;
        }
    }

    text(value) {
        return String(value ?? "").trim();
    }

    number(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    pendingPair(roomId, studentId, date) {
        return [this.text(roomId), this.text(studentId), this.text(date)].join("|");
    }

    cloudPendingPairs(collection) {
        const pairs = new Set();
        this.entries(collection).forEach(([, record]) => {
            const roomId = record.roomId || record.classId;
            if (record.students && typeof record.students === "object") {
                Object.entries(record.students).forEach(([studentId, info]) => {
                    const days = Array.isArray(info?.days) ? info.days : [];
                    days.forEach(date => pairs.add(this.pendingPair(roomId, studentId, date)));
                });
            }
            if (record.studentId && (record.absentDate || record.date)) {
                pairs.add(this.pendingPair(
                    roomId,
                    record.studentId,
                    record.absentDate || record.date
                ));
            }
        });
        return pairs;
    }

    retroKey(record = {}) {
        return [
            this.text(record.roomId || record.classId),
            this.text(record.academicYear || record.year),
            this.text(record.semester || record.term),
            this.text(record.retroStart || record.fromDate),
            this.text(record.retroEnd || record.toDate)
        ].join("|");
    }

    vacationKey(record = {}) {
        return [
            this.text(record.roomId || record.classId),
            this.text(record.academicYear || record.year),
            this.text(record.semester || record.term),
            this.text(record.date || record.issueDate),
            this.number(record.days)
        ].join("|");
    }

    keySet(collection, resolver) {
        return new Set(
            this.entries(collection)
                .map(([, record]) => resolver.call(this, record))
                .filter(key => key.replaceAll("|", ""))
        );
    }

    normalizePending(database, cloudSnapshot) {
        const cloudPairs = this.cloudPendingPairs(cloudSnapshot.absentMilk);
        return this.entries(database?.dispensed)
            .map(([key, record]) => ({
                id: this.text(record.id || key),
                batchId: this.text(record.batchId),
                classId: this.text(record.classId || record.roomId),
                studentId: this.text(record.studentId),
                absentDate: this.text(record.absentDate || record.date),
                weekStart: this.text(record.weekStart),
                weekEnd: this.text(record.weekEnd),
                dispenseDate: this.text(record.dispenseDate),
                boxes: this.number(record.boxes ?? record.totalBoxes, 1)
            }))
            .filter(record => record.classId && record.studentId && record.absentDate)
            .filter(record => !cloudPairs.has(
                this.pendingPair(record.classId, record.studentId, record.absentDate)
            ));
    }

    normalizeRetro(database, cloudSnapshot) {
        const cloudKeys = this.keySet(cloudSnapshot.retroMilk, this.retroKey);
        return this.entries(database?.records)
            .map(([key, record]) => ({
                id: this.text(record.id || key),
                classId: this.text(record.classId || record.roomId),
                academicYear: this.text(record.academicYear || record.year),
                semester: this.text(record.semester || record.term),
                retroStart: this.text(record.retroStart || record.fromDate),
                retroEnd: this.text(record.retroEnd || record.toDate),
                date: this.text(record.date || record.issueDate),
                total: this.number(record.total ?? record.totalBoxes)
            }))
            .filter(record => record.classId && record.retroStart && record.retroEnd)
            .filter(record => !cloudKeys.has(this.retroKey(record)));
    }

    normalizeVacation(database, cloudSnapshot) {
        const cloudKeys = this.keySet(cloudSnapshot.vacationMilk, this.vacationKey);
        return this.entries(database?.records)
            .map(([key, record]) => ({
                id: this.text(record.id || key),
                classId: this.text(record.classId || record.roomId),
                academicYear: this.text(record.academicYear || record.year),
                semester: this.text(record.semester || record.term),
                date: this.text(record.date || record.issueDate),
                days: this.number(record.days),
                total: this.number(record.total ?? record.totalBoxes)
            }))
            .filter(record => record.classId && record.date && record.days > 0)
            .filter(record => !cloudKeys.has(this.vacationKey(record)));
    }

    read(cloudSnapshot = {}) {
        const diagnostics = { missing: [], invalid: [] };
        const pendingDb = this.readJson(this.keys.pending, { dispensed: [] }, diagnostics);
        const retroDb = this.readJson(this.keys.retro, { records: [] }, diagnostics);
        const vacationDb = this.readJson(this.keys.vacation, { records: [] }, diagnostics);
        const localPending = this.normalizePending(pendingDb, cloudSnapshot);
        const localRetro = this.normalizeRetro(retroDb, cloudSnapshot);
        const localVacation = this.normalizeVacation(vacationDb, cloudSnapshot);

        return {
            localPending,
            localRetro,
            localVacation,
            reportLocalDiagnostics: {
                ...diagnostics,
                counts: {
                    pending: localPending.length,
                    retro: localRetro.length,
                    vacation: localVacation.length
                }
            }
        };
    }
}

window.BrowserLocalReportAdapter = new BrowserLocalReportAdapter();
