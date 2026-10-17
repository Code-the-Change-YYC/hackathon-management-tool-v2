"use client";
import { differenceInMinutes } from "date-fns";
import { useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { useRefresh } from "@/hooks/use-refresh";
import type { SlotMinutes } from "@/lib/judging";
import { api } from "@/trpc/react";
import type {
	Assignment,
	Judge,
	Room,
	RoomLayouts,
	Round,
	Team
} from "./judgingShared";

// Stable, so effects that depend on a round's rooms don't rerun every render.
const NO_ROOMS: Room[] = [];
function getTotalJudgingMinutes(startTime: Date, endTime: Date) {
	return Math.max(0, differenceInMinutes(endTime, startTime));
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

// Unscheduled assignments sort last, like the database's ascending order.
function byTimeSlot(a: Assignment, b: Assignment) {
	return (
		(a.timeSlot?.getTime() ?? Number.POSITIVE_INFINITY) -
		(b.timeSlot?.getTime() ?? Number.POSITIVE_INFINITY)
	);
}

export function useAdminJudgingSchedule({
	rounds,
	activeRoundId,
	layouts,
	assignments,
	judges,
	teams
}: {
	rounds: Round[];
	activeRoundId: string | null;
	layouts: RoomLayouts;
	assignments: Assignment[];
	judges: Judge[];
	teams: Team[];
}) {
	const { isRefreshing, refresh } = useRefresh();
	const { confirm, dialogProps } = useConfirmDialog();
	const defaultRoundId = activeRoundId ?? rounds[0]?.id ?? "";
	const [selectedRoundId, setSelectedRoundId] = useState(defaultRoundId);
	const [selectedRoomId, setSelectedRoomId] = useState("all");
	const [roomCount, setRoomCount] = useState(1);
	const [judgesPerRoom, setJudgesPerRoom] = useState(1);
	const [slotMinutes, setSlotMinutes] = useState<SlotMinutes>(30);
	const [assignmentMessage, setAssignmentMessage] = useState("");

	// Falls back to the default once the selected round is deleted.
	const roundId = rounds.some((round) => round.id === selectedRoundId)
		? selectedRoundId
		: defaultRoundId;
	const selectedRound = rounds.find((round) => round.id === roundId);
	const rooms = layouts[roundId] ?? NO_ROOMS;
	const roundAssignments = assignments
		.filter((assignment) => assignment.room.round.id === roundId)
		.sort(byTimeSlot);
	const eligibleTeams = teams.filter(isPrescreenPassed);
	// Falls back to all rooms once the selected room is deleted.
	const roomId = rooms.some((room) => room.id === selectedRoomId)
		? selectedRoomId
		: "all";
	const visibleRooms =
		roomId === "all" ? rooms : rooms.filter((room) => room.id === roomId);
	const visibleAssignments =
		roomId === "all"
			? roundAssignments
			: roundAssignments.filter((assignment) => assignment.room.id === roomId);
	const unscheduledCount = roundAssignments.filter(
		(assignment) => !assignment.timeSlot
	).length;
	const readiness = calculateClientReadiness({
		assignments: roundAssignments,
		judgeCount: judges.length,
		judgesPerRoom,
		roomCount,
		roundEnd: selectedRound?.endTime,
		roundStart: selectedRound?.startTime,
		slotMinutes,
		teamCount: eligibleTeams.length
	});

	const selectRound = (id: string) => {
		setSelectedRoundId(id);
		setSelectedRoomId("all");
		setAssignmentMessage("");
	};

	const generateSchedule = api.judgingRooms.generateSchedule.useMutation({
		onError: (error) => {
			setAssignmentMessage(error.message);
		},
		onSuccess: (result) => {
			refresh(() => {
				setSelectedRoomId("all");
				setAssignmentMessage(
					result.message ??
						`Assigned ${result.assignmentsCreated} teams across ${result.roomsCreated} room${result.roomsCreated === 1 ? "" : "s"}.`
				);
			});
		}
	});

	const handleAutoAssign = async () => {
		setAssignmentMessage("");
		if (!roundId) {
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
			(rooms.length > 0 || roundAssignments.length > 0) &&
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
			roundId,
			roomCount,
			judgesPerRoom,
			slotDurationMinutes: slotMinutes,
			totalJudgingMinutes: readiness.totalJudgingMinutes
		});
	};

	return {
		dialogProps,
		rounds,
		selectedRoundId: roundId,
		selectRound,
		selectedRoomId: roomId,
		setSelectedRoomId,
		roomCount,
		setRoomCount,
		judgesPerRoom,
		setJudgesPerRoom,
		slotMinutes,
		setSlotMinutes,
		assignmentMessage,
		setAssignmentMessage,
		rooms,
		roundAssignments,
		judges,
		eligibleTeams,
		selectedRound,
		visibleRooms,
		visibleAssignments,
		unscheduledCount,
		readiness,
		isGenerating: generateSchedule.isPending || isRefreshing,
		handleAutoAssign
	};
}
