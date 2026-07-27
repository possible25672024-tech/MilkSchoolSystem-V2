class BaseRepository {
    constructor(firebaseService = window.FirebaseService) {
        this.firebaseService = firebaseService;
    }

    ensureService() {
        if (!this.firebaseService) {
            this.firebaseService = window.FirebaseService;
        }

        if (!this.firebaseService) {
            throw new Error("FirebaseService is not available.");
        }

        return this.firebaseService;
    }

    get(path) {
        return this.ensureService().get(path);
    }

    set(path, data) {
        return this.ensureService().set(path, data);
    }

    update(path, data) {
        return this.ensureService().update(path, data);
    }

    remove(path) {
        return this.ensureService().remove(path);
    }

    push(path, data) {
        return this.ensureService().push(path, data);
    }
}

window.BaseRepository = BaseRepository;
