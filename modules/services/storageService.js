/**
 * Local Storage Service
 */

class StorageService {

    save(key, value) {

        localStorage.setItem(key, JSON.stringify(value));

    }

    load(key) {

        const data = localStorage.getItem(key);

        return data ? JSON.parse(data) : null;

    }

}

window.StorageService = new StorageService();