class LoginRepository extends BaseRepository {

    async loadUsers() {

        return await this.get("users");

    }

    async loadTeachers() {

        return await this.get("teachers");

    }

    async loadAdmins() {

        return await this.get("admins");

    }

}

window.LoginRepository = new LoginRepository();