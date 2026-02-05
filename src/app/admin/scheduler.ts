export function createSchedule(
	teams: any[],
	rooms: any[],
	startTime: Date,
	duration: number,
) {
	const schedule: {
		teamName: string;
		roomName: string;
		judgeName: string;
		start: Date;
		end: Date;
	}[] = [];
	let currentTime = new Date(startTime);
	let roomIndex = 0;
	const bufferTime = 5;

	teams.forEach((team) => {
		const timeSlot = {
			teamName: team.name,
			roomName: rooms[roomIndex].name,
			judgeName: rooms[roomIndex].judge,
			start: new Date(currentTime),
			end: new Date(currentTime.getTime() + duration * 60000),
		};

		schedule.push(timeSlot);

		roomIndex++;

		if (roomIndex >= rooms.length) {
			roomIndex = 0;
			currentTime = new Date(
				currentTime.getTime() + (duration + bufferTime) * 60000,
			);
		}
	});

	return schedule;
}
