class ConfigManager {
    constructor() {
        this.runtime = {};
    }

    setRuntimeConfig(config = {}) {
        this.runtime = { ...this.runtime, ...config };
        return this.getRuntimeConfig();
    }

    setFirebaseRuntimeConfig(config = {}, persist = false) {
        this.runtime = {
            ...this.runtime,
            firebase: {
                ...(this.runtime.firebase || {}),
                ...config
            }
        };

        if (persist) {
            if (config.databaseURL !== undefined) {
                localStorage.setItem("firebaseUrl", String(config.databaseURL || ""));
            }
        }

        return this.getFirebaseConfig();
    }

    getRuntimeConfig() {
        return { ...this.runtime };
    }

    getAppConfig() {
        return { ...(window.APP_CONFIG || {}), ...(this.runtime.app || {}) };
    }

    getLegacyDatabaseConfig() {
        try {
            const raw = localStorage.getItem("milk_school_db");
            if (!raw) {
                return {};
            }

            const parsed = JSON.parse(raw);
            const settings = parsed?.settings || {};

            return { databaseURL: settings.firebaseUrl || "" };
        } catch (error) {
            console.warn("ConfigManager: legacy database configuration is invalid.", error);
            return {};
        }
    }

    getFirebaseConfig() {
        const fileConfig = window.firebaseConfig || {};
        const runtimeConfig = this.runtime.firebase || {};
        const legacyConfig = this.getLegacyDatabaseConfig();

        const databaseURL = [
            runtimeConfig.databaseURL,
            fileConfig.databaseURL,
            localStorage.getItem("firebaseUrl"),
            legacyConfig.databaseURL
        ].find(value => String(value || "").trim()) || "";

        return {
            ...fileConfig,
            ...legacyConfig,
            ...runtimeConfig,
            databaseURL: String(databaseURL).trim().replace(/\/+$/, "")
        };
    }

    getDatabaseURL() {
        return this.getFirebaseConfig().databaseURL;
    }

    getAuthToken() {
        return "";
    }
}

window.ConfigManager = new ConfigManager();
