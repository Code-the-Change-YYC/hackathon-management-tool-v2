"use client";

import {
	ArrowLeftLine,
	ArrowRightLine,
	More1Line,
	NotificationLine
} from "@mingcute/react";
import Image from "next/image";
import Link from "next/link";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { AdminNavbar } from "@/app/components/admin/AdminNavbar";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { MobileNavSheet } from "@/app/components/MobileNavSheet";
import { Button } from "@/app/components/ui/button";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { formatTime } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";
import {
	AssignmentManagement,
	CriteriaManagement,
	ResultsManagement,
	RoomManagement,
	RoundManagement
} from "./JudgingManagementSections";

type Assignment = RouterOutputs["judgingAssignments"]["getByRound"][number];
type Room = RouterOutputs["judgingRooms"]["getLayoutByRound"]["rooms"][number];
type Team = RouterOutputs["teams"]["getAll"][number];
type SlotMinutes = 15 | 30 | 60;

const scheduleGridClass =
	"grid min-w-[max(100%,calc(var(--time-column)+var(--room-count)*var(--room-column)))] [--room-column:120px] [--time-column:82px] [grid-template-columns:minmax(var(--time-column),0.8fr)_repeat(var(--room-count),minmax(var(--room-column),1fr))] lg:[--room-column:160px] lg:[--time-column:128px]";
const scheduleHeaderClass =
	"flex min-h-10 items-center justify-center border-dashboard-grey border-r border-b bg-primary p-2 text-center font-medium text-primary-foreground text-sm leading-5 lg:min-h-12 lg:text-base lg:leading-6";
const timeCellClass =
	"min-h-[68px] border-dashboard-grey border-r border-b bg-background px-2 py-2 font-medium text-foreground text-sm leading-5 lg:min-h-[88px] lg:px-1 lg:text-base lg:leading-6";
const roomCellClass =
	"flex min-h-[68px] flex-col justify-center gap-1 border-dashboard-grey border-r border-b bg-light-grey px-1 py-1 lg:min-h-[88px]";
const teamPillClass =
	"truncate rounded-lg border border-awesome-purple bg-lilac-purple px-2 py-1.5 text-center font-semibold text-primary text-sm leading-5 lg:px-2 lg:py-2 lg:text-base";
const slotsPerPage = 48;

function buildTimeSlots(
	startTime: Date,
	endTime: Date,
	slotMinutes: SlotMinutes
) {
	const slotCount = getSlotCount(startTime, endTime, slotMinutes);
	const slotMs = slotMinutes * 60_000;

	return Array.from({ length: slotCount }, (_, index) => {
		return new Date(startTime.getTime() + index * slotMs);
	});
}

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

function byNameThenId<T extends { id: string; name: string }>(a: T, b: T) {
	const nameSort = a.name.localeCompare(b.name);
	return nameSort || a.id.localeCompare(b.id);
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

function ScheduleGrid({
	assignments,
	isLoading,
	rooms,
	roundEnd,
	roundStart,
	slotMinutes
}: {
	assignments: Assignment[];
	isLoading: boolean;
	rooms: Room[];
	roundEnd?: Date;
	roundStart?: Date;
	slotMinutes: SlotMinutes;
}) {
	const slots = useMemo(
		() =>
			roundStart && roundEnd
				? buildTimeSlots(roundStart, roundEnd, slotMinutes)
				: [],
		[roundEnd, roundStart, slotMinutes]
	);
	const [slotPage, setSlotPage] = useState(0);
	const pageCount = Math.max(1, Math.ceil(slots.length / slotsPerPage));
	const safeSlotPage = Math.min(slotPage, pageCount - 1);
	const pageStart = safeSlotPage * slotsPerPage;
	const visibleSlots = slots.slice(pageStart, pageStart + slotsPerPage);

	if (isLoading) {
		return (
			<div
				aria-live="polite"
				className="flex min-h-56 items-center justify-center rounded-2xl bg-muted text-muted-foreground"
			>
				Loading schedule…
			</div>
		);
	}

	if (!roundStart || !roundEnd) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-border border-dashed px-6 text-center text-muted-foreground">
				Create or select a judging round above to view its schedule.
			</div>
		);
	}

	if (rooms.length === 0) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-border border-dashed px-6 text-center text-muted-foreground">
				No rooms yet. Use Assign to rooms above to create rooms and place passed
				teams.
			</div>
		);
	}

	const scheduleStyle = {
		"--room-count": rooms.length
	} as CSSProperties;

	return (
		<div className="flex flex-col gap-3">
			{slots.length > slotsPerPage ? (
				<div className="flex flex-wrap items-center justify-between gap-3">
					<p className="m-0 text-muted-foreground text-sm">
						Showing slots {pageStart + 1}-
						{Math.min(pageStart + slotsPerPage, slots.length)} of {slots.length}
					</p>
					<div className="flex gap-2">
						<Button
							disabled={safeSlotPage === 0}
							onClick={() => setSlotPage((page) => Math.max(0, page - 1))}
							size="sm"
							type="button"
							variant="outline"
						>
							<ArrowLeftLine data-icon="inline-start" />
							Previous
						</Button>
						<Button
							disabled={safeSlotPage >= pageCount - 1}
							onClick={() =>
								setSlotPage((page) => Math.min(pageCount - 1, page + 1))
							}
							size="sm"
							type="button"
							variant="outline"
						>
							Next
							<ArrowRightLine data-icon="inline-end" />
						</Button>
					</div>
				</div>
			) : null}

			<div className="overflow-x-auto rounded-2xl">
				<div className={scheduleGridClass} style={scheduleStyle}>
					<div
						className={cn(scheduleHeaderClass, "justify-start rounded-tl-2xl")}
					>
						Times
					</div>
					{rooms.map((room, roomIndex) => (
						<div
							className={cn(
								scheduleHeaderClass,
								roomIndex === rooms.length - 1 && "rounded-tr-2xl"
							)}
							key={room.id}
						>
							{room.name}
						</div>
					))}

					{visibleSlots.map((slot, slotIndex) => {
						const slotEnd = slot.getTime() + slotMinutes * 60 * 1000;
						const isLastVisibleSlot = slotIndex === visibleSlots.length - 1;
						return (
							<div className="contents" key={slot.toISOString()}>
								<div
									className={cn(
										timeCellClass,
										(pageStart + slotIndex) % 2 === 0 && "bg-dashboard-grey",
										isLastVisibleSlot && "rounded-bl-2xl"
									)}
								>
									{formatTime(slot)}
								</div>
								{rooms.map((room, roomIndex) => {
									const cellAssignments = assignments.filter((assignment) => {
										if (
											assignment.room.id !== room.id ||
											!assignment.timeSlot
										) {
											return false;
										}
										const assignmentTime = new Date(
											assignment.timeSlot
										).getTime();
										return (
											assignmentTime >= slot.getTime() &&
											assignmentTime < slotEnd
										);
									});

									return (
										<div
											className={cn(
												roomCellClass,
												isLastVisibleSlot &&
													roomIndex === rooms.length - 1 &&
													"rounded-br-2xl"
											)}
											key={`${slot.toISOString()}-${room.id}`}
										>
											{cellAssignments.map((assignment) => (
												<div
													className={teamPillClass}
													key={assignment.id}
													title={assignment.team.name}
												>
													{assignment.team.name}
												</div>
											))}
										</div>
									);
								})}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

export default function AdminJudgingDashboard({
	userName
}: {
	userName: string;
}) {
	const utils = api.useUtils();
	const { confirm, dialog } = useConfirmDialog();
	const [menuOpen, setMenuOpen] = useState(false);
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

	const visibleRooms = useMemo(
		() =>
			selectedRoomId === "all"
				? rooms
				: rooms.filter((room) => room.id === selectedRoomId),
		[rooms, selectedRoomId]
	);
	const visibleAssignments = useMemo(
		() =>
			selectedRoomId === "all"
				? assignments
				: assignments.filter(
						(assignment) => assignment.room.id === selectedRoomId
					),
		[assignments, selectedRoomId]
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

	return (
		<div className="min-h-screen bg-background text-foreground">
			{dialog}
			<aside className="fixed inset-y-0 left-0 hidden w-[209px] border-border border-r bg-sidebar py-4 pr-4 pl-4 lg:block">
				<AdminNavbar userName={userName} />
			</aside>

			<header className="flex h-14 items-center justify-between bg-background px-6 py-1 lg:hidden">
				<Button
					aria-expanded={menuOpen}
					aria-label="Open admin navigation"
					onClick={() => setMenuOpen(true)}
					size="icon-lg"
					type="button"
					variant="ghost"
				>
					<More1Line />
				</Button>
				<span aria-hidden="true" className="p-2">
					<NotificationLine className="size-6" />
				</span>
			</header>

			<div className="lg:hidden">
				<MobileNavSheet
					onOpenChange={setMenuOpen}
					open={menuOpen}
					title="Admin navigation"
				>
					<AdminNavbar
						onNavigate={() => setMenuOpen(false)}
						userName={userName}
					/>
				</MobileNavSheet>
			</div>

			<main className="flex flex-col gap-6 p-6 lg:ml-[209px]">
				<header>
					<h1 className="m-0 font-semibold text-[32px] leading-10">Judging</h1>
					<p className="m-0 text-base text-muted-foreground leading-6">
						Create a round, generate rooms and team slots, then review the
						schedule.
					</p>
				</header>

				<section className="relative flex min-h-[299px] flex-col overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:block sm:min-h-[148px]">
					<div className="relative z-10 max-w-[400px]">
						<h2 className="m-0 font-semibold text-[28px] leading-9">
							Release Scores to Teams
						</h2>
						<p className="mt-4 mb-0 max-w-[400px] text-base leading-6">
							Let participants know how they scored in their projects now that
							the hackathon has ended!
						</p>
					</div>

					<div className="pointer-events-none absolute inset-x-0 bottom-[-34px] h-[174px] sm:inset-auto sm:top-[-70px] sm:right-0 sm:h-[260px] sm:w-[520px]">
						<Image
							alt=""
							className="-rotate-[4deg] absolute bottom-[-8px] left-0 h-[165px] w-[165px] object-contain sm:top-0 sm:left-0 sm:h-[250px] sm:w-[250px]"
							height={250}
							src="/images/admin-judging/gift.png"
							width={250}
						/>
						<Image
							alt=""
							className="absolute right-[-16px] bottom-[-8px] h-[155px] w-[155px] rotate-[9deg] object-contain sm:top-8 sm:right-2 sm:h-[230px] sm:w-[230px]"
							height={230}
							src="/images/admin-judging/trophy.png"
							width={230}
						/>
					</div>

					<Button
						className="absolute bottom-4 left-4 z-20 sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto"
						disabled
						title="Score release is not wired yet."
						type="button"
						variant="secondary"
					>
						Release scores
						<ArrowRightLine data-icon="inline-end" />
					</Button>
				</section>

				<RoundManagement
					onSelectRound={(roundId) => {
						setSelectedRoundId(roundId);
						setSelectedRoomId("all");
						setAssignmentMessage("");
					}}
					selectedRoundId={selectedRoundId}
				/>

				<section className="flex flex-col gap-4" id="assign-teams">
					<div>
						<h2 className="m-0 font-medium text-[22px] leading-7">
							Assign teams to rooms
						</h2>
						<p className="mt-1 mb-0 text-muted-foreground text-sm">
							This creates the rooms and places prescreen-passed teams into time
							slots.
						</p>
					</div>
					{!selectedRoundId ? (
						<p className="m-0 text-muted-foreground text-sm">
							Add a round above first.
						</p>
					) : null}
					{selectedRoundId &&
					!teamsQuery.isLoading &&
					eligibleTeams.length === 0 ? (
						<p className="m-0 text-muted-foreground text-sm">
							No passed teams yet.{" "}
							<Link
								className="text-primary underline-offset-4 hover:underline"
								href="/admin#teams"
							>
								Prescreen teams
							</Link>{" "}
							before generating a schedule.
						</p>
					) : null}
					<div className="grid gap-6 sm:grid-cols-2">
						<Field className="gap-2">
							<FieldLabel>Number of rooms</FieldLabel>
							<Input
								className="h-12"
								max={20}
								min={1}
								onChange={(event) =>
									setRoomCount(Number.parseInt(event.target.value, 10) || 1)
								}
								type="number"
								value={roomCount}
							/>
						</Field>
						<Field className="gap-2">
							<FieldLabel>Number of judges per room</FieldLabel>
							<Input
								className="h-12"
								max={20}
								min={1}
								onChange={(event) =>
									setJudgesPerRoom(Number.parseInt(event.target.value, 10) || 1)
								}
								type="number"
								value={judgesPerRoom}
							/>
						</Field>
					</div>
					<Field className="max-w-xs gap-2">
						<FieldLabel>Slot duration</FieldLabel>
						<Select
							onValueChange={(value) => {
								if (!value) return;
								setSlotMinutes(Number.parseInt(value, 10) as SlotMinutes);
								setAssignmentMessage("");
							}}
							value={String(slotMinutes)}
						>
							<SelectTrigger className="h-12 w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="15">15 minutes</SelectItem>
									<SelectItem value="30">30 minutes</SelectItem>
									<SelectItem value="60">60 minutes</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>

					<div className="flex flex-col items-end gap-2">
						<Button
							disabled={
								!selectedRoundId ||
								generateSchedule.isPending ||
								roundsQuery.isLoading ||
								layoutQuery.isLoading ||
								assignmentsQuery.isLoading ||
								usersQuery.isLoading ||
								teamsQuery.isLoading ||
								!readiness.canAssign
							}
							onClick={() => void handleAutoAssign()}
							type="button"
						>
							{generateSchedule.isPending ? "Assigning…" : "Assign to rooms"}
						</Button>
						<p
							aria-live="polite"
							className="m-0 min-h-5 text-right text-muted-foreground text-sm"
						>
							{assignmentMessage ||
								readiness.blockingReason ||
								(usersQuery.isLoading || teamsQuery.isLoading
									? "Checking assignment capacity…"
									: `${eligibleTeams.length} passed teams · ${judges.length} judges available`)}
						</p>
					</div>
				</section>

				<section className="flex flex-col gap-4" id="judging-schedule">
					<div>
						<h2 className="m-0 font-medium text-[22px] leading-7">
							Judging schedule
						</h2>
						<p className="mt-1 mb-0 text-muted-foreground text-sm">
							The grid updates after you assign teams to rooms.
						</p>
					</div>

					<div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
						<Field className="w-full gap-2 sm:w-64">
							<FieldLabel>Room Selection</FieldLabel>
							<Select
								disabled={!selectedRoundId || layoutQuery.isLoading}
								onValueChange={(value) => {
									if (value) setSelectedRoomId(value);
								}}
								value={selectedRoomId}
							>
								<SelectTrigger className="h-12 w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="all">All</SelectItem>
										{rooms.map((room) => (
											<SelectItem key={room.id} value={room.id}>
												{room.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
						<Field className="w-full gap-2 sm:w-64">
							<FieldLabel>Round</FieldLabel>
							<Select
								disabled={roundsQuery.isLoading}
								onValueChange={(value) => {
									if (!value) return;
									setSelectedRoundId(value);
									setSelectedRoomId("all");
									setAssignmentMessage("");
								}}
								value={selectedRoundId}
							>
								<SelectTrigger className="h-12 w-full">
									<SelectValue placeholder="Select a round" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{(roundsQuery.data ?? []).map((round) => (
											<SelectItem key={round.id} value={round.id}>
												{round.name}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
					</div>

					{queryError ? (
						<p className="m-0 rounded-xl bg-destructive/10 px-4 py-3 text-destructive">
							Schedule data could not be loaded: {queryError.message}
						</p>
					) : (
						<ScheduleGrid
							assignments={visibleAssignments}
							isLoading={
								roundsQuery.isLoading ||
								layoutQuery.isLoading ||
								assignmentsQuery.isLoading
							}
							key={`${selectedRoundId}:${selectedRoomId}:${slotMinutes}`}
							rooms={visibleRooms}
							roundEnd={selectedRound?.endTime}
							roundStart={selectedRound?.startTime}
							slotMinutes={slotMinutes}
						/>
					)}

					{unscheduledCount > 0 ? (
						<p className="m-0 text-muted-foreground text-sm">
							{unscheduledCount}{" "}
							{unscheduledCount === 1 ? "assignment has" : "assignments have"}{" "}
							no time slot and cannot appear in the grid.
						</p>
					) : null}
				</section>

				<div className="mt-4 flex flex-col gap-16">
					<div className="flex flex-col gap-4">
						<div>
							<h2 className="m-0 font-medium text-[22px] leading-7">
								Adjustments
							</h2>
							<p className="mt-1 mb-0 text-muted-foreground text-sm">
								Optional. Edit meeting links, extra rooms, or a single team
								after generating the schedule.
							</p>
						</div>
						<RoomManagement roundId={selectedRoundId} />
						<AssignmentManagement
							roundId={selectedRoundId}
							slotMinutes={slotMinutes}
						/>
					</div>
					<CriteriaManagement />
					<ResultsManagement />
				</div>
			</main>
		</div>
	);
}
