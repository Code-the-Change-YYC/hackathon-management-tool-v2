"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
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
	const { confirm, dialogProps } = useConfirmDialog();
	const utils = api.useUtils();
	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const allAssignmentsQuery = api.judgingAssignments.getAll.useQuery();
	const [editingId, setEditingId] = useState<string | null>(null);
	const {
		register,
		handleSubmit,
		reset,
		getValues,
		formState: { errors }
	} = useForm({
		defaultValues: { name: "", startTime: "", endTime: "" }
	});
	const [message, setMessage] = useState("");

	const resetForm = () => {
		setEditingId(null);
		reset({ name: "", startTime: "", endTime: "" });
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

	const submit = handleSubmit(({ name, startTime, endTime }) => {
		if (createRound.isPending || updateRound.isPending) return;
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
	});
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
			<form onSubmit={submit}>
				<FieldGroup className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
					<Field
						className="min-w-0 flex-1 gap-2"
						data-invalid={Boolean(errors.name)}
					>
						<FieldLabel htmlFor="round-name">Round name</FieldLabel>
						<Input
							aria-invalid={Boolean(errors.name)}
							className="h-12"
							id="round-name"
							{...register("name", {
								required: "This field is required.",
								validate: (value) =>
									Boolean(value.trim()) || "Round name is required."
							})}
							placeholder="Preliminary round"
						/>
						<FieldError errors={[errors.name]} />
					</Field>
					<Field
						className="min-w-0 flex-1 gap-2"
						data-invalid={Boolean(errors.startTime)}
					>
						<FieldLabel htmlFor="round-startTime">Starts</FieldLabel>
						<Input
							aria-invalid={Boolean(errors.startTime)}
							className="h-12"
							id="round-startTime"
							{...register("startTime", {
								required: "This field is required.",
								validate: (value) =>
									!Number.isNaN(new Date(value).getTime()) ||
									"Choose a valid start time."
							})}
							type="datetime-local"
						/>
						<FieldError errors={[errors.startTime]} />
					</Field>
					<Field
						className="min-w-0 flex-1 gap-2"
						data-invalid={Boolean(errors.endTime)}
					>
						<FieldLabel htmlFor="round-endTime">Ends</FieldLabel>
						<Input
							aria-invalid={Boolean(errors.endTime)}
							className="h-12"
							id="round-endTime"
							{...register("endTime", {
								required: "This field is required.",
								validate: (value) =>
									new Date(value) > new Date(getValues("startTime")) ||
									"End time must be after start time."
							})}
							type="datetime-local"
						/>
						<FieldError errors={[errors.endTime]} />
					</Field>
					<div className="flex gap-2">
						<Button
							disabled={createRound.isPending || updateRound.isPending}
							type="submit"
						>
							{editingId ? "Save round" : "Add round"}
						</Button>
						{editingId ? (
							<Button onClick={resetForm} type="button" variant="outline">
								Cancel
							</Button>
						) : null}
					</div>
				</FieldGroup>
			</form>

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
													reset({
														name: round.name,
														startTime: toDateTimeLocalValue(round.startTime),
														endTime: toDateTimeLocalValue(round.endTime)
													});
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
			<ConfirmAlertDialog {...dialogProps} />
		</ManagementSection>
	);
}
