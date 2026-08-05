"use client";

import {
	cloneElement,
	isValidElement,
	type ReactElement,
	useEffect,
	useId,
	useMemo,
	useState
} from "react";
import { api, type RouterInputs, type RouterOutputs } from "@/trpc/react";
import { formatDateTime, toDateTimeLocalValue } from "./judgingFormatters";

type LayoutInput = RouterInputs["judgingRooms"]["saveLayoutByRound"]["layout"];
type LayoutRoomInput = NonNullable<LayoutInput["rooms"]>[number];
type SlotMinutes = 15 | 30 | 60;

const inputClass =
	"h-12 w-full rounded-xl border border-[#a5a5a5] bg-[#fcfcfc] px-4 text-base outline-none transition focus:border-[#7054fd] focus:ring-2 focus:ring-[#eae6ff] disabled:cursor-not-allowed disabled:opacity-60";
const primaryButtonClass =
	"rounded-xl bg-[#7054fd] px-4 py-2.5 font-medium text-white transition hover:bg-[#6044ed] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
	"rounded-xl border border-[#7054fd] bg-white px-4 py-2.5 font-medium text-[#2911a7] transition hover:bg-[#f7f5ff] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
	"rounded-xl border border-red-300 bg-white px-3 py-2 font-medium text-red-700 text-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60";

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
	children: React.ReactNode;
	description: string;
	id: string;
	title: string;
}) {
	return (
		<section className="scroll-mt-6" id={id}>
			<div className="mb-4">
				<h2 className="m-0 font-medium text-[22px] leading-7">{title}</h2>
				<p className="mt-1 mb-0 text-[#575757] text-sm">{description}</p>
			</div>
			<div className="rounded-2xl border border-[#e3e3e3] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-6">
				{children}
			</div>
		</section>
	);
}

function FieldLabel({
	children,
	label
}: {
	children: ReactElement<Record<string, unknown>>;
	label: string;
}) {
	const labelId = useId();
	return (
		<div className="flex min-w-0 flex-1 flex-col gap-2">
			<span className="pl-2 text-[#292929] text-sm" id={labelId}>
				{label}
			</span>
			{isValidElement(children)
				? cloneElement(children, { "aria-labelledby": labelId })
				: children}
		</div>
	);
}

function RoundManagement({
	onSelectRound,
	selectedRoundId
}: {
	onSelectRound: (roundId: string) => void;
	selectedRoundId: string;
}) {
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
			description="Create judging windows, adjust unscored rounds, and choose the active round."
			id="round-management"
			title="Judging rounds"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
				<FieldLabel label="Round name">
					<input
						className={inputClass}
						onChange={(event) => setName(event.target.value)}
						placeholder="Preliminary round"
						value={name}
					/>
				</FieldLabel>
				<FieldLabel label="Starts">
					<input
						className={inputClass}
						onChange={(event) => setStartTime(event.target.value)}
						type="datetime-local"
						value={startTime}
					/>
				</FieldLabel>
				<FieldLabel label="Ends">
					<input
						className={inputClass}
						onChange={(event) => setEndTime(event.target.value)}
						type="datetime-local"
						value={endTime}
					/>
				</FieldLabel>
				<div className="flex gap-2">
					<button
						className={primaryButtonClass}
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
					</button>
					{editingId ? (
						<button
							className={secondaryButtonClass}
							onClick={resetForm}
							type="button"
						>
							Cancel
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-6 overflow-x-auto">
				<table className="w-full min-w-[760px] border-collapse text-left text-sm">
					<thead>
						<tr className="border-[#d6d6d6] border-b text-[#575757]">
							<th className="px-3 py-3 font-medium">Round</th>
							<th className="px-3 py-3 font-medium">Start</th>
							<th className="px-3 py-3 font-medium">End</th>
							<th className="px-3 py-3 font-medium">Status</th>
							<th className="px-3 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{(roundsQuery.data ?? []).map((round) => {
							const isActive = settingsQuery.data?.currentRoundId === round.id;
							const hasScores = scoredRoundIds.has(round.id);
							return (
								<tr
									className="border-[#ededed] border-b last:border-0"
									key={round.id}
								>
									<td className="px-3 py-4 font-medium">{round.name}</td>
									<td className="px-3 py-4">
										{formatDateTime(round.startTime)}
									</td>
									<td className="px-3 py-4">{formatDateTime(round.endTime)}</td>
									<td className="px-3 py-4">
										{isActive ? (
											<span className="rounded-full bg-[#eae6ff] px-3 py-1 font-medium text-[#2911a7]">
												Active
											</span>
										) : (
											<span className="text-[#575757]">Inactive</span>
										)}
									</td>
									<td className="px-3 py-4">
										<div className="flex justify-end gap-2">
											{!isActive ? (
												<button
													className={secondaryButtonClass}
													disabled={setActiveRound.isPending}
													onClick={() =>
														setActiveRound.mutate({
															currentRoundId: round.id
														})
													}
													type="button"
												>
													Set active
												</button>
											) : null}
											<button
												className={secondaryButtonClass}
												disabled={hasScores}
												onClick={() => {
													setEditingId(round.id);
													setName(round.name);
													setStartTime(toDateTimeLocalValue(round.startTime));
													setEndTime(toDateTimeLocalValue(round.endTime));
													setMessage("");
												}}
												title={
													hasScores
														? "Scored rounds cannot be edited."
														: undefined
												}
												type="button"
											>
												Edit
											</button>
											<button
												className={dangerButtonClass}
												disabled={hasScores || deleteRound.isPending}
												onClick={() => {
													if (hasScores) {
														setMessage(
															"This round has scored assignments and cannot be deleted."
														);
														return;
													}
													if (
														window.confirm(
															`Delete "${round.name}"? Unscored rooms and assignments in it will also be deleted.`
														)
													) {
														deleteRound.mutate({ id: round.id });
													}
												}}
												title={
													hasScores
														? "Scored rounds are protected in the client."
														: undefined
												}
												type="button"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-[#575757] text-sm"
			>
				{message}
			</p>
		</ManagementSection>
	);
}

function RoomManagement({ roundId }: { roundId: string }) {
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
			!window.confirm(
				"This will replace the selected round's current unscored room layout and assignments. Continue?"
			)
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
			description="Create rooms, maintain meeting links, and choose the judges assigned to each room."
			id="room-management"
			title="Rooms"
		>
			<div className="mb-5 flex flex-wrap items-center justify-between gap-3">
				<p className="m-0 text-[#575757] text-sm">
					{roundId
						? `${rooms.length} rooms in the selected round`
						: "Select a round to manage its rooms."}
				</p>
				<button
					className={primaryButtonClass}
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
				</button>
			</div>

			<div className="grid gap-4 xl:grid-cols-2">
				{rooms.map((room) => (
					<article
						className="rounded-2xl border border-[#d6d6d6] bg-[#fcfcfc] p-4"
						key={room.id}
					>
						<div className="flex items-start justify-between gap-3">
							<div>
								<h3 className="m-0 font-medium text-lg">{room.name}</h3>
								<p className="mt-1 mb-0 text-[#575757] text-sm">
									{room.teamIds.length}{" "}
									{room.teamIds.length === 1 ? "team" : "teams"} assigned
								</p>
							</div>
							<button
								className={dangerButtonClass}
								disabled={saveLayout.isPending || hasScoredAssignments}
								onClick={async () => {
									if (
										!window.confirm(
											`Delete ${room.name}? Its unscored assignments will also be removed from the saved layout.`
										)
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
								title={
									hasScoredAssignments
										? "Scored rounds cannot be changed."
										: undefined
								}
								type="button"
							>
								Delete
							</button>
						</div>

						<div className="mt-4">
							<FieldLabel label="Meeting link">
								<input
									className={inputClass}
									onChange={(event) =>
										setLinks((current) => ({
											...current,
											[room.id]: event.target.value
										}))
									}
									placeholder="https://..."
									value={links[room.id] ?? ""}
								/>
							</FieldLabel>
						</div>

						<fieldset className="mt-4">
							<legend className="mb-2 px-2 text-sm">Assigned judges</legend>
							<div className="grid gap-2 sm:grid-cols-2">
								{judges.map((judge) => (
									<label
										className="flex items-center gap-2 rounded-lg border border-[#e3e3e3] bg-white px-3 py-2 text-sm"
										key={judge.id}
									>
										<input
											checked={(staff[room.id] ?? []).includes(judge.id)}
											className="accent-[#7054fd]"
											onChange={(event) =>
												setStaff((current) => {
													const selected = current[room.id] ?? [];
													return {
														...current,
														[room.id]: event.target.checked
															? [...selected, judge.id]
															: selected.filter((id) => id !== judge.id)
													};
												})
											}
											type="checkbox"
										/>
										<span className="truncate">{judge.name}</span>
									</label>
								))}
							</div>
						</fieldset>

						<div className="mt-4 flex justify-end">
							<button
								className={primaryButtonClass}
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
							</button>
						</div>
					</article>
				))}
			</div>

			{roundId && !layoutQuery.isLoading && rooms.length === 0 ? (
				<p className="rounded-xl border border-[#d6d6d6] border-dashed p-6 text-center text-[#575757]">
					This round has no rooms yet.
				</p>
			) : null}
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-[#575757] text-sm"
			>
				{message}
			</p>
		</ManagementSection>
	);
}

function AssignmentManagement({
	roundId,
	slotMinutes
}: {
	roundId: string;
	slotMinutes: SlotMinutes;
}) {
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
			description="Place or move individual teams when the generated schedule needs a manual adjustment."
			id="assignment-management"
			title="Manual assignments"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
				<FieldLabel label="Team">
					<select
						className={inputClass}
						disabled={!roundId}
						onChange={(event) => setTeamId(event.target.value)}
						value={teamId}
					>
						<option value="">Select team</option>
						{eligibleTeams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</FieldLabel>
				<FieldLabel label="Room">
					<select
						className={inputClass}
						disabled={!roundId}
						onChange={(event) => setRoomId(event.target.value)}
						value={roomId}
					>
						<option value="">Select room</option>
						{(layoutQuery.data?.rooms ?? []).map((room) => (
							<option key={room.id} value={room.id}>
								{room.name}
							</option>
						))}
					</select>
				</FieldLabel>
				<FieldLabel label="Time slot">
					<input
						className={inputClass}
						disabled={!roundId}
						onChange={(event) => setTimeSlot(event.target.value)}
						type="datetime-local"
						value={timeSlot}
					/>
				</FieldLabel>
				<div className="flex gap-2">
					<button
						className={primaryButtonClass}
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
					</button>
					{editingId ? (
						<button
							className={secondaryButtonClass}
							onClick={resetForm}
							type="button"
						>
							Cancel
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-6 overflow-x-auto">
				<table className="w-full min-w-[720px] border-collapse text-left text-sm">
					<thead>
						<tr className="border-[#d6d6d6] border-b text-[#575757]">
							<th className="px-3 py-3 font-medium">Team</th>
							<th className="px-3 py-3 font-medium">Room</th>
							<th className="px-3 py-3 font-medium">Time</th>
							<th className="px-3 py-3 font-medium">Scores</th>
							<th className="px-3 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{(assignmentsQuery.data ?? []).map((assignment) => {
							const isScored = assignment.scores.length > 0;
							return (
								<tr
									className="border-[#ededed] border-b last:border-0"
									key={assignment.id}
								>
									<td className="px-3 py-4 font-medium">
										{assignment.team.name}
									</td>
									<td className="px-3 py-4">
										{roomNames.get(assignment.room.id) ?? "Room"}
									</td>
									<td className="px-3 py-4">
										{assignment.timeSlot
											? formatDateTime(assignment.timeSlot)
											: "Unscheduled"}
									</td>
									<td className="px-3 py-4">{assignment.scores.length}</td>
									<td className="px-3 py-4">
										<div className="flex justify-end gap-2">
											<button
												className={secondaryButtonClass}
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
												title={
													isScored
														? "Scored assignments cannot be edited"
														: undefined
												}
												type="button"
											>
												Edit
											</button>
											<button
												className={dangerButtonClass}
												disabled={isScored || deleteAssignment.isPending}
												onClick={async () => {
													if (
														!window.confirm(
															`Delete the assignment for ${assignment.team.name}?`
														)
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
												title={
													isScored
														? "Scored assignments cannot be deleted"
														: undefined
												}
												type="button"
											>
												Delete
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
			{roundId &&
			!assignmentsQuery.isLoading &&
			!assignmentsQuery.data?.length ? (
				<p className="py-5 text-center text-[#575757]">
					No assignments exist for this round.
				</p>
			) : null}
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-[#575757] text-sm"
			>
				{message}
			</p>
		</ManagementSection>
	);
}

type Criterion = RouterOutputs["criteria"]["getAll"][number];

function CriteriaManagement() {
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
		if (!window.confirm(`Delete "${criterion.name}"?`)) return;
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
			description="Maintain the scoring criteria and sidepot categories shown to judges."
			id="criteria-management"
			title="Judging criteria"
		>
			<div className="grid gap-3 lg:grid-cols-[1fr_160px_160px_auto] lg:items-end">
				<FieldLabel label="Criterion name">
					<input
						className={inputClass}
						onChange={(event) => setName(event.target.value)}
						placeholder="Technical execution"
						value={name}
					/>
				</FieldLabel>
				<FieldLabel label="Maximum score">
					<input
						className={inputClass}
						max={100}
						min={1}
						onChange={(event) =>
							setMaxScore(Number.parseInt(event.target.value, 10) || 1)
						}
						type="number"
						value={maxScore}
					/>
				</FieldLabel>
				<label className="flex h-12 items-center gap-2 rounded-xl border border-[#a5a5a5] px-4">
					<input
						checked={isSidepot}
						className="accent-[#7054fd]"
						onChange={(event) => setIsSidepot(event.target.checked)}
						type="checkbox"
					/>
					<span>Sidepot</span>
				</label>
				<div className="flex gap-2">
					<button
						className={primaryButtonClass}
						disabled={
							!name.trim() ||
							createCriterion.isPending ||
							updateCriterion.isPending
						}
						onClick={() => void submit()}
						type="button"
					>
						{editingId ? "Save criterion" : "Add criterion"}
					</button>
					{editingId ? (
						<button
							className={secondaryButtonClass}
							onClick={resetForm}
							type="button"
						>
							Cancel
						</button>
					) : null}
				</div>
			</div>

			<div className="mt-6 overflow-x-auto">
				<table className="w-full min-w-[620px] border-collapse text-left text-sm">
					<thead>
						<tr className="border-[#d6d6d6] border-b text-[#575757]">
							<th className="px-3 py-3 font-medium">Name</th>
							<th className="px-3 py-3 font-medium">Maximum</th>
							<th className="px-3 py-3 font-medium">Type</th>
							<th className="px-3 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody>
						{(criteriaQuery.data ?? []).map((criterion) => (
							<tr
								className="border-[#ededed] border-b last:border-0"
								key={criterion.id}
							>
								<td className="px-3 py-4 font-medium">{criterion.name}</td>
								<td className="px-3 py-4">{criterion.maxScore}</td>
								<td className="px-3 py-4">
									{criterion.isSidepot ? "Sidepot" : "Main"}
								</td>
								<td className="px-3 py-4">
									<div className="flex justify-end gap-2">
										<button
											className={secondaryButtonClass}
											onClick={() => {
												setEditingId(criterion.id);
												setName(criterion.name);
												setMaxScore(criterion.maxScore);
												setIsSidepot(criterion.isSidepot);
												setMessage("");
											}}
											type="button"
										>
											Edit
										</button>
										<button
											className={dangerButtonClass}
											disabled={deleteCriterion.isPending}
											onClick={() => void removeCriterion(criterion)}
											type="button"
										>
											Delete
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p
				aria-live="polite"
				className="mt-3 mb-0 min-h-5 text-[#575757] text-sm"
			>
				{message}
			</p>
		</ManagementSection>
	);
}

function ResultsManagement() {
	const rankingsQuery = api.teams.getRankings.useQuery();

	return (
		<ManagementSection
			description="Review live team totals."
			id="results-management"
			title="Results"
		>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[520px] border-collapse text-left text-sm">
					<thead>
						<tr className="border-[#d6d6d6] border-b text-[#575757]">
							<th className="w-24 px-3 py-3 font-medium">Rank</th>
							<th className="px-3 py-3 font-medium">Team</th>
							<th className="px-3 py-3 text-right font-medium">Total score</th>
						</tr>
					</thead>
					<tbody>
						{(rankingsQuery.data ?? []).map((team, index) => (
							<tr
								className="border-[#ededed] border-b last:border-0"
								key={team.id}
							>
								<td className="px-3 py-4 font-semibold text-[#7054fd]">
									{index + 1}
								</td>
								<td className="px-3 py-4 font-medium">{team.name}</td>
								<td className="px-3 py-4 text-right">
									{Number(team.totalScore)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{!rankingsQuery.isLoading && !rankingsQuery.data?.length ? (
				<p className="py-5 text-center text-[#575757]">
					No teams are available for ranking.
				</p>
			) : null}
		</ManagementSection>
	);
}

export default function JudgingManagementSections({
	onSelectRound,
	selectedRoundId,
	slotMinutes
}: {
	onSelectRound: (roundId: string) => void;
	selectedRoundId: string;
	slotMinutes: 15 | 30 | 60;
}) {
	return (
		<div className="mt-10 flex flex-col gap-16">
			<RoundManagement
				onSelectRound={onSelectRound}
				selectedRoundId={selectedRoundId}
			/>
			<RoomManagement roundId={selectedRoundId} />
			<AssignmentManagement
				roundId={selectedRoundId}
				slotMinutes={slotMinutes}
			/>
			<CriteriaManagement />
			<ResultsManagement />
		</div>
	);
}
