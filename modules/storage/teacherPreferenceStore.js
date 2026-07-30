class TeacherPreferenceStore {
    constructor(storage = window.localStorage, options = {}) {
        this.storage = storage;
        this.key = String(options.key || "milkapp_teacher_preferences_v1");
    }

    requireRoomId(roomId) {
        const normalized = String(roomId || "").trim();
        if (!normalized || normalized === "__admin__") {
            throw new Error("Teacher room id is required for local preferences.");
        }
        return normalized;
    }

    loadAll() {
        try {
            const parsed = JSON.parse(this.storage?.getItem?.(this.key) || "{}");
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed
                : {};
        } catch (error) {
            return {};
        }
    }

    load(roomId) {
        const normalizedRoomId = this.requireRoomId(roomId);
        const value = this.loadAll()[normalizedRoomId];
        return value && typeof value === "object" && !Array.isArray(value)
            ? { ...value }
            : {};
    }

    save(roomId, preferences = {}) {
        const normalizedRoomId = this.requireRoomId(roomId);
        const safe = {
            defaultReportDays: Number(preferences.defaultReportDays),
            compactMode: preferences.compactMode === true,
            rememberLastSection: preferences.rememberLastSection !== false,
            lastSection: String(preferences.lastSection || "overview")
        };
        const all = this.loadAll();
        all[normalizedRoomId] = safe;
        this.storage?.setItem?.(this.key, JSON.stringify(all));
        return { ...safe };
    }
}

window.TeacherPreferenceStoreClass = TeacherPreferenceStore;
window.TeacherPreferenceStore = new TeacherPreferenceStore();
