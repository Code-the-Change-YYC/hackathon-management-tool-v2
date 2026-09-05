"use client";

import { useState } from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
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
import { api, type RouterOutputs } from "@/trpc/react";

type Criterion = RouterOutputs["criteria"]["getAll"][number];

import { ManagementSection } from "./judgingShared";

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
