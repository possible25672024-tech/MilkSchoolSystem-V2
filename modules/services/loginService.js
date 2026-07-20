class LoginService {

    async login(username,password){

        console.log("Checking Login");

        const teachers=await window.LoginRepository.loadTeachers();

        console.log(teachers);

        return true;

    }

}

window.LoginService=new LoginService();