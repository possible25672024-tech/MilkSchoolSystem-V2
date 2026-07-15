async start(){

    console.log("MilkSchoolSystem V2 Started");

    const rooms = await window.RoomRepository.loadRooms();

    console.log(rooms);

}