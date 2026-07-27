class LoginRepository extends BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        super(firebaseService);
        this.appRoot = "milkApp";
    }

    path(child) {
        return `${this.appRoot}/${String(child || "").replace(/^\/+/, "")}`;
    }

    loadSettings() {
        return this.get(this.path("settings"));
    }

    loadRooms() {
        return this.get(this.path("rooms"));
    }

    loadUsers() {
        return this.get(this.path("users"));
    }

    async loadLoginContext() {
        const [settings, rooms] = await Promise.all([
            this.loadSettings(),
            this.loadRooms()
        ]);

        return {
            settings: settings || {},
            rooms: rooms || []
        };
    }
}

window.LoginRepository = new LoginRepository();
