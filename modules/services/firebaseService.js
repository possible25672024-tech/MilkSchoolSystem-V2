class FirebaseService {
    constructor() {
        this.databaseURL = "";
        this.authToken = "";
        this.authTokenProvider = null;
        this.requestTimeoutMs = 15000;
        this.inflightGets = new Map();
    }

    initialize(config = window.ConfigManager?.getFirebaseConfig?.() || {}) {
        this.databaseURL = String(
            config.databaseURL || window.ConfigManager?.getDatabaseURL?.() || ""
        ).trim().replace(/\/+$/, "");
        this.authToken = "";
        this.requestTimeoutMs = Number(config.requestTimeoutMs) || 15000;
        this.inflightGets.clear();

        if (!this.databaseURL) {
            throw new Error("Firebase Realtime Database URL is not configured.");
        }

        return this;
    }

    isConfigured() {
        return Boolean(this.databaseURL || window.ConfigManager?.getDatabaseURL?.());
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

    buildURL(path = "", query = {}) {
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

    async performRequest(path, options = {}, query = {}) {
        await this.refreshAuthToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);
        const method = String(options.method || "GET").toUpperCase();
        const headers = { ...(options.headers || {}) };
        const hasContentType = Object.keys(headers).some(
            headerName => headerName.toLowerCase() === "content-type"
        );

        // A Content-Type: application/json header on a body-less GET triggers an
        // unnecessary CORS preflight in browsers. Add it only for JSON writes.
        if (options.body !== undefined && !hasContentType) {
            headers["Content-Type"] = "application/json";
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
        const requestKey = this.buildURL(path, query);
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
        return this.request(path, {
            method: "PUT",
            body: JSON.stringify(data)
        });
    }

    update(path, data) {
        return this.request(path, {
            method: "PATCH",
            body: JSON.stringify(data)
        });
    }

    remove(path) {
        return this.request(path, { method: "DELETE" });
    }

    push(path, data) {
        return this.request(path, {
            method: "POST",
            body: JSON.stringify(data)
        });
    }
}

window.FirebaseService = new FirebaseService();
