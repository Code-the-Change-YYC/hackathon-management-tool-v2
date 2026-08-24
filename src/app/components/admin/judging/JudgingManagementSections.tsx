"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Field,
	FieldLabel,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
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
import { api, type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { formatDateTime, toDateTimeLocalValue } from "./judgingFormatters";

type LayoutInput = RouterInputs["judgingRooms"]["saveLayoutByRound"]["layout"];
type LayoutRoomInput = NonNullable<LayoutInput["rooms"]>[number];
type SlotMinutes = 15 | 30 | 60;

function byNameThenId<T extends { id: string; name: string }>(a: T, b: T) {
	const nameSort = a.name.localeCompare(b.name);
	return nameSort || a.id.localeCompare(b.id);
}

function ManagementSection({
	children,
	description,
	id,
	title
}: {
	children: ReactNode;
	description: string;
	id: string;
	title: string;
}) {
	return (
		<section className="scroll-mt-6" id={id}>
			<Card>
				<CardHeader>
					<CardTitle className="text-[22px] leading-7">{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		</section>
	);
}

export function RoundManagement({
	onSelectRound,
	selectedRoundId
}: {
	onSelectRound: (roundId: string) => void;
	selectedRoundId: string;
}) {
	const { confirm, dialog } = useConfirmDialog();
	const utils = api.useUtils();
	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const allAssignmentsQuery = api.judgingAssignments.getAll.useQuery();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");
	const [message, setMessage] = useState("");

	const resetForm = () => {
		setEditingId(null);
		setName("");
		setStartTime("");
		setEndTime("");
	};

	const invalidate = async () => {
		await Promise.all([
			utils.judgingRounds.getAll.invalidate(),
			utils.hackathonSettings.get.invalidate(),
			utils.judgingRooms.getLayoutByRound.invalidate(),
			utils.judgingAssignments.getAll.invalidate(),
			utils.judgingAssignments.getByRound.invalidate()
		]);
	};

	const createRound = api.judgingRounds.create.useMutation({
		onError: (error) => setMessage(error.message),
		onSuccess: async (round) => {
			await invalidate();
			onSelectRound(round?.id ?? "");
			resetForm();
			setMessage("Judging round created.");
		}
	});
	const updateRound = api.judgingRounds.update.useMutation({
		onError: (error) => setMessage(error.message),
		onSuccess: async () => {
			await invalidate();
			resetForm();
			setMessage("Judging round updated.");
		}
	});
	const deleteRound = api.judgingRounds.delete.useMutation({
		onError: (error) => setMessage(error.message),
		onSuccess: async (_, variables) => {
			await invalidate();
			if (selectedRoundId === variables.id) onSelectRound("");
			setMessage("Judging round deleted.");
		}
	});
	const setActiveRound = api.hackathonSettings.update.useMutation({
		onError: (error) => setMessage(error.message),
		onSuccess: async (_, variables) => {
			await invalidate();
			onSelectRound(variables.currentRoundId ?? "");
			setMessage("Active round updated.");
		}
	});

	const submit = () => {
		setMessage("");
		if (!name.trim() || !startTime || !endTime) return;
		const values = {
			endTime: new Date(endTime),
			name: name.trim(),
			startTime: new Date(startTime)
		};
		if (editingId) {
			updateRound.mutate({ id: editingId, ...values });
		} else {
			createRound.mutate(values);
		}
	};
	const scoredRoundIds = useMemo(() => {
		const ids = new Set<string>();
		for (const assignment of allAssignmentsQuery.data ?? []) {
			if (assignment.scores.length > 0) {
				ids.add(assignment.room.round.id);
			}
		}
		return ids;
	}, [allAssignmentsQuery.data]);

	return (
		<ManagementSection
			description="Start here. Each round is a judging window with a start and end time. Set one as active, then generate rooms below."
			id="round-management"
			title="Judging rounds"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Round name</FieldLabel>
					<Input
						className="h-12"
						onChange={(event) => setName(event.target.value)}
						placeholder="Preliminary round"
						value={name}
					/>
				</Field>
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Starts</FieldLabel>
					<Input
						className="h-12"
						onChange={(event) => setStartTime(event.target.value)}
						type="datetime-local"
						value={startTime}
					/>
				</Field>
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Ends</FieldLabel>
					<Input
						className="h-12"
						onChange={(event) => setEndTime(event.target.value)}
						type="datetime-local"
						value={endTime}
					/>
				</Field>
				<div className="flex gap-2">
					<Button
						disabled={
							!name.trim() ||
							!startTime ||
							!endTime ||
							createRound.isPending ||
							updateRound.isPending
						}
						onClick={submit}
						type="button"
					>
						{editingId ? "Save round" : "Add round"}
					</Button>
					{editingId ? (
						<Button onClick={resetForm} type="button" variant="outline">
							Cancel
						</Button>
					) : null}
				</div>
			</div>

			<div className="mt-6">
				<Table className="min-w-[760px]">
					<TableHeader>
						<TableRow>
							<TableHead className="px-3 py-3">Round</TableHead>
							<TableHead className="px-3 py-3">Start</TableHead>
							<TableHead className="px-3 py-3">End</TableHead>
							<TableHead className="px-3 py-3">Status</TableHead>
							<TableHead className="px-3 py-3 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(roundsQuery.data ?? []).map((round) => {
							const isActive = settingsQuery.data?.currentRoundId === round.id;
							const hasScores = scoredRoundIds.has(round.id);
							return (
								<TableRow key={round.id}>
									<TableCell className="px-3 py-4 font-medium">
										{round.name}
									</TableCell>
									<TableCell className="px-3 py-4">
										{formatDateTime(round.startTime)}
									</TableCell>
									<TableCell className="px-3 py-4">
										{formatDateTime(round.endTime)}
									</TableCell>
									<TableCell className="px-3 py-4">
										{isActive ? (
											<Badge variant="secondary">Active</Badge>
										) : (
											<span className="text-muted-foreground">Inactive</span>
										)}
									</TableCell>
									<TableCell className="px-3 py-4">
										<div className="flex justify-end gap-2">
											{!isActive ? (
												<Button
													disabled={setActiveRound.isPending}
													onClick={() =>
														setActiveRound.mutate({
															currentRoundId: round.id
														})
													}
													size="sm"
													type="button"
													variant="outline"
												>
													Set active
												</Button>
											) : null}
											<Button
												disabled={hasScores}
												onClick={() => {
													setEditingId(round.id);
													setName(round.name);
													setStartTime(toDateTimeLocalValue(round.startTime));
													setEndTime(toDateTimeLocalValue(round.endTime));
													setMessage("");
												}}
												size="sm"
												title={
													hasScores
														? "Scored rounds cannot be edited."
														: undefined
												}
												type="button"
												variant="outline"
											>
												Edit
											</Button>
											<Button
												disabled={hasScores || deleteRound.isPending}
												onClick={async () => {
													if (hasScores) {
														setMessage(
															"This round has scored assignments and cannot be deleted."
														);
														return;
													}
													if (
														!(await confirm({
															title: `Delete "${round.name}"?`,
															description:
																"Unscored rooms and assignments in it will also be deleted.",
															confirmLabel: "Delete",
															destructive: true
														}))
													) {
														return;
													}
													deleteRound.mutate({ id: round.id });
												}}
												size="sm"
												title={
													hasScores
														? "Scored rounds are protected in the client."
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

export function RoomManagement({ roundId }: { roundId: string }) {
	const { confirm, dialog } = useConfirmDialog();
	const utils = api.useUtils();
	const layoutQuery = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId },
		{ enabled: Boolean(roundId) }
	);
	const assignmentsQuery = api.judgingAssignments.getByRound.useQuery(
		{ roundId },
		{ enabled: Boolean(roundId) }
	);
	const usersQuery = api.users.getAll.useQuery();
	const judges = useMemo(
		() =>
			(usersQuery.data ?? [])
				.filter((person) => person.role === "judge")
				.sort(byNameThenId),
		[usersQuery.data]
	);
	const [links, setLinks] = useState<Record<string, string>>({});
	const [staff, setStaff] = useState<Record<string, string[]>>({});
	const [message, setMessage] = useState("");
	const [busyRoomId, setBusyRoomId] = useState<string | null>(null);
	const saveLayout = api.judgingRooms.saveLayoutByRound.useMutation();

	useEffect(() => {
		const nextLinks: Record<string, string> = {};
		const nextStaff: Record<string, string[]> = {};
		for (const room of layoutQuery.data?.rooms ?? []) {
			nextLinks[room.id] = room.roomLink ?? "";
			nextStaff[room.id] = room.staffIds;
		}
		setLinks(nextLinks);
		setStaff(nextStaff);
	}, [layoutQuery.data]);

	const invalidate = async () => {
		await Promise.all([
			utils.judgingRooms.getLayoutByRound.invalidate({ roundId }),
			utils.judgingAssignments.getByRound.invalidate({ roundId }),
			utils.judgingAssignments.getAll.invalidate()
		]);
	};
	const hasScoredAssignments = (assignmentsQuery.data ?? []).some(
		(assignment) => assignment.scores.length > 0
	);
	const rooms = layoutQuery.data?.rooms ?? [];

	const toLayoutRoom = (room: LayoutRoomInput): LayoutRoomInput => ({
		id: room.id,
		name: room.name,
		roomLink: links[room.id] ?? room.roomLink ?? "",
		staffIds: staff[room.id] ?? room.staffIds ?? [],
		teamIds: room.teamIds ?? [],
		teamTimeSlots: room.teamTimeSlots ?? {}
	});

	const persistRooms = async ({
		nextRooms,
		roomId,
		successMessage
	}: {
		nextRooms: LayoutRoomInput[];
		roomId?: string;
		successMessage: string;
	}) => {
		if (!roundId) return;
		if (hasScoredAssignments) {
			setMessage(
				"This round has scored assignments, so room changes are disabled."
			);
			return;
		}
		if (
			(assignmentsQuery.data?.length ?? 0) > 0 &&
			!(await confirm({
				title: "Replace room layout?",
				description:
					"This will replace the selected round's current unscored room layout and assignments. Continue?",
				confirmLabel: "Continue"
			}))
		) {
			setMessage("Room change cancelled.");
			return;
		}

		setBusyRoomId(roomId ?? "layout");
		setMessage("");
		try {
			await saveLayout.mutateAsync({
				layout: { rooms: nextRooms.map(toLayoutRoom) },
				roundId
			});
			await invalidate();
			setMessage(successMessage);
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Room layout update failed."
			);
		} finally {
			setBusyRoomId(null);
		}
	};

	const saveRoom = async (roomId: string) => {
		await persistRooms({
			nextRooms: rooms,
			roomId,
			successMessage: "Room details saved."
		});
	};

	return (
		<ManagementSection
			description="Optional. Add meeting links, extra rooms, or change judges after generating the schedule."
			id="room-management"
			title="Rooms"
		>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<p className="m-0 text-muted-foreground text-sm">
					{roundId
						? `${rooms.length} rooms in the selected round`
						: "Select a round to manage its rooms."}
				</p>
				<Button
					disabled={
						!roundId ||
						saveLayout.isPending ||
						hasScoredAssignments ||
						layoutQuery.isLoading
					}
					onClick={async () => {
						await persistRooms({
							nextRooms: [
								...rooms,
								{
									id: crypto.randomUUID(),
									name: `Room ${rooms.length + 1}`,
									roomLink: "",
									staffIds: [],
									teamIds: [],
									teamTimeSlots: {}
								}
							],
							successMessage: "Room created."
						});
					}}
					title={
						hasScoredAssignments
							? "Scored rounds cannot be changed."
							: undefined
					}
					type="button"
				>
					+ Add room
				</Button>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				{rooms.map((room) => (
					<Card className="bg-muted" key={room.id}>
						<CardContent className="pt-6">
							<div className="flex items-start justify-between gap-3">
								<div>
									<h3 className="m-0 font-medium text-lg">{room.name}</h3>
									<p className="mt-1 mb-0 text-muted-foreground text-sm">
										{room.teamIds.length}{" "}
										{room.teamIds.length === 1 ? "team" : "teams"} assigned
									</p>
								</div>
								<Button
									disabled={saveLayout.isPending || hasScoredAssignments}
									onClick={async () => {
										if (
											!(await confirm({
												title: `Delete ${room.name}?`,
												description:
													"Its unscored assignments will also be removed from the saved layout.",
												confirmLabel: "Delete",
												destructive: true
											}))
										) {
											return;
										}
										await persistRooms({
											nextRooms: rooms.filter(
												(candidate) => candidate.id !== room.id
											),
											roomId: room.id,
											successMessage: "Room deleted."
										});
									}}
									size="sm"
									title={
										hasScoredAssignments
											? "Scored rounds cannot be changed."
											: undefined
									}
									type="button"
									variant="destructive"
								>
									Delete
								</Button>
							</div>

							<div className="mt-4">
								<Field className="min-w-0 flex-1 gap-2">
									<FieldLabel>Meeting link</FieldLabel>
									<Input
										className="h-12"
										onChange={(event) =>
											setLinks((current) => ({
												...current,
												[room.id]: event.target.value
											}))
										}
										placeholder="https://..."
										value={links[room.id] ?? ""}
									/>
								</Field>
							</div>

							<FieldSet className="mt-4">
								<FieldLegend className="mb-2 px-2 text-sm" variant="label">
									Assigned judges
								</FieldLegend>
								<div className="grid gap-2 sm:grid-cols-2">
									{judges.map((judge) => (
										<div
											className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
											key={judge.id}
										>
											<Checkbox
												checked={(staff[room.id] ?? []).includes(judge.id)}
												id={`room-${room.id}-judge-${judge.id}`}
												onCheckedChange={(checked) => {
													setStaff((current) => {
														const selected = current[room.id] ?? [];
														return {
															...current,
															[room.id]: checked
																? [...selected, judge.id]
																: selected.filter((id) => id !== judge.id)
														};
													});
												}}
											/>
											<label
												className="truncate"
												htmlFor={`room-${room.id}-judge-${judge.id}`}
											>
												{judge.name}
											</label>
										</div>
									))}
								</div>
							</FieldSet>

							<div className="mt-4 flex justify-end">
								<Button
									disabled={
										saveLayout.isPending ||
										busyRoomId === room.id ||
										hasScoredAssignments
									}
									onClick={() => void saveRoom(room.id)}
									title={
										hasScoredAssignments
											? "Scored rounds cannot be changed."
											: undefined
									}
									type="button"
								>
									{busyRoomId === room.id ? "Saving…" : "Save room"}
								</Button>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{roundId && !layoutQuery.isLoading && rooms.length === 0 ? (
				<p className="rounded-xl border border-border border-dashed p-6 text-center text-muted-foreground">
					This round has no rooms yet.
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

type Criterion = RouterOutputs["criteria"]["getAll"][number];

export function CriteriaManagement() {
	const { confirm, dialog } = useConfirmDialog();
	const utils = api.useUtils();
	const criteriaQuery = api.criteria.getAll.useQuery();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [maxScore, setMaxScore] = useState(10);
	const [isSidepot, setIsSidepot] = useState(false);
	const [message, setMessage] = useState("");

	const createCriterion = api.criteria.create.useMutation();
	const updateCriterion = api.criteria.update.useMutation();
	const deleteCriterion = api.criteria.delete.useMutation();

	const resetForm = () => {
		setEditingId(null);
		setName("");
		setMaxScore(10);
		setIsSidepot(false);
	};
	const submit = async () => {
		if (!name.trim()) return;
		setMessage("");
		try {
			if (editingId) {
				await updateCriterion.mutateAsync({
					id: editingId,
					isSidepot,
					maxScore,
					name: name.trim()
				});
				setMessage("Criterion updated.");
			} else {
				await createCriterion.mutateAsync({
					isSidepot,
					maxScore,
					name: name.trim()
				});
				setMessage("Criterion created.");
			}
			resetForm();
			await utils.criteria.getAll.invalidate();
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Criterion could not be saved."
			);
		}
	};
	const removeCriterion = async (criterion: Criterion) => {
		if (
			!(await confirm({
				title: `Delete "${criterion.name}"?`,
				description: "This criterion will be removed from judging.",
				confirmLabel: "Delete",
				destructive: true
			}))
		) {
			return;
		}
		setMessage("");
		try {
			await deleteCriterion.mutateAsync({ id: criterion.id });
			await Promise.all([
				utils.criteria.getAll.invalidate(),
				utils.teams.getRankings.invalidate()
			]);
			resetForm();
			setMessage("Criterion deleted.");
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Criterion deletion failed."
			);
		}
	};

	return (
		<ManagementSection
			description="Scoring categories judges see. Set these up before judging starts."
			id="criteria-management"
			title="Judging criteria"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Criterion name</FieldLabel>
					<Input
						className="h-12"
						onChange={(event) => setName(event.target.value)}
						placeholder="Technical execution"
						value={name}
					/>
				</Field>
				<Field className="min-w-0 flex-1 gap-2">
					<FieldLabel>Maximum score</FieldLabel>
					<Input
						className="h-12"
						max={100}
						min={1}
						onChange={(event) =>
							setMaxScore(Number.parseInt(event.target.value, 10) || 1)
						}
						type="number"
						value={maxScore}
					/>
				</Field>
				<div className="flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-4">
					<Checkbox
						checked={isSidepot}
						id="criterion-sidepot"
						onCheckedChange={(checked) => setIsSidepot(checked === true)}
					/>
					<label htmlFor="criterion-sidepot">Sidepot</label>
				</div>
				<div className="flex gap-2">
					<Button
						disabled={
							!name.trim() ||
							createCriterion.isPending ||
							updateCriterion.isPending
						}
						onClick={() => void submit()}
						type="button"
					>
						{editingId ? "Save criterion" : "Add criterion"}
					</Button>
					{editingId ? (
						<Button onClick={resetForm} type="button" variant="outline">
							Cancel
						</Button>
					) : null}
				</div>
			</div>

			<div className="mt-6">
				<Table className="min-w-[620px]">
					<TableHeader>
						<TableRow>
							<TableHead className="px-3 py-3">Name</TableHead>
							<TableHead className="px-3 py-3">Maximum</TableHead>
							<TableHead className="px-3 py-3">Type</TableHead>
							<TableHead className="px-3 py-3 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{(criteriaQuery.data ?? []).map((criterion) => (
							<TableRow key={criterion.id}>
								<TableCell className="px-3 py-4 font-medium">
									{criterion.name}
								</TableCell>
								<TableCell className="px-3 py-4">
									{criterion.maxScore}
								</TableCell>
								<TableCell className="px-3 py-4">
									{criterion.isSidepot ? "Sidepot" : "Main"}
								</TableCell>
								<TableCell className="px-3 py-4">
									<div className="flex justify-end gap-2">
										<Button
											onClick={() => {
												setEditingId(criterion.id);
												setName(criterion.name);
												setMaxScore(criterion.maxScore);
												setIsSidepot(criterion.isSidepot);
												setMessage("");
											}}
											size="sm"
											type="button"
											variant="outline"
										>
											Edit
										</Button>
										<Button
											disabled={deleteCriterion.isPending}
											onClick={() => void removeCriterion(criterion)}
											size="sm"
											type="button"
											variant="destructive"
										>
											Delete
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
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

export function ResultsManagement() {
	const rankingsQuery = api.teams.getRankings.useQuery();

	return (
		<ManagementSection
			description="Live team totals after scores are submitted."
			id="results-management"
			title="Results"
		>
			<Table className="min-w-[520px]">
				<TableHeader>
					<TableRow>
						<TableHead className="w-24 px-3 py-3">Rank</TableHead>
						<TableHead className="px-3 py-3">Team</TableHead>
						<TableHead className="px-3 py-3 text-right">Total score</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{(rankingsQuery.data ?? []).map((team, index) => (
						<TableRow key={team.id}>
							<TableCell className="px-3 py-4 font-semibold text-primary">
								{index + 1}
							</TableCell>
							<TableCell className="px-3 py-4 font-medium">
								{team.name}
							</TableCell>
							<TableCell className="px-3 py-4 text-right">
								{Number(team.totalScore)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			{!rankingsQuery.isLoading && !rankingsQuery.data?.length ? (
				<p className="py-5 text-center text-muted-foreground">
					No teams are available for ranking.
				</p>
			) : null}
		</ManagementSection>
	);
}
