class Bootstrap {

    async start() {

        console.log("================================");
        console.log("MilkSchoolSystem V2");
        console.log("Bootstrap Starting...");
        console.log("================================");

        console.log("APP CONFIG");
        console.log(window.APP_CONFIG);

        console.log("SCHOOL");
        console.log(window.SCHOOL);

        console.log("FIREBASE");
        console.log(window.firebaseConfig);

        console.log("THEME");
        console.log(window.THEME);

        await window.App.start();

    }

}

window.Bootstrap = new Bootstrap();

window.addEventListener("DOMContentLoaded", () => {

    window.Bootstrap.start();

});