"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { useJudgeUser } from "./JudgeUserProvider";
import { getAssignmentRoomName, sortAssignments } from "./judgePortal";

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

	const firstRoom = assignments[0];
	const roomLabelSummary = firstRoom
		? getAssignmentRoomName(firstRoom)
		: "No room";
	const roomSummary = firstRoom
		? `You’ve been assigned to ${roomLabelSummary}`
		: "No room assigned yet";

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
