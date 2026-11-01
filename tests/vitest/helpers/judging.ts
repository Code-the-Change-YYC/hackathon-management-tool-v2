import type { JudgeAssignment } from "@/app/components/judge/judgePortal";

type Round = JudgeAssignment["table"]["round"];

export const judgingNow = new Date("2026-09-19T10:00:00Z");

export function judgingRound(overrides: Partial<Round> = {}): Round {
	return {
		id: "round",
		name: "Round 1",
		kind: "panel",
		startTime: judgingNow,
		endTime: judgingNow,
		publishedAt: judgingNow,
		panelSize: 2,
		presentationMinutes: 8,
		changeoverMinutes: 2,
		breakMinutes: 10,
		maxBlockMinutes: 50,
		createdAt: judgingNow,
		updatedAt: judgingNow,
		...overrides
	};
}

export function judgeTable(
	overrides: Partial<JudgeAssignment["table"]> = {}
): JudgeAssignment["table"] {
	const round = overrides.round ?? judgingRound();
	return {
		id: "table",
		roundId: round.id,
		tableNumber: 1,
		createdAt: judgingNow,
		updatedAt: judgingNow,
		judges: [
			{
				id: "seat-1",
				tableId: "table",
				judgeId: "judge",
				createdAt: judgingNow,
				judge: { id: "judge", name: "Dara", image: null }
			},
			{
				id: "seat-2",
				tableId: "table",
				judgeId: "judge-2",
				createdAt: judgingNow,
				judge: { id: "judge-2", name: "Sam", image: null }
			}
		],
		...overrides,
		round
	};
}

export function judgeAssignment(
	overrides: Partial<JudgeAssignment> = {}
): JudgeAssignment {
	const table = overrides.table ?? judgeTable();
	return {
		id: "assignment",
		teamId: "team",
		tableId: table.id,
		startsAt: judgingNow,
		createdAt: judgingNow,
		scores: [],
		team: {
			id: "team",
			name: "Team",
			slug: "team",
			logo: null,
			metadata: null,
			createdAt: judgingNow,
			teamCode: "ABCD",
			prescreenStatus: "pending",
			prescreenComments: null,
			prescreenedBy: null,
			prescreenedAt: null
		},
		...overrides,
		table
	};
}

export function judgeScore(criteriaId: string, value: number) {
	return {
		id: criteriaId,
		assignmentId: "assignment",
		judgeId: "judge",
		criteriaId,
		value,
		createdAt: judgingNow
	};
}
