"use client";

import { useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
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
import { useRefresh } from "@/hooks/use-refresh";
import { MAIN_CRITERION_MAX_SCORE } from "@/lib/judging";
import { tryCatch } from "@/lib/utils";
import { api } from "@/trpc/react";
import { type Criterion, ManagementSection, type Round } from "./judgingShared";

export function CriteriaManagement({
	criteria,
	rounds
}: {
	criteria: Criterion[];
	rounds: Round[];
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [editingId, setEditingId] = useState<string | null>(null);
	const [name, setName] = useState("");
	const [maxScore, setMaxScore] = useState(MAIN_CRITERION_MAX_SCORE);
	const [isSidepot, setIsSidepot] = useState(false);
	const [roundIds, setRoundIds] = useState<string[]>([]);
	const roundNames = new Map(rounds.map((round) => [round.id, round.name]));
	const [message, setMessage] = useState("");

	const createCriterion = api.criteria.create.useMutation();
	const updateCriterion = api.criteria.update.useMutation();
	const deleteCriterion = api.criteria.delete.useMutation();

	const resetForm = () => {
		setEditingId(null);
		setName("");
		setMaxScore(MAIN_CRITERION_MAX_SCORE);
		setIsSidepot(false);
		setRoundIds([]);
	};
	const isSaving =
		createCriterion.isPending || updateCriterion.isPending || isRefreshing;

	const submit = async () => {
		if (!name.trim() || isSaving) return;
		setMessage("");
		const values = {
			roundIds,
			isSidepot,
			maxScore: isSidepot ? maxScore : MAIN_CRITERION_MAX_SCORE,
			name: name.trim()
		};
		const { error } = await tryCatch<unknown>(
			editingId
				? updateCriterion.mutateAsync({ id: editingId, ...values })
				: createCriterion.mutateAsync(values)
		);
		if (error) {
			setMessage(
				error instanceof Error ? error.message : "Criterion could not be saved."
			);
			return;
		}
		refresh(() => {
			resetForm();
			setMessage(editingId ? "Criterion updated." : "Criterion created.");
		});
	};
	const removeCriterion = async (criterion: Criterion) => {
		if (deleteCriterion.isPending) return;
		if (
			!(await confirm({
				title: `Delete "${criterion.name}"?`,
				description: "This criterion will be removed from judging.",
				confirmLabel: "Delete",
				destructive: true
			}))
		)
			return;
		setMessage("");
		const { error } = await tryCatch(
			deleteCriterion.mutateAsync({ id: criterion.id })
		);
		if (error) {
			setMessage(
				error instanceof Error ? error.message : "Criterion deletion failed."
			);
			return;
		}
		refresh(() => {
			resetForm();
			setMessage("Criterion deleted.");
		});
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
						disabled={!isSidepot}
						max={100}
						min={1}
						onChange={(event) =>
							setMaxScore(Number.parseInt(event.target.value, 10) || 1)
						}
						type="number"
						value={isSidepot ? maxScore : MAIN_CRITERION_MAX_SCORE}
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
						disabled={!name.trim() || isSaving}
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

			{rounds.length > 0 ? (
				<fieldset className="mt-4 flex flex-col gap-2">
					<legend className="mb-2 text-sm">
						Rounds{" "}
						<span className="text-muted-foreground">
							· Leave all unchecked to use this criterion in every round
						</span>
					</legend>
					<div className="flex flex-wrap gap-x-6 gap-y-2">
						{rounds.map((round) => (
							<div className="flex items-center gap-2" key={round.id}>
								<Checkbox
									checked={roundIds.includes(round.id)}
									id={`criterion-round-${round.id}`}
									onCheckedChange={(checked) =>
										setRoundIds((current) =>
											checked
												? [...current, round.id]
												: current.filter((id) => id !== round.id)
										)
									}
								/>
								<label htmlFor={`criterion-round-${round.id}`}>
									{round.name}
								</label>
							</div>
						))}
					</div>
				</fieldset>
			) : null}
			<p className="mt-4 text-muted-foreground text-sm">
				Main criteria are scored 1–{MAIN_CRITERION_MAX_SCORE}. Limit sidepots to
				the panel round so final-round judges only score the main rubric.
			</p>
			<div className="mt-6">
				<Table className="min-w-155">
					<TableHeader>
						<TableRow>
							<TableHead className="px-3 py-3">Name</TableHead>
							<TableHead className="px-3 py-3">Maximum</TableHead>
							<TableHead className="px-3 py-3">Type</TableHead>
							<TableHead className="px-3 py-3">Rounds</TableHead>
							<TableHead className="px-3 py-3 text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{criteria.map((criterion) => (
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
								<TableCell className="whitespace-normal px-3 py-4">
									{criterion.roundIds.length
										? criterion.roundIds
												.map((id) => roundNames.get(id) ?? "Deleted round")
												.join(", ")
										: "All rounds"}
								</TableCell>
								<TableCell className="px-3 py-4">
									<div className="flex justify-end gap-2">
										<Button
											onClick={() => {
												setEditingId(criterion.id);
												setName(criterion.name);
												setMaxScore(criterion.maxScore);
												setIsSidepot(criterion.isSidepot);
												setRoundIds(criterion.roundIds);
												setMessage("");
											}}
											size="sm"
											type="button"
											variant="outline"
										>
											Edit
										</Button>
										<Button
											disabled={deleteCriterion.isPending || isRefreshing}
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
				{criteria.length === 0 && (
					<Empty>
						<EmptyHeader>
							<EmptyTitle>No judging criteria yet</EmptyTitle>
							<EmptyDescription>
								Add the categories judges will score above.
							</EmptyDescription>
						</EmptyHeader>
					</Empty>
				)}
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
