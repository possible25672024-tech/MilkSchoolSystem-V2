class FirebaseService {
    constructor() {
        this.databaseURL = "";
        this.authToken = "";
        this.requestTimeoutMs = 15000;
        this.inflightGets = new Map();
    }

    initialize(config = window.ConfigManager?.getFirebaseConfig?.() || {}) {
        this.databaseURL = String(
            config.databaseURL || window.ConfigManager?.getDatabaseURL?.() || ""
        ).trim().replace(/\/+$/, "");
        this.authToken = String(
            config.authToken || window.ConfigManager?.getAuthToken?.() || ""
        ).trim();
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

            params.set(key, this.encodeQueryValue(value));
        });

        if (this.authToken) {
            params.set("auth", this.authToken);
        }

        const queryString = params.toString();
        return `${this.databaseURL}/${cleanPath}.json${queryString ? `?${queryString}` : ""}`;
    }

    async request(path, options = {}, query = {}) {
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

            if (!response.ok) {
                const message = await response.text();
                throw new Error(`Firebase request failed (${response.status}): ${message}`);
            }

            if (response.status === 204) {
                return null;
            }

            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            if (error?.name === "AbortError") {
                throw new Error(`Firebase request timed out after ${this.requestTimeoutMs} ms.`);
            }

            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
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
