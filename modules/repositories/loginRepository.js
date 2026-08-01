class LoginRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child) {
        return `${this.appRoot}/${String(child || "").replace(/^\/+/, "")}`;
    }

    loadPublicLoginDirectory() {
        return this.get(this.path("public/loginDirectory"));
    }

    loadAuthorizedUser(uid) {
        const normalized = String(uid || "").trim();
        if (!normalized) throw new Error("An authenticated Firebase UID is required.");
        return this.get(this.path(`accessControl/users/${normalized}`));
    }

    loadSettings() {
        return this.get(this.path("settings"));
    }

    loadRoom(roomId) {
        const normalized = String(roomId || "").trim();
        if (!normalized || normalized === "__admin__") {
            throw new Error("A valid room id is required.");
        }
        return this.get(this.path(`rooms/${normalized}`));
    }

    async loadAuthenticatedContext(uid, roomId = null) {
        const profile = await this.loadAuthorizedUser(uid);
        const [settings, room] = await Promise.all([
            this.loadSettings(),
            roomId ? this.loadRoom(roomId) : Promise.resolve(null)
        ]);

        return {
            profile: profile || null,
            settings: settings || {},
            room: room || null
        };
    }
}

window.LoginRepository = new LoginRepository();
