"use client";

import { addMinutes } from "date-fns";
import { useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
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
import { useRefresh } from "@/hooks/use-refresh";
import {
	formatDateTime,
	fromDateTimeLocalValue,
	toDateTimeLocalValue
} from "@/lib/datetime";
import type { SlotMinutes } from "@/lib/judging";
import { tryCatch } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
	type Assignment,
	ManagementSection,
	type Room,
	type Round,
	type Team
} from "./judgingShared";

export function AssignmentManagement({
	round,
	rooms,
	assignments,
	eligibleTeams,
	slotMinutes
}: {
	round: Round | undefined;
	rooms: Room[];
	assignments: Assignment[];
	eligibleTeams: Team[];
	slotMinutes: SlotMinutes;
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const roundId = round?.id ?? "";
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
	const createAssignment = api.judgingAssignments.create.useMutation();
	const updateAssignment = api.judgingAssignments.update.useMutation();
	const deleteAssignment = api.judgingAssignments.delete.useMutation();
	const isSaving =
		createAssignment.isPending || updateAssignment.isPending || isRefreshing;

	const submit = async () => {
		if (!teamId || !roomId || !timeSlot || isSaving) return;
		setMessage("");
		const parsedTimeSlot = fromDateTimeLocalValue(timeSlot);
		if (!parsedTimeSlot) {
			setMessage("Choose a valid time slot.");
			return;
		}
		const parsedTime = parsedTimeSlot.getTime();
		if (
			round &&
			(parsedTime < round.startTime.getTime() ||
				parsedTime >= round.endTime.getTime())
		) {
			setMessage("Time slot must be inside the selected judging round.");
			return;
		}
		if (!rooms.some((room) => room.id === roomId)) {
			setMessage("Choose a room from the selected round.");
			return;
		}
		const slotStart = parsedTime;
		const slotEnd = addMinutes(slotStart, slotMinutes).getTime();
		const teamAlreadyAssigned = assignments.some(
			(assignment) =>
				assignment.id !== editingId && assignment.teamId === teamId
		);
		if (teamAlreadyAssigned) {
			setMessage("That team is already assigned in this round.");
			return;
		}
		const roomSlotTaken = assignments.some((assignment) => {
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
		const values = { roomId, teamId, timeSlot: parsedTimeSlot };
		const { error } = await tryCatch(
			editingId
				? updateAssignment.mutateAsync({ id: editingId, ...values })
				: createAssignment.mutateAsync(values)
		);
		if (error) {
			setMessage(
				error instanceof Error
					? error.message
					: "Assignment could not be saved."
			);
			return;
		}
		refresh(() => {
			resetForm();
			setMessage(editingId ? "Assignment updated." : "Assignment created.");
		});
	};
	const removeAssignment = async (assignment: Assignment) => {
		if (deleteAssignment.isPending || assignment.scores.length > 0) return;
		if (
			!(await confirm({
				title: `Delete the assignment for ${assignment.team.name}?`,
				description: "This action cannot be undone.",
				confirmLabel: "Delete",
				destructive: true
			}))
		)
			return;
		setMessage("");
		const { error } = await tryCatch(
			deleteAssignment.mutateAsync({ id: assignment.id })
		);
		if (error) {
			setMessage(
				error instanceof Error ? error.message : "Assignment deletion failed."
			);
			return;
		}
		refresh(() => setMessage("Assignment deleted."));
	};

	const roomNames = new Map(rooms.map((room) => [room.id, room.name]));

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
						items={eligibleTeams.map((team) => ({
							value: team.id,
							label: team.name
						}))}
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
						items={rooms.map((room) => ({ value: room.id, label: room.name }))}
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
								{rooms.map((room) => (
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
						disabled={!teamId || !roomId || !timeSlot || isSaving}
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
				<Table className="min-w-180">
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
						{assignments.map((assignment) => {
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
														toDateTimeLocalValue(assignment.timeSlot)
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
												disabled={
													isScored || deleteAssignment.isPending || isRefreshing
												}
												onClick={() => void removeAssignment(assignment)}
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
			{roundId && assignments.length === 0 && (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No assignments yet</EmptyTitle>
						<EmptyDescription>
							Assign teams to rooms above, or add one team here.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-muted-foreground text-sm"
			>
				{message}
			</p>
			<ConfirmAlertDialog {...dialogProps} />
		</ManagementSection>
	);
}
