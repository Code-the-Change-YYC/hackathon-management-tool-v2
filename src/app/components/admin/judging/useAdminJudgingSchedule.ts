"use client";
import { useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import type { SlotMinutes } from "@/lib/judging";
import { api, type RouterOutputs } from "@/trpc/react";
import { byNameThenId } from "./judgingShared";

type Assignment = RouterOutputs["judgingAssignments"]["getByRound"][number];
type Team = RouterOutputs["teams"]["getAll"][number];
function getTotalJudgingMinutes(startTime: Date, endTime: Date) {
	return Math.max(
		0,
		Math.floor((endTime.getTime() - startTime.getTime()) / 60_000)
	);
}

function getSlotCount(
	startTime: Date,
	endTime: Date,
	slotMinutes: SlotMinutes
) {
	return Math.floor(getTotalJudgingMinutes(startTime, endTime) / slotMinutes);
}

function isPrescreenPassed(team: Team) {
	return team.prescreenStatus === "passed";
}

function calculateClientReadiness({
	assignments,
	judgeCount,
	judgesPerRoom,
	roomCount,
	roundEnd,
	roundStart,
	slotMinutes,
	teamCount
}: {
	assignments: Assignment[];
	judgeCount: number;
	judgesPerRoom: number;
	roomCount: number;
	roundEnd?: Date;
	roundStart?: Date;
	slotMinutes: SlotMinutes;
	teamCount: number;
}) {
	if (!roundStart || !roundEnd) {
		return {
			blockingReason: "Select a valid judging round before assigning rooms.",
			canAssign: false,
			freeSlotCount: 0,
			recommendedRoomCount: 1,
			slotCount: 0,
			totalJudgingMinutes: 0
		};
	}

	const totalJudgingMinutes = getTotalJudgingMinutes(roundStart, roundEnd);
	const slotCount = getSlotCount(roundStart, roundEnd, slotMinutes);
	const safeRoomCount = Math.max(1, roomCount);
	const safeJudgesPerRoom = Math.max(1, judgesPerRoom);
	const freeSlotCount = safeRoomCount * slotCount;
	const judgesNeeded = safeRoomCount * safeJudgesPerRoom;
	const scoredAssignmentCount = assignments.filter(
		(assignment) => assignment.scores.length > 0
	).length;
	const recommendedRoomCount =
		slotCount > 0 ? Math.max(1, Math.ceil(teamCount / slotCount)) : 1;

	let blockingReason = "";
	if (teamCount === 0) {
		blockingReason =
			"No prescreen-passed teams are available to assign. Pass teams from Admin → Teams first.";
	} else if (slotCount === 0 || totalJudgingMinutes < 1) {
		blockingReason = "The selected round has no available time slots.";
	} else if (judgeCount === 0) {
		blockingReason = "No judges found. Assign judge roles before scheduling.";
	} else if (judgesNeeded > judgeCount) {
		blockingReason = `Need ${judgesNeeded} judges (${safeJudgesPerRoom} per room × ${safeRoomCount} rooms), but only ${judgeCount} are available.`;
	} else if (freeSlotCount < teamCount) {
		blockingReason = `Need ${teamCount} slots for all passed teams, but this setup only has ${freeSlotCount}.`;
	} else if (scoredAssignmentCount > 0) {
		blockingReason =
			"This round already has scored assignments. Create a new round or clear scores before rebuilding the schedule.";
	}

	return {
		blockingReason,
		canAssign: !blockingReason,
		freeSlotCount,
		recommendedRoomCount,
		slotCount,
		totalJudgingMinutes
	};
}

export function useAdminJudgingSchedule() {
	const utils = api.useUtils();
	const { confirm, dialogProps } = useConfirmDialog();
	const [selectedRoundId, setSelectedRoundId] = useState("");
	const [selectedRoomId, setSelectedRoomId] = useState("all");
	const [roomCount, setRoomCount] = useState(1);
	const [judgesPerRoom, setJudgesPerRoom] = useState(1);
	const [slotMinutes, setSlotMinutes] = useState<SlotMinutes>(30);
	const [assignmentMessage, setAssignmentMessage] = useState("");

	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const defaultRoundId =
		settingsQuery.data?.currentRoundId ?? roundsQuery.data?.[0]?.id ?? "";

	useEffect(() => {
		if (!selectedRoundId && defaultRoundId) {
			setSelectedRoundId(defaultRoundId);
			setAssignmentMessage("");
		}
	}, [defaultRoundId, selectedRoundId]);

	const layoutQuery = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId: selectedRoundId },
		{ enabled: Boolean(selectedRoundId) }
	);
	const assignmentsQuery = api.judgingAssignments.getByRound.useQuery(
		{ roundId: selectedRoundId },
		{ enabled: Boolean(selectedRoundId) }
	);
	const usersQuery = api.users.getAll.useQuery();
	const teamsQuery = api.teams.getAll.useQuery();

	const rooms = layoutQuery.data?.rooms ?? [];
	const assignments = assignmentsQuery.data ?? [];
	const judges = useMemo(
		() =>
			(usersQuery.data ?? [])
				.filter((person) => person.role === "judge")
				.sort(byNameThenId),
		[usersQuery.data]
	);
	const teams = useMemo(
		() => (teamsQuery.data ?? []).slice().sort(byNameThenId),
		[teamsQuery.data]
	);
	const eligibleTeams = useMemo(() => teams.filter(isPrescreenPassed), [teams]);
	const selectedRound = roundsQuery.data?.find(
		(round) => round.id === selectedRoundId
	);

	useEffect(() => {
		if (
			selectedRoomId !== "all" &&
			!rooms.some((room) => room.id === selectedRoomId)
		) {
			setSelectedRoomId("all");
		}
	}, [rooms, selectedRoomId]);

	const visibleRooms =
		selectedRoomId === "all"
			? rooms
			: rooms.filter((room) => room.id === selectedRoomId);
	const visibleAssignments =
		selectedRoomId === "all"
			? assignments
			: assignments.filter(
					(assignment) => assignment.room.id === selectedRoomId
				);
	const unscheduledCount = assignments.filter(
		(assignment) => !assignment.timeSlot
	).length;
	const readiness = useMemo(
		() =>
			calculateClientReadiness({
				assignments,
				judgeCount: judges.length,
				judgesPerRoom,
				roomCount,
				roundEnd: selectedRound?.endTime,
				roundStart: selectedRound?.startTime,
				slotMinutes,
				teamCount: eligibleTeams.length
			}),
		[
			assignments,
			eligibleTeams.length,
			judges.length,
			judgesPerRoom,
			roomCount,
			selectedRound?.endTime,
			selectedRound?.startTime,
			slotMinutes
		]
	);

	const generateSchedule = api.judgingRooms.generateSchedule.useMutation({
		onError: (error) => {
			setAssignmentMessage(error.message);
		},
		onSuccess: async (result) => {
			await Promise.all([
				utils.judgingRooms.getLayoutByRound.invalidate({
					roundId: selectedRoundId
				}),
				utils.judgingAssignments.getByRound.invalidate({
					roundId: selectedRoundId
				}),
				utils.judgingAssignments.getAll.invalidate()
			]);
			setSelectedRoomId("all");
			setAssignmentMessage(
				result.message ??
					`Assigned ${result.assignmentsCreated} teams across ${result.roomsCreated} room${result.roomsCreated === 1 ? "" : "s"}.`
			);
		}
	});

	const handleAutoAssign = async () => {
		setAssignmentMessage("");
		if (!selectedRoundId) {
			setAssignmentMessage("Select a judging round before assigning rooms.");
			return;
		}

		if (!selectedRound?.startTime || !selectedRound.endTime) {
			setAssignmentMessage("The selected round is missing start or end time.");
			return;
		}

		if (!readiness.canAssign) {
			setAssignmentMessage(readiness.blockingReason);
			return;
		}

		if (
			(rooms.length > 0 || assignments.length > 0) &&
			!(await confirm({
				title: "Replace schedule?",
				description:
					"This will replace the selected round's current unscored room layout and assignments. Continue?",
				confirmLabel: "Continue"
			}))
		) {
			setAssignmentMessage("Assignment cancelled.");
			return;
		}

		generateSchedule.mutate({
			roundId: selectedRoundId,
			roomCount,
			judgesPerRoom,
			slotDurationMinutes: slotMinutes,
			totalJudgingMinutes: readiness.totalJudgingMinutes
		});
	};

	const queryError =
		roundsQuery.error ??
		settingsQuery.error ??
		layoutQuery.error ??
		assignmentsQuery.error ??
		usersQuery.error ??
		teamsQuery.error;

	return {
		dialogProps,
		selectedRoundId,
		setSelectedRoundId,
		selectedRoomId,
		setSelectedRoomId,
		roomCount,
		setRoomCount,
		judgesPerRoom,
		setJudgesPerRoom,
		slotMinutes,
		setSlotMinutes,
		assignmentMessage,
		setAssignmentMessage,
		roundsQuery,
		layoutQuery,
		assignmentsQuery,
		usersQuery,
		teamsQuery,
		rooms,
		judges,
		eligibleTeams,
		selectedRound,
		visibleRooms,
		visibleAssignments,
		unscheduledCount,
		readiness,
		generateSchedule,
		handleAutoAssign,
		queryError
	};
}
