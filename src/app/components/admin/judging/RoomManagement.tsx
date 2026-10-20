"use client";

import { useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Field,
	FieldLabel,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useRefresh } from "@/hooks/use-refresh";
import { tryCatch } from "@/lib/utils";
import { api } from "@/trpc/react";

import {
	type Assignment,
	type Judge,
	type LayoutRoomInput,
	ManagementSection,
	type Room
} from "./judgingShared";

export function RoomManagement({
	roundId,
	rooms,
	assignments,
	judges
}: {
	roundId: string;
	rooms: Room[];
	assignments: Assignment[];
	judges: Judge[];
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { refresh } = useRefresh();
	// Unsaved edits by room ID. Rooms without an edit show their saved values,
	// so a refresh after another save on the page keeps these edits.
	const [linkEdits, setLinkEdits] = useState<Record<string, string>>({});
	const [staffEdits, setStaffEdits] = useState<Record<string, string[]>>({});
	const [message, setMessage] = useState("");
	const [busyRoomId, setBusyRoomId] = useState<string | null>(null);
	const saveLayout = api.judgingRooms.saveLayoutByRound.useMutation();

	const linkFor = (room: Room) => linkEdits[room.id] ?? room.roomLink ?? "";
	const staffFor = (room: Room) => staffEdits[room.id] ?? room.staffIds;

	const clearEdits = (roomId: string) => {
		setLinkEdits(({ [roomId]: _, ...others }) => others);
		setStaffEdits(({ [roomId]: _, ...others }) => others);
	};

	const hasScoredAssignments = assignments.some(
		(assignment) => assignment.scores.length > 0
	);

	const toLayoutRoom = (room: LayoutRoomInput): LayoutRoomInput => ({
		id: room.id,
		roomLink: room.roomLink ?? "",
		staffIds: room.staffIds ?? [],
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
		if (!roundId || saveLayout.isPending || busyRoomId) return;
		if (hasScoredAssignments) {
			setMessage(
				"This round has scored assignments, so room changes are disabled."
			);
			return;
		}
		if (
			assignments.length > 0 &&
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
		const { error } = await tryCatch(
			saveLayout.mutateAsync({
				layout: { rooms: nextRooms.map(toLayoutRoom) },
				roundId
			})
		);
		if (error) {
			setBusyRoomId(null);
			setMessage(
				error instanceof Error ? error.message : "Room layout update failed."
			);
			return;
		}
		refresh(() => {
			if (roomId) clearEdits(roomId);
			setBusyRoomId(null);
			setMessage(successMessage);
		});
	};

	// Saves only this room's edits; other rooms keep their saved values.
	const saveRoom = async (room: Room) => {
		await persistRooms({
			nextRooms: rooms.map((candidate) =>
				candidate.id === room.id
					? {
							...candidate,
							roomLink: linkFor(candidate),
							staffIds: staffFor(candidate)
						}
					: candidate
			),
			roomId: room.id,
			successMessage: "Room details saved."
		});
	};

	const removeRoom = async (room: (typeof rooms)[number]) => {
		if (saveLayout.isPending || busyRoomId || hasScoredAssignments) return;

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
			nextRooms: rooms.filter((candidate) => candidate.id !== room.id),
			roomId: room.id,
			successMessage: "Room deleted."
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
					disabled={!roundId || saveLayout.isPending || hasScoredAssignments}
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
									onClick={() => void removeRoom(room)}
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
											setLinkEdits((current) => ({
												...current,
												[room.id]: event.target.value
											}))
										}
										placeholder="https://..."
										value={linkFor(room)}
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
												checked={staffFor(room).includes(judge.id)}
												id={`room-${room.id}-judge-${judge.id}`}
												onCheckedChange={(checked) => {
													setStaffEdits((current) => {
														const selected = current[room.id] ?? room.staffIds;
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
									onClick={() => void saveRoom(room)}
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

			{roundId && rooms.length === 0 && (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No rooms yet</EmptyTitle>
						<EmptyDescription>
							Assign teams to rooms above, or add a room here.
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
