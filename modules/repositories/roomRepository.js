class RoomRepository extends BaseRepository {

    async loadRooms(){

        return await this.get("rooms");

    }

    async saveRoom(id,data){

        await this.set("rooms/"+id,data);

    }

}

window.RoomRepository=new RoomRepository();