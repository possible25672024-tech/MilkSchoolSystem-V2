class BaseRepository {

    getDB() {

        return firebase.database();

    }

    ref(path) {

        return this.getDB().ref(path);

    }

    async get(path) {

        const snapshot = await this.ref(path).once("value");

        return snapshot.val();

    }

    async set(path,data){

        await this.ref(path).set(data);

    }

    async update(path,data){

        await this.ref(path).update(data);

    }

    async remove(path){

        await this.ref(path).remove();

    }

}

window.BaseRepository = BaseRepository;