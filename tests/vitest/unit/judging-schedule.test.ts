import { addMinutes } from "date-fns";
import { describe, expect, it } from "vitest";
import {
	buildPanelSchedule,
	findLateTeamSlots,
	type PanelSchedule,
	type PanelScheduleInput
} from "@/lib/judging-schedule";

const start = new Date("2026-11-07T19:00:00Z");
const ids = (prefix: string, count: number) =>
	Array.from({ length: count }, (_, index) => `${prefix}-${index + 1}`);

function input(
	overrides: Partial<PanelScheduleInput> = {}
): PanelScheduleInput {
	return {
		startTime: start,
		endTime: addMinutes(start, 180),
		panelSize: 4,
		changeoverMinutes: 2,
		breakMinutes: 10,
		maxBlockMinutes: 50,
		judgeIds: ids("judge", 20),
		teamIds: ids("team", 50),
		...overrides
	};
}

function build(overrides: Partial<PanelScheduleInput> = {}) {
	const result = buildPanelSchedule(input(overrides));
	if (!result.ok) throw new Error(result.message);
	return result.schedule;
}

function expectValidSchedule(schedule: PanelSchedule, scheduleInput = input()) {
	const byTeam = new Map<string, PanelSchedule["assignments"]>();
	for (const assignment of schedule.assignments) {
		byTeam.set(assignment.teamId, [
			...(byTeam.get(assignment.teamId) ?? []),
			assignment
		]);
	}
	expect(byTeam.size).toBe(scheduleInput.teamIds.length);
	for (const visits of byTeam.values()) {
		const [first, second] = visits;
		expect(visits).toHaveLength(2);
		expect(first?.tableNumber).not.toBe(second?.tableNumber);
		expect(second?.startsAt).toEqual(
			addMinutes(first?.startsAt ?? start, schedule.slotMinutes)
		);
	}

	const tableSlots = schedule.assignments.map(
		(a) => `${a.tableNumber}@${a.startsAt.getTime()}`
	);
	expect(new Set(tableSlots).size).toBe(tableSlots.length);

	for (const assignment of schedule.assignments) {
		const endsAt = addMinutes(
			assignment.startsAt,
			schedule.presentationMinutes
		);
		expect(assignment.startsAt >= scheduleInput.startTime).toBe(true);
		expect(endsAt <= scheduleInput.endTime).toBe(true);
		for (const pause of schedule.breaks) {
			expect(
				endsAt <= pause.startsAt || assignment.startsAt >= pause.endsAt
			).toBe(true);
		}
	}
}

describe("buildPanelSchedule", () => {
	it("fits 50 teams and 20 judges into five tables of four within three hours", () => {
		const schedule = build();
		expect(schedule.tables.map((table) => table.judgeIds.length)).toEqual([
			4, 4, 4, 4, 4
		]);
		expect(schedule.waveCount).toBe(10);
		expect(schedule.presentationMinutes).toBe(5);
		expect(schedule.breaks).toHaveLength(3);
		expect(schedule.endsAt <= addMinutes(start, 180)).toBe(true);
		expectValidSchedule(schedule);
	});

	it("keeps every block within the max continuous judging time", () => {
		const schedule = build();
		const blockStarts = [start, ...schedule.breaks.map((b) => b.endsAt)];
		const blockEnds = [
			...schedule.breaks.map((b) => b.startsAt),
			schedule.endsAt
		];
		blockStarts.forEach((blockStart, index) => {
			const blockEnd = blockEnds[index] ?? schedule.endsAt;
			expect(
				(blockEnd.getTime() - blockStart.getTime()) / 60_000
			).toBeLessThanOrEqual(50);
		});
	});

	it.each([
		[7, 3],
		[12, 2],
		[31, 3],
		[40, 3]
	])("produces a valid schedule for %i teams with panels of %i", (teamCount, panelSize) => {
		const scheduleInput = input({
			teamIds: ids("team", teamCount),
			judgeIds: ids("judge", 17),
			panelSize
		});
		const result = buildPanelSchedule(scheduleInput);
		if (!result.ok) throw new Error(result.message);
		expectValidSchedule(result.schedule, scheduleInput);
	});

	it("spreads extra judges one per table", () => {
		const schedule = build({ judgeIds: ids("judge", 22) });
		expect(schedule.tables.map((table) => table.judgeIds.length)).toEqual([
			5, 5, 4, 4, 4
		]);
	});

	it("rotates which table each team visits second from wave to wave", () => {
		const schedule = build({
			teamIds: ids("team", 16),
			judgeIds: ids("judge", 16)
		});
		const offsets = [0, 4, 8].map((firstTeam) => {
			const visits = schedule.assignments.filter(
				(a) => a.teamId === `team-${firstTeam + 1}`
			);
			return (visits[1]?.tableNumber ?? 0) - (visits[0]?.tableNumber ?? 0);
		});
		expect(offsets).toEqual([1, 2, 3]);
	});

	it("caps presentations at ten minutes and ends early when there is spare time", () => {
		const schedule = build({
			judgeIds: ids("judge", 3),
			teamIds: ids("team", 6),
			panelSize: 1
		});
		expect(schedule.presentationMinutes).toBe(10);
		expect(schedule.breaks).toEqual([]);
		expect(schedule.endsAt).toEqual(addMinutes(start, 46));
	});

	it("fails with a smaller panel suggestion when there aren't enough judges for two tables", () => {
		const result = buildPanelSchedule(
			input({ judgeIds: ids("judge", 7), teamIds: ids("team", 12) })
		);
		expect(result).toEqual({
			ok: false,
			message: expect.stringMatching(
				/need at least 8 judges.*panel size of 3 gives \d+-minute/
			)
		});
	});

	it("fails with a smaller panel suggestion when presentations would be too short", () => {
		const result = buildPanelSchedule(input({ panelSize: 5 }));
		expect(result).toEqual({
			ok: false,
			message: expect.stringContaining(
				"A panel size of 4 gives 5-minute presentations."
			)
		});
	});

	it("fails when there are no teams", () => {
		expect(buildPanelSchedule(input({ teamIds: [] }))).toEqual({
			ok: false,
			message: "There are no teams to schedule."
		});
	});
});

describe("findLateTeamSlots", () => {
	const at = (minutes: number) => addMinutes(start, minutes);
	const base = {
		tableIds: ["t1", "t2"],
		slotMinutes: 10,
		presentationMinutes: 8,
		windowEnd: at(180)
	};

	it("uses back-to-back free slots at two different tables", () => {
		expect(
			findLateTeamSlots({
				...base,
				assignments: [
					{ tableId: "t1", startsAt: at(0) },
					{ tableId: "t2", startsAt: at(10) }
				]
			})
		).toEqual({
			first: { tableId: "t2", startsAt: at(0) },
			second: { tableId: "t1", startsAt: at(10) }
		});
	});

	it("never pairs slots across a break and appends after the last slot", () => {
		const full = (minutes: number) => [
			{ tableId: "t1", startsAt: at(minutes) },
			{ tableId: "t2", startsAt: at(minutes) }
		];
		expect(
			findLateTeamSlots({
				...base,
				assignments: [
					...full(0),
					{ tableId: "t1", startsAt: at(10) },
					{ tableId: "t2", startsAt: at(30) },
					...full(40)
				]
			})
		).toEqual({
			first: { tableId: "t1", startsAt: at(50) },
			second: { tableId: "t2", startsAt: at(60) }
		});
	});

	it("returns null when the slots would run past the round's end", () => {
		expect(
			findLateTeamSlots({
				...base,
				windowEnd: at(25),
				assignments: [
					{ tableId: "t1", startsAt: at(0) },
					{ tableId: "t2", startsAt: at(0) }
				]
			})
		).toBeNull();
	});

	it("returns null when nothing has been scheduled", () => {
		expect(findLateTeamSlots({ ...base, assignments: [] })).toBeNull();
	});
});
