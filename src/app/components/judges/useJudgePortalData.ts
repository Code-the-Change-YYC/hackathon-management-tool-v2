"use client";

import { createContext, useContext, useMemo } from "react";
import { api, type RouterOutputs } from "@/trpc/react";

export type JudgeAssignment =
	RouterOutputs["judgingAssignments"]["getByJudge"][number];
export type Criterion = RouterOutputs["criteria"]["getAll"][number];

type JudgeUserContextValue = {
	userId: string;
	userName: string;
};

export const JudgeUserContext = createContext<JudgeUserContextValue | null>(
	null
);

export function useJudgeUser() {
	const value = useContext(JudgeUserContext);
	if (!value) {
		throw new Error("Judge portal user context is missing.");
	}
	return value;
}

const judgeTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export function formatTime(value?: Date | null) {
	if (!value) return "Unscheduled";
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		hour12: true,
		minute: "2-digit",
		timeZone: judgeTimeZone
	}).format(value);
}

export function formatDate(value?: Date | null) {
	if (!value) return "Unscheduled";
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "long",
		weekday: "long",
		timeZone: judgeTimeZone
	}).format(value);
}

export function formatDuration(minutes: number) {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

export function getTeamCode(assignment: JudgeAssignment) {
	return (
		assignment.team.teamCode ?? assignment.team.id.slice(0, 4).toUpperCase()
	);
}

export function getAssignmentRoomName(assignment: JudgeAssignment) {
	return assignment.room.name || "Room";
}

export function sortAssignments(a: JudgeAssignment, b: JudgeAssignment) {
	const aTime = a.timeSlot?.getTime() ?? Number.MAX_SAFE_INTEGER;
	const bTime = b.timeSlot?.getTime() ?? Number.MAX_SAFE_INTEGER;
	return aTime - bTime || a.team.name.localeCompare(b.team.name);
}

export function getCriteriaScore(
	assignment: JudgeAssignment,
	criterionId: string
) {
	return assignment.scores.find((score) => score.criteriaId === criterionId)
		?.value;
}

export function isAssignmentScored(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	if (mainCriteria.length === 0) {
		return assignment.scores.length > 0;
	}
	return mainCriteria.every((criterion) =>
		assignment.scores.some((score) => score.criteriaId === criterion.id)
	);
}

export function getAssignmentTotal(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	includeSidepots = false
) {
	const selectedCriteria = criteria.filter(
		(criterion) => includeSidepots || !criterion.isSidepot
	);
	const selectedIds = new Set(
		selectedCriteria.map((criterion) => criterion.id)
	);
	const total = assignment.scores.reduce(
		(sum, score) => sum + (selectedIds.has(score.criteriaId) ? score.value : 0),
		0
	);
	const max = selectedCriteria.reduce(
		(sum, criterion) => sum + criterion.maxScore,
		0
	);
	return { max, total };
}

export function getScoreTone(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) {
		return "border-[#c8efbd] bg-[#eefbe9] text-[#317d15]";
	}
	if (percent >= 0.5) {
		return "border-[#ffe5b2] bg-[#fff8e8] text-[#9f630b]";
	}
	if (percent >= 0.3) {
		return "border-[#ffd2c9] bg-[#fff1ee] text-[#b71801]";
	}
	return "border-[#f6c8d6] bg-[#fff0f4] text-[#a70a38]";
}

export function useJudgePortalData() {
	const { userId } = useJudgeUser();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const assignmentsQuery = api.judgingAssignments.getByJudge.useQuery(
		{ judgeId: userId },
		{ enabled: Boolean(userId) }
	);
	const criteriaQuery = api.criteria.getAll.useQuery();

	const assignments = useMemo(
		() => (assignmentsQuery.data ?? []).slice().sort(sortAssignments),
		[assignmentsQuery.data]
	);
	const criteria = useMemo(
		() =>
			(criteriaQuery.data ?? [])
				.slice()
				.sort((a, b) => Number(a.isSidepot) - Number(b.isSidepot)),
		[criteriaQuery.data]
	);
	const roomLabels = useMemo(() => {
		return new Map(
			assignments.map((assignment) => [
				assignment.room.id,
				getAssignmentRoomName(assignment)
			])
		);
	}, [assignments]);

	const roomSummary = useMemo(() => {
		const labels = Array.from(
			new Set(
				assignments.map((assignment) => getAssignmentRoomName(assignment))
			)
		);
		if (labels.length === 0) return "No room assigned yet";
		return `You’ve been assigned to ${labels[0]}`;
	}, [assignments]);
	const roomLabelSummary = useMemo(() => {
		const labels = Array.from(
			new Set(
				assignments.map((assignment) => getAssignmentRoomName(assignment))
			)
		);
		return labels.length > 0 ? labels[0] : "No room";
	}, [assignments]);

	const firstMeetingLink =
		assignments.find((assignment) => assignment.room.roomLink)?.room.roomLink ??
		"";

	const isLoading =
		settingsQuery.isLoading ||
		roundsQuery.isLoading ||
		assignmentsQuery.isLoading ||
		criteriaQuery.isLoading;
	const error =
		settingsQuery.error ??
		roundsQuery.error ??
		assignmentsQuery.error ??
		criteriaQuery.error;

	return {
		activeRoundId: settingsQuery.data?.currentRoundId ?? "",
		assignments,
		criteria,
		error,
		firstMeetingLink,
		isLoading,
		roomLabelSummary,
		roomLabels,
		roomSummary,
		rounds: roundsQuery.data ?? []
	};
}

export function hasDraftScore(
	scores: Record<string, number>,
	criterionId: string
) {
	return Object.hasOwn(scores, criterionId);
}

export function getDraftScore(
	scores: Record<string, number>,
	criterionId: string
) {
	return hasDraftScore(scores, criterionId) ? scores[criterionId] : undefined;
}

export function getScoreTextColor(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "text-[#02644f]";
	if (percent >= 0.5) return "text-[#317d15]";
	if (percent >= 0.3) return "text-[#9f630b]";
	if (percent >= 0.15) return "text-[#b71801]";
	return "text-[#a70a38]";
}

export function getScoreFillClass(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "bg-[#02644f] text-white";
	if (percent >= 0.5) return "bg-[#317d15] text-white";
	if (percent >= 0.3) return "bg-[#9f630b] text-white";
	if (percent >= 0.15) return "bg-[#b71801] text-white";
	return "bg-[#a70a38] text-white";
}

export function getCriterionDescription(criterion: Criterion) {
	return criterion.isSidepot
		? `Assess how well this project meets the ${criterion.name} sidepot and whether the execution is clear, meaningful, and complete.`
		: `Evaluate how strongly this project demonstrates ${criterion.name.toLowerCase()} and how clearly that strength supports the team’s overall solution.`;
}

export function getBandDescription(criterion: Criterion, label: string) {
	return criterion.isSidepot
		? `Use this range when the ${criterion.name} sidepot shows ${label.toLowerCase()} evidence, execution, and relevance.`
		: `Use this range when the project shows ${label.toLowerCase()} evidence for ${criterion.name.toLowerCase()}.`;
}

export function getScoreOptions(
	criterion: Criterion,
	includeZero: boolean,
	currentScore?: number
) {
	const maxScore = criterion.maxScore;
	const start = includeZero || currentScore === 0 ? 0 : 1;
	return Array.from(
		{ length: Math.max(0, maxScore - start + 1) },
		(_, index) => start + index
	);
}

export function getRubricBands(maxScore: number, includeZero = false) {
	const bands = [
		"Minimal",
		"Developing",
		"Satisfactory",
		"Effective",
		"Excellent"
	];
	const minScore = includeZero ? 0 : 1;
	const scoreCount = Math.max(1, maxScore - minScore + 1);
	const activeBands = bands.slice(0, Math.min(bands.length, scoreCount));

	return activeBands.map((label, index) => {
		const start = Math.min(
			maxScore,
			minScore + Math.ceil((index * scoreCount) / activeBands.length)
		);
		const rawEnd =
			minScore + Math.ceil(((index + 1) * scoreCount) / activeBands.length) - 1;
		const end = Math.min(maxScore, Math.max(start, rawEnd));
		return {
			label,
			max: end,
			min: start,
			range: start === end ? `${start}` : `${start}–${end}`
		};
	});
}
