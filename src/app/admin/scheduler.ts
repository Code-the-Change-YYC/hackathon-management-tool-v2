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
	bufferTime: number = 5
): AssignmentSlot[] {
	
  const schedule: AssignmentSlot[] = [];

  if (judges.length === 0) {
    throw new Error("No judges available");
  }

  if (teams.length === 0) return [];

  let currentTime = new Date(startTime);
  let teamIndex = 0;

  while (teamIndex < teams.length) {

    for (let j = 0; j < judges.length && teamIndex < teams.length; j++) {
      const team = teams[teamIndex]!;
      const judge = judges[j]!;

      schedule.push({
        teamId: team.id,
        judgeId: judge.id,
        start: new Date(currentTime),
      });

      teamIndex++;

      currentTime = new Date(
        currentTime.getTime() + (duration + bufferTime) * 60000
      );
    }
  }
  return schedule;
}
