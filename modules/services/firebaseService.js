class FirebaseService {
    constructor() {
        this.databaseURL = "";
        this.authToken = "";
        this.requestTimeoutMs = 15000;
    }

    initialize(config = window.ConfigManager?.getFirebaseConfig?.() || {}) {
        this.databaseURL = String(
            config.databaseURL || window.ConfigManager?.getDatabaseURL?.() || ""
        ).replace(/\/+$/, "");
        this.authToken = String(config.authToken || "");
        this.requestTimeoutMs = Number(config.requestTimeoutMs) || 15000;

        if (!this.databaseURL) {
            throw new Error("Firebase Realtime Database URL is not configured.");
        }

        return this;
    }

    buildURL(path = "") {
        if (!this.databaseURL) {
            this.initialize();
        }

        const cleanPath = String(path).replace(/^\/+|\/+$/g, "");
        const authQuery = this.authToken
            ? `?auth=${encodeURIComponent(this.authToken)}`
            : "";

        return `${this.databaseURL}/${cleanPath}.json${authQuery}`;
    }

    async request(path, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.requestTimeoutMs);

        try {
            const response = await fetch(this.buildURL(path), {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                },
                signal: options.signal || controller.signal
            });

            if (!response.ok) {
                const message = await response.text();
                throw new Error(`Firebase request failed (${response.status}): ${message}`);
            }

            if (response.status === 204) {
                return null;
            }

            return await response.json();
        } finally {
            clearTimeout(timeoutId);
        }
    }

    get(path) {
        return this.request(path, { method: "GET" });
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
