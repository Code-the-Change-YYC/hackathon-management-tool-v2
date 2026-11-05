// Each participant contributes once to every round they have completed.
export function mealRoundCounts(attendance: { user: { id: string } }[]) {
	const scansByUser = new Map<string, number>();
	for (const { user } of attendance) {
		scansByUser.set(user.id, (scansByUser.get(user.id) ?? 0) + 1);
	}

	const rounds: number[] = [];
	for (const scans of scansByUser.values()) {
		for (let index = 0; index < scans; index++) {
			rounds[index] = (rounds[index] ?? 0) + 1;
		}
	}
	return rounds;
}
