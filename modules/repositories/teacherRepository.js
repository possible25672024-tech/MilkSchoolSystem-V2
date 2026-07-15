class TeacherRepository extends BaseRepository {

    async loadTeachers(){

        return await this.get("teachers");

    }

    async saveTeacher(id,data){

        await this.set("teachers/"+id,data);

    }

}

window.TeacherRepository=new TeacherRepository();