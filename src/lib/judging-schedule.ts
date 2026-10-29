import { addMinutes, differenceInMinutes } from "date-fns";
import {
	MAX_PRESENTATION_MINUTES,
	MIN_PRESENTATION_MINUTES
} from "@/lib/judging";

export type PanelScheduleSettings = {
	panelSize: number;
	changeoverMinutes: number;
	breakMinutes: number;
	maxBlockMinutes: number;
};

export type PanelScheduleInput = PanelScheduleSettings & {
	startTime: Date;
	endTime: Date;
	judgeIds: string[];
	teamIds: string[];
};

export type PanelSchedule = {
	presentationMinutes: number;
	slotMinutes: number;
	waveCount: number;
	tables: { tableNumber: number; judgeIds: string[] }[];
	assignments: { teamId: string; tableNumber: number; startsAt: Date }[];
	breaks: { startsAt: Date; endsAt: Date }[];
	endsAt: Date;
};

export type PanelScheduleResult =
	| { ok: true; schedule: PanelSchedule }
	| { ok: false; message: string };

// Fewest breaks wins, as long as no block runs longer than maxBlockMinutes.
function planBlocks(
	windowMinutes: number,
	waveCount: number,
	settings: PanelScheduleSettings
) {
	const slotCount = waveCount * 2;
	for (let blockCount = 1; blockCount <= waveCount; blockCount++) {
		const available = windowMinutes - (blockCount - 1) * settings.breakMinutes;
		const slotMinutes = Math.min(
			Math.floor(available / slotCount),
			MAX_PRESENTATION_MINUTES + settings.changeoverMinutes
		);
		const longestBlock = Math.ceil(waveCount / blockCount) * 2 * slotMinutes;
		if (longestBlock <= settings.maxBlockMinutes) {
			const wavesPerBlock = Array.from(
				{ length: blockCount },
				(_, block) =>
					Math.floor(waveCount / blockCount) +
					(block < waveCount % blockCount ? 1 : 0)
			);
			return { slotMinutes, wavesPerBlock };
		}
	}
	return null;
}

function schedulePanel(input: PanelScheduleInput): PanelScheduleResult {
	const tableCount = Math.floor(input.judgeIds.length / input.panelSize);
	if (tableCount < 2) {
		return {
			ok: false,
			message: `Two tables of ${input.panelSize} need at least ${input.panelSize * 2} judges, but only ${input.judgeIds.length} are available.`
		};
	}
	if (input.teamIds.length === 0) {
		return { ok: false, message: "There are no teams to schedule." };
	}

	const waveCount = Math.ceil(input.teamIds.length / tableCount);
	const plan = planBlocks(
		differenceInMinutes(input.endTime, input.startTime),
		waveCount,
		input
	);
	if (!plan) {
		return {
			ok: false,
			message:
				"Max continuous judging is too short to fit one team's two presentations."
		};
	}

	const presentationMinutes = plan.slotMinutes - input.changeoverMinutes;
	if (presentationMinutes < MIN_PRESENTATION_MINUTES) {
		return {
			ok: false,
			message: `Presentations would only be ${Math.max(0, presentationMinutes)} minutes. They need at least ${MIN_PRESENTATION_MINUTES}.`
		};
	}

	const tables = Array.from({ length: tableCount }, (_, index) => ({
		tableNumber: index + 1,
		judgeIds: input.judgeIds.filter(
			(_, judgeIndex) => judgeIndex % tableCount === index
		)
	}));

	const assignments: PanelSchedule["assignments"] = [];
	const breaks: PanelSchedule["breaks"] = [];
	let cursor = input.startTime;
	let wave = 0;
	plan.wavesPerBlock.forEach((blockWaves, block) => {
		for (let i = 0; i < blockWaves; i++, wave++) {
			const waveTeams = input.teamIds.slice(
				wave * tableCount,
				(wave + 1) * tableCount
			);
			// Rotate which table each team visits second so tables share teams.
			const offset = (wave % (tableCount - 1)) + 1;
			waveTeams.forEach((teamId, position) => {
				assignments.push(
					{ teamId, tableNumber: position + 1, startsAt: cursor },
					{
						teamId,
						tableNumber: ((position + offset) % tableCount) + 1,
						startsAt: addMinutes(cursor, plan.slotMinutes)
					}
				);
			});
			cursor = addMinutes(cursor, plan.slotMinutes * 2);
		}
		if (block < plan.wavesPerBlock.length - 1) {
			const endsAt = addMinutes(cursor, input.breakMinutes);
			breaks.push({ startsAt: cursor, endsAt });
			cursor = endsAt;
		}
	});

	return {
		ok: true,
		schedule: {
			presentationMinutes,
			slotMinutes: plan.slotMinutes,
			waveCount,
			tables,
			assignments,
			breaks,
			endsAt: addMinutes(cursor, -input.changeoverMinutes)
		}
	};
}

export function buildPanelSchedule(
	input: PanelScheduleInput
): PanelScheduleResult {
	const result = schedulePanel(input);
	if (result.ok) return result;

	for (let panelSize = input.panelSize - 1; panelSize >= 1; panelSize--) {
		const smaller = schedulePanel({ ...input, panelSize });
		if (smaller.ok) {
			return {
				ok: false,
				message: `${result.message} A panel size of ${panelSize} gives ${smaller.schedule.presentationMinutes}-minute presentations.`
			};
		}
	}
	return result;
}

type ExistingAssignment = { tableId: string; startsAt: Date };

// Finds two back-to-back free slots at different tables for a late team.
export function findLateTeamSlots(input: {
	tableIds: string[];
	assignments: ExistingAssignment[];
	slotMinutes: number;
	presentationMinutes: number;
	windowEnd: Date;
}) {
	const times = [
		...new Set(input.assignments.map((a) => a.startsAt.getTime()))
	].sort((a, b) => a - b);
	const last = times.at(-1);
	if (last === undefined) return null;
	const slotMs = input.slotMinutes * 60_000;
	times.push(last + slotMs, last + slotMs * 2);

	const freeTables = (time: number) =>
		input.tableIds.filter(
			(tableId) =>
				!input.assignments.some(
					(a) => a.tableId === tableId && a.startsAt.getTime() === time
				)
		);

	for (const time of times) {
		const next = time + slotMs;
		if (!times.includes(next)) continue;
		if (
			addMinutes(new Date(next), input.presentationMinutes) > input.windowEnd
		) {
			continue;
		}
		const nextFree = freeTables(next);
		for (const first of freeTables(time)) {
			const second = nextFree.find((tableId) => tableId !== first);
			if (second) {
				return {
					first: { tableId: first, startsAt: new Date(time) },
					second: { tableId: second, startsAt: new Date(next) }
				};
			}
		}
	}
	return null;
}
