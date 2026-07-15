class StudentRepository extends BaseRepository {

    async loadStudents(){

        return await this.get("students");

    }

    async saveStudent(id,data){

        await this.set("students/"+id,data);

    }

}

window.StudentRepository=new StudentRepository();