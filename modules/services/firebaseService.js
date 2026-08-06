class FirebaseService {
    constructor() {
        this.databaseURL = "";
        this.authToken = "";
        this.authTokenProvider = null;
        this.requestTimeoutMs = 15000;
        this.inflightGets = new Map();
        this.readOnlyMode = false;
        this.backupMode = false;
        this.backupData = null;
        this.backupEtag = "";
    }

     initialize(config = window.ConfigManager?.getFirebaseConfig?.() || {}) {
    const appConfig = window.ConfigManager?.getAppConfig?.() || window.APP_CONFIG || {};

    this.readOnlyMode = Boolean(
        config.legacyReadOnly ||
        config.readOnly ||
        appConfig.legacyReadOnly ||
        appConfig.mode === "LEGACY_READ_ONLY" ||
        appConfig.mode === "OFFLINE_READ_ONLY" ||
        config.mode === "OFFLINE_READ_ONLY"
    );

    this.backupMode = Boolean(
        appConfig.mode === "OFFLINE_READ_ONLY" ||
        config.mode === "OFFLINE_READ_ONLY" ||
        config.offlineMode === true
    );

    this.databaseURL = String(
        this.backupMode
            ? ""
            : config.databaseURL || window.ConfigManager?.getDatabaseURL?.() || ""
    ).trim().replace(/\/+$/, "");

    this.authToken = "";
    this.requestTimeoutMs = Number(config.requestTimeoutMs) || 15000;
    this.inflightGets.clear();

    if (this.backupMode) {
        const backupUrl = String(
            config.offlineBackupUrl ||
            appConfig.offlineBackupUrl ||
            ""
        ).trim();

        if (!backupUrl) {
            throw new Error("Offline backup URL is not configured.");
        }

        return this.loadBackup(backupUrl).then(() => this);
    }

    if (!this.databaseURL) {
        throw new Error(
            "Firebase Realtime Database URL is not configured."
        );
    }

    return this;
}

    isConfigured() {
        return Boolean(this.backupMode || this.databaseURL || window.ConfigManager?.getDatabaseURL?.());
    }

    setAuthToken(token = "") {
        const normalized = String(token || "").trim();
        if (normalized !== this.authToken) this.inflightGets.clear();
        this.authToken = normalized;
        return this;
    }

    setAuthTokenProvider(provider = null) {
        this.authTokenProvider = typeof provider === "function" ? provider : null;
        return this;
    }

    async refreshAuthToken() {
        if (!this.authTokenProvider) return this.authToken;
        const token = await this.authTokenProvider();
        this.setAuthToken(token || "");
        return this.authToken;
    }

    encodeQueryValue(value) {
        if (typeof value === "string") {
            return JSON.stringify(value);
        }

        if (typeof value === "number" || typeof value === "boolean") {
            return JSON.stringify(value);
        }

        return JSON.stringify(value);
    }

    throwOfflineError(code = "OFFLINE_READ_ONLY_WRITE_BLOCKED") {
        const error = new Error(
            code === "OFFLINE_READ_ONLY_NETWORK_BLOCKED"
                ? "Firebase network access is blocked in offline read-only mode."
                : "Firebase write operations are blocked in offline read-only mode."
        );
        error.code = code;
        throw error;
    }

    buildURL(path = "", query = {}) {
        if (this.backupMode) {
            this.throwOfflineError("OFFLINE_READ_ONLY_NETWORK_BLOCKED");
        }

        if (!this.databaseURL) {
            this.initialize();
        }

        const cleanPath = String(path).replace(/^\/+|\/+$/g, "");
        const params = new URLSearchParams();

        Object.entries(query || {}).forEach(([key, value]) => {
            if (value === undefined || value === null || value === "") {
                return;
            }

            const rawParameters = new Set(["print", "format", "download"]);
            params.set(key, rawParameters.has(key)
                ? String(value)
                : this.encodeQueryValue(value));
        });

        if (this.authToken) {
            params.set("auth", this.authToken);
        }

        const queryString = params.toString();
        return `${this.databaseURL}/${cleanPath}.json${queryString ? `?${queryString}` : ""}`;
    }

    parseResponseText(text) {
        if (!text) {
            return null;
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            return text;
        }
    }
    async initializeOffline(config = {}) {
        const appConfig = window.ConfigManager?.getAppConfig?.() || {};
        const backupUrl = String(
            config.backupURL ||
            config.backupUrl ||
            config.offlineBackupURL ||
            config.offlineBackupUrl ||
            appConfig.offlineBackupURL ||
            appConfig.offlineBackupUrl ||
            ""
        ).trim();

        if (!backupUrl) {
            throw new Error("Offline backup URL is not configured.");
        }

        this.databaseURL = "";
        this.readOnlyMode = true;
        this.inflightGets.clear();
        await this.loadBackup(backupUrl);
        return this;
    }

    async loadBackup(url) {
        if (!url) {
            throw new Error("Offline backup URL is not configured.");
        }

        const response = await fetch(url, {
            method: "GET",
            cache: "no-store"
        });
        if (!response.ok) {
            throw new Error(`Offline backup file could not be loaded (${response.status}).`);
        }

        const raw = await response.json();
        const payload =
            raw?.envelope?.data?.milkApp ||
            raw?.envelope?.data ||
            raw?.data?.milkApp ||
            raw?.data ||
            raw?.milkApp ||
            raw;
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw new Error("Offline backup file does not contain valid milkApp data.");
        }

        this.backupMode = true;
        this.backupData = { milkApp: payload };
        this.backupEtag = '"offline-read-only"';
        return this.backupData;
    }

    setBackupData(data = {}) {
        const payload =
            data?.envelope?.data?.milkApp ||
            data?.envelope?.data ||
            data?.data?.milkApp ||
            data?.data ||
            data?.milkApp ||
            data;
        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            throw new Error("Offline backup file does not contain valid milkApp data.");
        }
        this.backupMode = true;
        this.backupData = { milkApp: payload };
        this.backupEtag = '"offline-read-only"';
        return this;
    }

    computeBackupEtag(value) {
        const stable = this.stableJson(value);
        let hash = 0;
        for (let i = 0; i < stable.length; i += 1) {
            hash = ((hash << 5) - hash) + stable.charCodeAt(i);
            hash |= 0;
        }
        return `offline-${(hash >>> 0).toString(16).padStart(8, "0")}`;
    }

    stableJson(value) {
        if (value === null || typeof value !== "object") {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return `[${value.map(item => this.stableJson(item)).join(",")}]`;
        }
        const keys = Object.keys(value).sort();
        return `{${keys.map(key => `${JSON.stringify(key)}:${this.stableJson(value[key])}`).join(",")}}`;
    }

    lookupPath(path = "") {
        if (!this.backupMode) {
            return null;
        }

        const cleanPath = String(path || "").replace(/^\/+|\/+$/g, "");
        if (!cleanPath) {
            return this.backupData;
        }

        const parts = cleanPath.split("/").map(segment => decodeURIComponent(segment));
        let current = this.backupData;
        for (const part of parts) {
            if (!current || typeof current !== "object" || !(part in current)) {
                return null;
            }
            current = current[part];
        }
        return current;
    }

    shallowValue(value) {
        if (Array.isArray(value)) {
            return value.map(item => (item === undefined ? null : true));
        }
        if (value && typeof value === "object") {
            return Object.fromEntries(Object.keys(value).map(key => [key, true]));
        }
        return value;
    }

    cloneBackupValue(value) {
        if (value === undefined) return undefined;
        return JSON.parse(JSON.stringify(value));
    }

    applyBackupQuery(value, query = {}) {
        let result = value;

        if (
            result &&
            typeof result === "object" &&
            !Array.isArray(result) &&
            query.orderBy &&
            query.equalTo !== undefined
        ) {
            result = Object.fromEntries(
                Object.entries(result).filter(([, item]) =>
                    item &&
                    typeof item === "object" &&
                    item[query.orderBy] === query.equalTo
                )
            );
        }

        if (query.shallow === true) {
            result = this.shallowValue(result);
        }

        return this.cloneBackupValue(result);
    }

    async performBackupRequest(path, options = {}, query = {}) {
        const method = String(options.method || "GET").toUpperCase();
        if (method !== "GET" && method !== "HEAD") {
            this.throwOfflineError();
        }

        const value = this.lookupPath(path);
        const response = {
            ok: true,
            status: 200,
            headers: {
                get: name => String(name || "").toLowerCase() === "etag" ? this.backupEtag : null
            }
        };

        if (query?.print === "silent") {
            return { response, text: "", data: null };
        }

        const data = this.applyBackupQuery(value, query);
        const text = data === undefined ? "null" : JSON.stringify(data);
        return { response, text, data };
    }

    async performRequest(path, options = {}, query = {}) {
        const method = String(options.method || "GET").toUpperCase();
        if (this.backupMode) {
            if (["GET", "HEAD"].includes(method)) {
                return this.performBackupRequest(path, options, query);
            }
            this.throwOfflineError();
        }

        await this.refreshAuthToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);
        const headers = { ...(options.headers || {}) };
        const hasContentType = Object.keys(headers).some(
            headerName => headerName.toLowerCase() === "content-type"
        );

        // A Content-Type: application/json header on a body-less GET triggers an
        // unnecessary CORS preflight in browsers. Add it only for JSON writes.
        if (options.body !== undefined && !hasContentType) {
            headers["Content-Type"] = "application/json";
        }

        if (this.readOnlyMode && method !== "GET" && method !== "HEAD") {
            throw new Error("Firebase write operations are blocked in legacy read-only mode.");
        }

        try {
            const response = await fetch(this.buildURL(path, query), {
                cache: "no-store",
                ...options,
                method,
                headers,
                signal: options.signal || controller.signal
            });
            const text = response.status === 204 ? "" : await response.text();

            return {
                response,
                text,
                data: this.parseResponseText(text)
            };
        } catch (error) {
            if (error?.name === "AbortError") {
                throw new Error(`Firebase request timed out after ${this.requestTimeoutMs} ms.`);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    async request(path, options = {}, query = {}) {
        const result = await this.performRequest(path, options, query);

        if (!result.response.ok) {
            throw new Error(`Firebase request failed (${result.response.status}): ${result.text}`);
        }

        return result.response.status === 204 ? null : result.data;
    }

    get(path, query = {}) {
        const requestKey = this.backupMode
            ? `${String(path || "")}|${JSON.stringify(query || {})}`
            : this.buildURL(path, query);
        const existing = this.inflightGets.get(requestKey);
        if (existing) {
            return existing;
        }

        const request = this.request(path, { method: "GET" }, query)
            .finally(() => {
                if (this.inflightGets.get(requestKey) === request) {
                    this.inflightGets.delete(requestKey);
                }
            });

        this.inflightGets.set(requestKey, request);
        return request;
    }

    async getWithEtag(path, query = {}) {
        if (this.backupMode) {
            const value = this.lookupPath(path);
            const data = this.applyBackupQuery(value, query);

            return {
                value: query?.print === "silent" ? null : data,
                etag: '"offline-read-only"',
                status: 200
            };
        }

        const result = await this.performRequest(path, {
            method: "GET",
            headers: {
                "X-Firebase-ETag": "true"
            }
        }, query);

        if (!result.response.ok) {
            throw new Error(`Firebase ETag read failed (${result.response.status}): ${result.text}`);
        }

        const etag = result.response.headers?.get?.("ETag") || result.response.headers?.get?.("etag") || "";
        if (!etag) {
            throw new Error("Firebase ETag read did not return an ETag header.");
        }

        return {
            value: result.response.status === 204 ? null : result.data,
            etag,
            status: result.response.status
        };
    }

    async setIfMatch(path, data, etag) {
        const normalizedEtag = String(etag || "").trim();
        if (!normalizedEtag) {
            throw new Error("An ETag is required for a conditional Firebase write.");
        }

        const result = await this.performRequest(path, {
            method: "PUT",
            headers: {
                "If-Match": normalizedEtag
            },
            body: JSON.stringify(data)
        });

        if (result.response.status === 412) {
            return {
                status: "conflict",
                value: result.data,
                etag: result.response.headers?.get?.("ETag") || result.response.headers?.get?.("etag") || ""
            };
        }

        if (!result.response.ok) {
            throw new Error(`Firebase conditional write failed (${result.response.status}): ${result.text}`);
        }

        return {
            status: "ok",
            value: result.response.status === 204 ? data : result.data,
            etag: result.response.headers?.get?.("ETag") || result.response.headers?.get?.("etag") || ""
        };
    }

    set(path, data) {
        if (this.backupMode) {
            this.throwOfflineError();
        }

        return this.request(path, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    }

    update(path, data) {
        if (this.backupMode) {
            this.throwOfflineError();
        }

        return this.request(path, {
            method: "PATCH",
            body: JSON.stringify(data)
        });
    }

    remove(path) {
        if (this.backupMode) {
            this.throwOfflineError();
        }

        return this.request(path, { method: "DELETE" });
    }

    push(path, data) {
        if (this.backupMode) {
            this.throwOfflineError();
        }

        return this.request(path, {
            method: "POST",
            body: JSON.stringify(data)
        });
    }

    transaction(path, updater) {
        if (this.backupMode) {
            this.throwOfflineError();
        }

        throw new Error("Firebase transaction is not available through this service.");
    }
}

window.FirebaseService = new FirebaseService();
