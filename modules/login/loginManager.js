class LoginManager {

    constructor() {

        this.currentUser = null;

    }

    async login(username,password){

        console.log("Login...");

    }

    logout(){

        console.log("Logout");

    }

}

window.LoginManager = new LoginManager();