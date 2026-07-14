/**
 * Teacher Repository
 */

class TeacherRepository {

    async getTeachers() {
        console.log("Load Teachers");
        return [];
    }

    async saveTeacher(data) {
        console.log("Save Teacher");
        return true;
    }

}

window.TeacherRepository = new TeacherRepository();