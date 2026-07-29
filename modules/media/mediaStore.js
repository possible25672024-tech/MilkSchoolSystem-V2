class IndexedDbMediaAdapter {
    constructor(options = {}) {
        this.indexedDB = options.indexedDB || window.indexedDB;
        this.databaseName = options.databaseName || "MilkSchoolSystemMediaV1";
        this.storeName = options.storeName || "payloads";
        this.version = 1;
        this.databasePromise = null;
    }

    ensureAvailable() {
        if (!this.indexedDB?.open) {
            throw new Error("IndexedDB media storage is not available.");
        }
        return this.indexedDB;
    }

    open() {
        if (this.databasePromise) return this.databasePromise;
        this.databasePromise = new Promise((resolve, reject) => {
            const request = this.ensureAvailable().open(this.databaseName, this.version);
            request.onupgradeneeded = () => {
                const database = request.result;
                if (!database.objectStoreNames.contains(this.storeName)) {
                    const store = database.createObjectStore(this.storeName, { keyPath: "id" });
                    store.createIndex("recordKey", "recordKey", { unique: false });
                    store.createIndex("kind", "kind", { unique: false });
                    store.createIndex("createdAt", "createdAt", { unique: false });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error || new Error("Unable to open media storage."));
            request.onblocked = () => reject(new Error("Media storage upgrade is blocked."));
        });
        return this.databasePromise;
    }

    async transact(mode, action) {
        const database = await this.open();
        return new Promise((resolve, reject) => {
            const transaction = database.transaction(this.storeName, mode);
            const store = transaction.objectStore(this.storeName);
            let request;
            try {
                request = action(store);
            } catch (error) {
                reject(error);
                return;
            }
            if (request) {
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error || new Error("Media storage request failed."));
            } else {
                transaction.oncomplete = () => resolve(undefined);
            }
            transaction.onerror = () => reject(transaction.error || new Error("Media storage transaction failed."));
            transaction.onabort = () => reject(transaction.error || new Error("Media storage transaction was aborted."));
        });
    }

    put(record) {
        return this.transact("readwrite", store => store.put(record));
    }

    get(id) {
        return this.transact("readonly", store => store.get(id));
    }

    delete(id) {
        return this.transact("readwrite", store => store.delete(id));
    }

    clear() {
        return this.transact("readwrite", store => store.clear());
    }

    async list() {
        return this.transact("readonly", store => store.getAll());
    }
}

class MediaStore {
    constructor(adapter = null, policy = window.MediaPolicy, options = {}) {
        this.adapter = adapter || new IndexedDbMediaAdapter(options.indexedDb || {});
        this.policy = policy;
        this.clock = options.clock || (() => Date.now());
        this.allowedKinds = new Set(["photo", "thumbnail", "signature"]);
    }

    ensureDependencies() {
        if (!this.adapter?.put || !this.adapter?.get || !this.adapter?.delete || !this.adapter?.list) {
            throw new Error("A media storage adapter is required.");
        }
        if (!this.policy?.validateProcessedPhoto || !this.policy?.validateSignature) {
            throw new Error("MediaPolicy is required for media storage.");
        }
    }

    normalizeId(value) {
        const id = String(value || "").trim();
        if (!/^[a-zA-Z0-9._-]{8,128}$/.test(id)) {
            throw this.error("MEDIA_ID_INVALID", "Media ID is invalid.");
        }
        return id;
    }

    normalizeKind(value) {
        const kind = String(value || "").trim().toLowerCase();
        if (!this.allowedKinds.has(kind)) {
            throw this.error("MEDIA_KIND_INVALID", "Media kind is invalid.", { kind });
        }
        return kind;
    }

    validateEntry(entry = {}) {
        this.ensureDependencies();
        const id = this.normalizeId(entry.id);
        const kind = this.normalizeKind(entry.kind);
        const dataUrl = String(entry.dataUrl || entry.payload || "");
        const width = Number(entry.width || 0);
        const height = Number(entry.height || 0);
        const validation = kind === "signature"
            ? this.policy.validateSignature({ dataUrl, mime: entry.mime, size: entry.size })
            : this.policy.validateProcessedPhoto({
                dataUrl,
                mime: entry.mime,
                size: entry.size,
                width,
                height
            });
        if (!validation.valid) {
            throw this.error(validation.code || "MEDIA_PAYLOAD_INVALID", validation.message || "Media payload is invalid.", validation.details);
        }
        return {
            id,
            kind,
            dataUrl,
            mime: validation.details.mime,
            size: validation.details.size,
            width: kind === "signature" ? Math.max(0, width) : validation.details.width,
            height: kind === "signature" ? Math.max(0, height) : validation.details.height,
            recordKey: String(entry.recordKey || "").trim(),
            ownerKey: String(entry.ownerKey || "").trim(),
            createdAt: Number.isFinite(Number(entry.createdAt)) ? Number(entry.createdAt) : this.clock()
        };
    }

    async put(entry = {}) {
        const normalized = this.validateEntry(entry);
        await this.adapter.put({ ...normalized, payload: normalized.dataUrl, dataUrl: undefined });
        return this.buildReference(normalized);
    }

    async getMetadata(id) {
        this.ensureDependencies();
        const record = await this.adapter.get(this.normalizeId(id));
        return record ? this.buildReference(record) : null;
    }

    async getPayload(id) {
        this.ensureDependencies();
        const record = await this.adapter.get(this.normalizeId(id));
        if (!record) return null;
        return {
            ...this.buildReference(record),
            dataUrl: String(record.payload || "")
        };
    }

    async listMetadata(filter = {}) {
        this.ensureDependencies();
        const records = await this.adapter.list();
        const recordKey = String(filter.recordKey || "").trim();
        const kind = String(filter.kind || "").trim().toLowerCase();
        return (Array.isArray(records) ? records : [])
            .filter(record => !recordKey || record.recordKey === recordKey)
            .filter(record => !kind || record.kind === kind)
            .map(record => this.buildReference(record));
    }

    async remove(id) {
        this.ensureDependencies();
        const normalizedId = this.normalizeId(id);
        const existing = await this.getMetadata(normalizedId);
        await this.adapter.delete(normalizedId);
        return existing;
    }

    async clear() {
        this.ensureDependencies();
        await this.adapter.clear?.();
    }

    buildReference(record = {}) {
        return {
            mediaId: String(record.id || record.mediaId || ""),
            kind: String(record.kind || ""),
            mime: String(record.mime || ""),
            size: Number(record.size || 0),
            width: Number(record.width || 0),
            height: Number(record.height || 0),
            recordKey: String(record.recordKey || ""),
            ownerKey: String(record.ownerKey || ""),
            createdAt: Number(record.createdAt || 0)
        };
    }

    isReference(value) {
        return Boolean(
            value &&
            typeof value === "object" &&
            /^[a-zA-Z0-9._-]{8,128}$/.test(String(value.mediaId || "")) &&
            !String(value.dataUrl || value.payload || "").startsWith("data:")
        );
    }

    buildId(prefix = "media", seed = "") {
        const normalizedPrefix = String(prefix || "media").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "media";
        const input = `${normalizedPrefix}:${String(seed || "")}:${this.clock()}`;
        let first = 2166136261;
        let second = 2246822519;
        for (let index = 0; index < input.length; index += 1) {
            const code = input.charCodeAt(index);
            first ^= code;
            first = Math.imul(first, 16777619);
            second ^= code + index;
            second = Math.imul(second, 3266489917);
        }
        return `${normalizedPrefix}-${this.hex(first)}${this.hex(second)}`;
    }

    error(code, message, details = {}) {
        const error = new Error(message);
        error.code = code;
        error.details = details;
        return error;
    }

    hex(value) {
        return (value >>> 0).toString(16).padStart(8, "0");
    }
}

window.IndexedDbMediaAdapterClass = IndexedDbMediaAdapter;
window.MediaStoreClass = MediaStore;
window.MediaStore = new MediaStore();
