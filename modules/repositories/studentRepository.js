/**
 * Student Repository
 */

class StudentRepository {

    async getStudents() {
        console.log("Load Students");
        return [];
    }

    async saveStudent(data) {
        console.log("Save Student");
        return true;
    }

}

window.StudentRepository = new StudentRepository();