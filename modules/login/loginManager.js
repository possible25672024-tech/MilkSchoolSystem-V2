class LoginManager {

    constructor() {

        this.currentUser = null;

    }

    async login(username,password){

    return await window.LoginService.login(

        username,

        password

    );

}
    logout(){

        console.log("Logout");

    }

}

window.LoginManager = new LoginManager();