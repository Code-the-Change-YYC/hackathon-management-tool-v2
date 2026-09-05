"use client";

import { useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { formatDateTime, toDateTimeLocalValue } from "@/lib/datetime";
import { api } from "@/trpc/react";

import { ManagementSection, type SlotMinutes } from "./judgingShared";

export function AssignmentManagement({
	roundId,
	slotMinutes
}: {
	roundId: string;
	slotMinutes: SlotMinutes;
}) {
	const { confirm, dialog } = useConfirmDialog();
	const utils = api.useUtils();
	const assignmentsQuery = api.judgingAssignments.getByRound.useQuery(
		{ roundId },
		{ enabled: Boolean(roundId) }
	);
	const layoutQuery = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId },
		{ enabled: Boolean(roundId) }
	);
	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const teamsQuery = api.teams.getAll.useQuery();
	const eligibleTeams = (teamsQuery.data ?? []).filter(
		(team) => team.prescreenStatus === "passed"
	);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [teamId, setTeamId] = useState("");
	const [roomId, setRoomId] = useState("");
	const [timeSlot, setTimeSlot] = useState("");
	const [message, setMessage] = useState("");

	const resetForm = () => {
		setEditingId(null);
		setTeamId("");
		setRoomId("");
		setTimeSlot("");
	};
	const invalidate = async () => {
		await Promise.all([
			utils.judgingAssignments.getByRound.invalidate({ roundId }),
			utils.judgingRooms.getLayoutByRound.invalidate({ roundId }),
			utils.teams.getRankings.invalidate()
		]);
	};
	const createAssignment = api.judgingAssignments.create.useMutation();
	const updateAssignment = api.judgingAssignments.update.useMutation();
	const deleteAssignment = api.judgingAssignments.delete.useMutation();

	const submit = async () => {
		if (!teamId || !roomId || !timeSlot) return;
		setMessage("");
		const selectedRound = roundsQuery.data?.find(
			(round) => round.id === roundId
		);
		const parsedTimeSlot = new Date(timeSlot);
		const parsedTime = parsedTimeSlot.getTime();
		if (Number.isNaN(parsedTime)) {
			setMessage("Choose a valid time slot.");
			return;
		}
		if (
			selectedRound &&
			(parsedTime < selectedRound.startTime.getTime() ||
				parsedTime >= selectedRound.endTime.getTime())
		) {
			setMessage("Time slot must be inside the selected judging round.");
			return;
		}
		if (!layoutQuery.data?.rooms.some((room) => room.id === roomId)) {
			setMessage("Choose a room from the selected round.");
			return;
		}
		const slotStart = parsedTime;
		const slotEnd = slotStart + slotMinutes * 60 * 1000;
		const teamAlreadyAssigned = (assignmentsQuery.data ?? []).some(
			(assignment) =>
				assignment.id !== editingId && assignment.teamId === teamId
		);
		if (teamAlreadyAssigned) {
			setMessage("That team is already assigned in this round.");
			return;
		}
		const roomSlotTaken = (assignmentsQuery.data ?? []).some((assignment) => {
			if (
				assignment.id === editingId ||
				assignment.room.id !== roomId ||
				!assignment.timeSlot
			) {
				return false;
			}
			const assignmentTime = assignment.timeSlot.getTime();
			return assignmentTime >= slotStart && assignmentTime < slotEnd;
		});
		if (roomSlotTaken) {
			setMessage("That room already has an assignment in this time slot.");
			return;
		}
		try {
			if (editingId) {
				await updateAssignment.mutateAsync({
					id: editingId,
					roomId,
					teamId,
					timeSlot: parsedTimeSlot
				});
				setMessage("Assignment updated.");
			} else {
				await createAssignment.mutateAsync({
					roomId,
					teamId,
					timeSlot: parsedTimeSlot
				});
				setMessage("Assignment created.");
			}
			resetForm();
			await invalidate();
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Assignment could not be saved."
			);
		}
	};

	const roomNames = new Map(
		(layoutQuery.data?.rooms ?? []).map((room) => [room.id, room.name])
	);

	return (
		<ManagementSection
			description="Optional. Move or add a single team after generating the schedule."
			id="assignment-management"
			title="Manual assignments"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Team</FieldLabel>
					<Select
						disabled={!roundId}
						onValueChange={(value) => {
							if (value != null) setTeamId(value);
						}}
						value={teamId || null}
					>
						<SelectTrigger className="h-12 w-full">
							<SelectValue placeholder="Select team" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{eligibleTeams.map((team) => (
									<SelectItem key={team.id} value={team.id}>
										{team.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Room</FieldLabel>
					<Select
						disabled={!roundId}
						onValueChange={(value) => {
							if (value != null) setRoomId(value);
						}}
						value={roomId || null}
					>
						<SelectTrigger className="h-12 w-full">
							<SelectValue placeholder="Select room" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{(layoutQuery.data?.rooms ?? []).map((room) => (
									<SelectItem key={room.id} value={room.id}>
										{room.name}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
				</Field>
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Time slot</FieldLabel>
					<Input
						className="h-12"
						disabled={!roundId}
						onChange={(event) => setTimeSlot(event.target.value)}
						type="datetime-local"
						value={timeSlot}
					/>
				</Field>
				<div className="flex gap-2">
					<Button
						disabled={
							!teamId ||
							!roomId ||
							!timeSlot ||
							createAssignment.isPending ||
							updateAssignment.isPending
						}
						onClick={() => void submit()}
						type="button"
					>
						{editingId ? "Save assignment" : "Add assignment"}
					</Button>
					{editingId ? (
						<Button onClick={resetForm} type="button" variant="outline">
							Cancel
						</Button>
					) : null}
				</div>
			</div>

			<div className="mt-6">
				<Table className="min-w-[720px]">
					<TableHeader>
						<TableRow>
							<TableHead className="px-3 py-3">Team</TableHead>
							<TableHead className="px-3 py-3">Room</TableHead>
							<TableHead className="px-3 py-3">Time</TableHead>
							<TableHead className="px-3 py-3">Scores</TableHead>
							<TableHead className="px-3 py-3 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(assignmentsQuery.data ?? []).map((assignment) => {
							const isScored = assignment.scores.length > 0;
							return (
								<TableRow key={assignment.id}>
									<TableCell className="px-3 py-4 font-medium">
										{assignment.team.name}
									</TableCell>
									<TableCell className="px-3 py-4">
										{roomNames.get(assignment.room.id) ?? "Room"}
									</TableCell>
									<TableCell className="px-3 py-4">
										{assignment.timeSlot
											? formatDateTime(assignment.timeSlot)
											: "Unscheduled"}
									</TableCell>
									<TableCell className="px-3 py-4">
										{assignment.scores.length}
									</TableCell>
									<TableCell className="px-3 py-4">
										<div className="flex justify-end gap-2">
											<Button
												disabled={isScored}
												onClick={() => {
													setEditingId(assignment.id);
													setTeamId(assignment.teamId);
													setRoomId(assignment.room.id);
													setTimeSlot(
														assignment.timeSlot
															? toDateTimeLocalValue(assignment.timeSlot)
															: ""
													);
													setMessage("");
												}}
												size="sm"
												title={
													isScored
														? "Scored assignments cannot be edited"
														: undefined
												}
												type="button"
												variant="outline"
											>
												Edit
											</Button>
											<Button
												disabled={isScored || deleteAssignment.isPending}
												onClick={async () => {
													if (
														!(await confirm({
															title: `Delete the assignment for ${assignment.team.name}?`,
															description: "This action cannot be undone.",
															confirmLabel: "Delete",
															destructive: true
														}))
													) {
														return;
													}
													setMessage("");
													try {
														await deleteAssignment.mutateAsync({
															id: assignment.id
														});
														await invalidate();
														setMessage("Assignment deleted.");
													} catch (error) {
														setMessage(
															error instanceof Error
																? error.message
																: "Assignment deletion failed."
														);
													}
												}}
												size="sm"
												title={
													isScored
														? "Scored assignments cannot be deleted"
														: undefined
												}
												type="button"
												variant="destructive"
											>
												Delete
											</Button>
										</div>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</div>
			{roundId &&
			!assignmentsQuery.isLoading &&
			!assignmentsQuery.data?.length ? (
				<p className="py-5 text-center text-muted-foreground">
					No assignments exist for this round.
				</p>
			) : null}
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-muted-foreground text-sm"
			>
				{message}
			</p>
			{dialog}
		</ManagementSection>
	);
}
