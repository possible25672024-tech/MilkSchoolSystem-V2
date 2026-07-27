class ConfigManager {
    constructor() {
        this.runtime = {};
    }

    setRuntimeConfig(config = {}) {
        this.runtime = { ...this.runtime, ...config };
        return this.getRuntimeConfig();
    }

    getRuntimeConfig() {
        return { ...this.runtime };
    }

    getAppConfig() {
        return { ...(window.APP_CONFIG || {}), ...(this.runtime.app || {}) };
    }

    getFirebaseConfig() {
        return { ...(window.firebaseConfig || {}), ...(this.runtime.firebase || {}) };
    }

    getDatabaseURL() {
        const runtimeUrl = this.getFirebaseConfig().databaseURL;
        const savedUrl = localStorage.getItem("firebaseUrl");
        return String(runtimeUrl || savedUrl || "").replace(/\/+$/, "");
    }
}

window.ConfigManager = new ConfigManager();
