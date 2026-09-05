"use client";

import { useMemo, useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Field, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
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

import { ManagementSection } from "./judgingShared";

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
