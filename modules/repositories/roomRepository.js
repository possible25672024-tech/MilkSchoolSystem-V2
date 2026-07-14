/**
 * Room Repository
 */

class RoomRepository {

    async getRooms() {
        console.log("Load Rooms");
        return [];
    }

    async saveRoom(room) {
        console.log("Save Room");
        return true;
    }

}

window.RoomRepository = new RoomRepository();