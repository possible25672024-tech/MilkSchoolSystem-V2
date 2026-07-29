class QueueStorage {
    constructor(storage = window.localStorage, options = {}) {
        this.storage = storage;
        this.storageKey = options.storageKey || "tc_pending_saves_v1";
    }

    ensureStorage() {
        if (!this.storage?.getItem || !this.storage?.setItem) {
            throw new Error("Persistent queue storage is not available.");
        }

        return this.storage;
    }

    readRaw() {
        try {
            const raw = this.ensureStorage().getItem(this.storageKey);
            if (!raw) {
                return [];
            }

            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }

    normalizeEntry(entry) {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const type = String(entry.type || "").trim();
        const key = String(entry.key || "").trim();
        const attempts = this.nonNegativeInteger(entry.attempts);
        const queuedAt = this.timestamp(entry.queuedAt);

        if (!key) {
            return null;
        }

        if (type === "attendance") {
            const record = entry.record || entry.rec;
            if (!record || typeof record !== "object") {
                return null;
            }

            const roomId = String(
                entry.roomId ||
                record.roomId ||
                record.classId ||
                record.clsId ||
                this.roomIdFromAttendanceKey(key)
            ).trim();

            if (!roomId) {
                return null;
            }

            return {
                type,
                key,
                roomId,
                record: { ...record },
                baselinePresent: this.nonNegativeInteger(entry.baselinePresent),
                queuedAt,
                attempts,
                nextRetryAt: this.timestamp(entry.nextRetryAt, 0)
            };
        }

        if (type === "roomStockAdjust") {
            const roomId = String(entry.roomId || "").trim();
            const difference = Number(entry.difference ?? entry.diff);
            if (!roomId || !Number.isFinite(difference) || difference === 0) {
                return null;
            }

            return {
                type,
                key,
                roomId,
                difference,
                referenceId: String(entry.referenceId || "").trim(),
                roomName: String(entry.roomName || "").trim(),
                date: String(entry.date || "").trim(),
                operationType: this.operationType(entry.operationType),
                note: String(entry.note || "").trim(),
                queuedAt,
                attempts,
                nextRetryAt: this.timestamp(entry.nextRetryAt, 0)
            };
        }

        if (type === "attendanceAudit") {
            const ledger = entry.ledger && typeof entry.ledger === "object"
                ? { ...entry.ledger }
                : null;
            const stockLog = entry.stockLog && typeof entry.stockLog === "object"
                ? { ...entry.stockLog }
                : null;
            const roomId = String(
                entry.roomId || ledger?.roomId || stockLog?.roomId || ""
            ).trim();

            if (!roomId || (!ledger?.id && !stockLog?.id)) {
                return null;
            }

            return {
                type,
                key,
                roomId,
                ledger,
                stockLog,
                referenceId: String(
                    entry.referenceId || ledger?.referenceId || ""
                ).trim(),
                queuedAt,
                attempts,
                nextRetryAt: this.timestamp(entry.nextRetryAt, 0)
            };
        }

        return null;
    }

    load() {
        return this.readRaw()
            .map(entry => this.normalizeEntry(entry))
            .filter(Boolean);
    }

    save(entries) {
        const normalized = Array.isArray(entries)
            ? entries.map(entry => this.normalizeEntry(entry)).filter(Boolean)
            : [];
        this.ensureStorage().setItem(this.storageKey, JSON.stringify(normalized));
        return normalized;
    }

    upsert(entry) {
        const normalized = this.normalizeEntry(entry);
        if (!normalized) {
            throw new Error("Queue entry is invalid.");
        }

        const queue = this.load();
        const index = queue.findIndex(item => item.key === normalized.key);

        if (index >= 0) {
            const previous = queue[index];
            queue[index] = normalized.type === "attendance" && previous.type === "attendance"
                ? {
                    ...normalized,
                    baselinePresent: previous.baselinePresent,
                    queuedAt: previous.queuedAt,
                    attempts: 0,
                    nextRetryAt: 0
                }
                : {
                    ...normalized,
                    queuedAt: previous.queuedAt,
                    attempts: 0,
                    nextRetryAt: 0
                };
        } else {
            queue.push(normalized);
        }

        const saved = this.save(queue);
        return saved.find(item => item.key === normalized.key) || null;
    }

    get(key) {
        const normalizedKey = String(key || "").trim();
        return this.load().find(entry => entry.key === normalizedKey) || null;
    }

    remove(key) {
        const normalizedKey = String(key || "").trim();
        const next = this.load().filter(entry => entry.key !== normalizedKey);
        this.save(next);
        return next;
    }

    replace(entries) {
        return this.save(entries);
    }

    clear() {
        this.ensureStorage().removeItem(this.storageKey);
    }

    count() {
        return this.load().length;
    }

    snapshot() {
        return this.load().map(entry => ({
            ...entry,
            record: entry.record ? { ...entry.record } : undefined,
            ledger: entry.ledger ? { ...entry.ledger } : undefined,
            stockLog: entry.stockLog ? { ...entry.stockLog } : undefined
        }));
    }

    roomIdFromAttendanceKey(key) {
        const match = String(key || "").match(/^(.*)_\d{4}-\d{2}-\d{2}$/);
        return match ? match[1] : "";
    }

    operationType(value) {
        const normalized = String(value || "ATTENDANCE").trim().toUpperCase();
        return ["ATTENDANCE", "PENDING", "ROLLBACK"].includes(normalized)
            ? normalized
            : "ATTENDANCE";
    }

    nonNegativeInteger(value, fallback = 0) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 0 ? number : fallback;
    }

    timestamp(value, fallback = Date.now()) {
        const number = Number(value);
        return Number.isFinite(number) && number >= 0 ? number : fallback;
    }
}

window.QueueStorage = new QueueStorage();
