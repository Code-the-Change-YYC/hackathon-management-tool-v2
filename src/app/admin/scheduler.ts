type Team = {
  id: string;
};

type Judge = {
  id: string;
};

type AssignmentSlot = {
  teamId: string;
  judgeId: string;
  start: Date;
};

export function createSchedule(
	teams: Team[],
	judges: Judge[],
	startTime: Date,
  duration: number,
  bufferTime: number  = 5
): AssignmentSlot[] {


  const schedule: AssignmentSlot[] = [];
  
  let currentTime = new Date(startTime);
  
  for (let i = 0; i < teams.length; i++) {  
    
    const team = teams[i]!;
    const judge = judges[i % judges.length]!;

    schedule.push({
      teamId: team.id,
      judgeId: judge.id,
      start: new Date(currentTime),
    });

    currentTime = new Date(
      currentTime.getTime() + (duration + bufferTime) * 60000
    );
 
  }
  return schedule;
}
