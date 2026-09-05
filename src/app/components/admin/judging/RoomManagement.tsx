"use client";

import { useEffect, useMemo, useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Field,
	FieldLabel,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { api } from "@/trpc/react";

import {
	byNameThenId,
	type LayoutRoomInput,
	ManagementSection
} from "./judgingShared";

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
