type Team = {
  id: string;
  name: string;
};

type Room = {
  id: string;
  name: string;
  judge: string;
};

type TimeSlot = {
  teamId: string;
  teamName: string;
  roomId: string;
  roomName: string;
  judgeName: string;
  start: Date;
  end: Date;
};


export function createSchedule(
	teams: Team[],
	rooms: Room[],
	startTime: Date,
  duration: number,
  bufferTime: number  = 5
) {
  const schedule: TimeSlot[] = [];
  
  let currentTime = new Date(startTime);
  
  // Process team in batches equal to number of rooms
  for (let i = 0; i < teams.length; i += rooms.length) {  

    const batch = teams.slice(i, i + rooms.length);

    batch.forEach((team, index) => {
      
      const room = rooms[index];

      if (!room) return;

      schedule.push({
        teamId: team.id,
        teamName: team.name,
        roomId: room.id,
        roomName: room.name,
        judgeName: room.judge,
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + duration * 60000),
      });
    })

    // Move time forward after batch completes
    currentTime = new Date(
      currentTime.getTime() + (duration + bufferTime) * 60000
    );
 
  }
  return schedule;
}
