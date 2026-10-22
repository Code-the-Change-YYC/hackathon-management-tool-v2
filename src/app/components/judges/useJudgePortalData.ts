"use client";

import { useMemo } from "react";
import { api } from "@/trpc/react";
import { useJudgeUser } from "./JudgeUserProvider";
import {
	getAssignmentRoomName,
	sortAssignments,
	sortCriteria
} from "./judgePortal";

export function useJudgePortalData({
	refetchInterval = false
}: {
	refetchInterval?: number | false;
} = {}) {
	const { userId } = useJudgeUser();
	const queryOptions = { refetchInterval, refetchIntervalInBackground: false };
	const settingsQuery = api.hackathonSettings.get.useQuery(
		undefined,
		queryOptions
	);
	const roundsQuery = api.judgingRounds.getAll.useQuery(
		undefined,
		queryOptions
	);
	const assignmentsQuery = api.judgingAssignments.getByJudge.useQuery(
		{ judgeId: userId },
		{ ...queryOptions, enabled: Boolean(userId) }
	);
	const criteriaQuery = api.criteria.getAll.useQuery(undefined, queryOptions);

	const assignments = useMemo(
		() => (assignmentsQuery.data ?? []).slice().sort(sortAssignments),
		[assignmentsQuery.data]
	);
	const criteria = useMemo(
		() => (criteriaQuery.data ?? []).slice().sort(sortCriteria),
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
	const queries = [settingsQuery, roundsQuery, assignmentsQuery, criteriaQuery];
	const hasData = queries.every((query) => query.data !== undefined);
	// The oldest timestamp is the point through which every query is current.
	const updatedAt = hasData
		? Math.min(...queries.map((query) => query.dataUpdatedAt))
		: null;
	const refresh = async () => {
		await Promise.all(
			queries.map((query) => query.refetch({ throwOnError: false }))
		);
	};

	return {
		activeRoundId: settingsQuery.data?.currentRoundId ?? "",
		assignments,
		criteria,
		error,
		firstMeetingLink,
		isLoading,
		hasData,
		isRefreshing: queries.some((query) => query.isFetching),
		refresh,
		updatedAt,
		roomLabelSummary,
		roomLabels,
		roomSummary,
		rounds: roundsQuery.data ?? []
	};
}
