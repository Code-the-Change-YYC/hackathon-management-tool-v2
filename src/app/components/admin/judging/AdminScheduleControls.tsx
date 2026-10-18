"use client";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { SLOT_MINUTES_OPTIONS } from "@/lib/judging";
import { AdminScheduleGrid } from "./AdminScheduleGrid";
import type { useAdminJudgingSchedule } from "./useAdminJudgingSchedule";
export function AdminScheduleControls({
	schedule
}: {
	schedule: ReturnType<typeof useAdminJudgingSchedule>;
}) {
	const {
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
	} = schedule;
	return (
		<>
			{" "}
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
				<FieldGroup className="grid gap-6 sm:grid-cols-2">
					<Field className="gap-2">
						<FieldLabel htmlFor="judging-room-count">
							Number of rooms
						</FieldLabel>
						<Input
							className="h-12"
							id="judging-room-count"
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
						<FieldLabel htmlFor="judging-judge-count">
							Number of judges per room
						</FieldLabel>
						<Input
							className="h-12"
							id="judging-judge-count"
							max={20}
							min={1}
							onChange={(event) =>
								setJudgesPerRoom(Number.parseInt(event.target.value, 10) || 1)
							}
							type="number"
							value={judgesPerRoom}
						/>
					</Field>
				</FieldGroup>
				<Field className="max-w-xs gap-2">
					<FieldLabel htmlFor="judging-slot-duration">Slot duration</FieldLabel>
					<Select
						onValueChange={(value) => {
							const duration = SLOT_MINUTES_OPTIONS.find(
								(option) => String(option) === value
							);
							if (!duration) return;
							setSlotMinutes(duration);
							setAssignmentMessage("");
						}}
						value={String(slotMinutes)}
					>
						<SelectTrigger className="h-12 w-full" id="judging-slot-duration">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{SLOT_MINUTES_OPTIONS.map((minutes) => (
									<SelectItem key={minutes} value={String(minutes)}>
										{minutes} minutes
									</SelectItem>
								))}
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
						<FieldLabel htmlFor="judging-room-filter">
							Room Selection
						</FieldLabel>
						<Select
							disabled={!selectedRoundId || layoutQuery.isLoading}
							onValueChange={(value) => {
								if (value) setSelectedRoomId(value);
							}}
							value={selectedRoomId}
						>
							<SelectTrigger className="h-12 w-full" id="judging-room-filter">
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
						<FieldLabel htmlFor="judging-round-filter">Round</FieldLabel>
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
							<SelectTrigger className="h-12 w-full" id="judging-round-filter">
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
					<AdminScheduleGrid
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
						{unscheduledCount === 1 ? "assignment has" : "assignments have"} no
						time slot and cannot appear in the grid.
					</p>
				) : null}
			</section>
		</>
	);
}
