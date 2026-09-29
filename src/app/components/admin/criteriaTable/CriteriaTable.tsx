"use client";

import { AddLine } from "@mingcute/react";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useRef, useState } from "react";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Spinner } from "@/app/components/ui/spinner";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";
import {
	type Criteria,
	type CriteriaUpdate,
	createColumnDefs,
	defaultColDef
} from "./columns";
import {
	useCreateCriteria,
	useDeleteCriteria,
	useUpdateCriteria
} from "./hooks";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function CriteriaTable({
	criteria: initialCriteria
}: {
	criteria: Criteria[];
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const createCriteriaMutation = useCreateCriteria();
	const updateCriteriaMutation = useUpdateCriteria();
	const deleteCriteriaMutation = useDeleteCriteria();
	const [showAddForm, setShowAddForm] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [newDisplayOrder, setNewDisplayOrder] = useState(0);
	const [newMaxScore, setNewMaxScore] = useState(10);
	const [newIsSidepot, setNewIsSidepot] = useState(false);
	const nameInputRef = useRef<HTMLInputElement>(null);

	const mutationError =
		createCriteriaMutation.error ??
		updateCriteriaMutation.error ??
		deleteCriteriaMutation.error;

	const resetMutationErrors = () => {
		createCriteriaMutation.reset();
		updateCriteriaMutation.reset();
		deleteCriteriaMutation.reset();
	};

	const update = (input: CriteriaUpdate, onError?: () => void) => {
		resetMutationErrors();
		updateCriteriaMutation.mutate(input, { onError });
	};

	const handleSubmit = () => {
		if (!newName.trim() || createCriteriaMutation.isPending) return;

		resetMutationErrors();
		createCriteriaMutation.mutate(
			{
				name: newName,
				description: newDescription.trim(),
				displayOrder: newDisplayOrder,
				maxScore: newMaxScore,
				isSidepot: newIsSidepot
			},
			{
				onSuccess: () => {
					setNewName("");
					setNewDescription("");
					setNewDisplayOrder(0);
					setNewMaxScore(10);
					setNewIsSidepot(false);
					setShowAddForm(false);
				}
			}
		);
	};

	const handleDelete = async (criterion: Criteria) => {
		if (deleteCriteriaMutation.isPending) return;
		const confirmed = await confirm({
			title: `Delete "${criterion.name}"?`,
			description: "This criterion and its associated scores will be removed.",
			confirmLabel: "Delete",
			destructive: true
		});
		if (!confirmed) return;

		resetMutationErrors();
		deleteCriteriaMutation.mutate({ id: criterion.id });
	};

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);
	const columnDefs = createColumnDefs({
		deletePending: deleteCriteriaMutation.isPending,
		onUpdate: update,
		onDelete: handleDelete
	});

	return (
		<section className="flex flex-col gap-4">
			<div className="flex items-center justify-between">
				<Button
					onClick={() => {
						setShowAddForm(true);
						resetMutationErrors();
						setTimeout(() => nameInputRef.current?.focus(), 0);
					}}
					size="sm"
					type="button"
				>
					<AddLine data-icon="inline-start" />
					Add criteria
				</Button>
			</div>

			{showAddForm && (
				<form
					className="rounded-lg border border-border bg-card p-4"
					onSubmit={(event) => {
						event.preventDefault();
						void handleSubmit();
					}}
				>
					<FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_minmax(16rem,2fr)_8rem_7rem_auto_auto] xl:items-end">
						<Field>
							<FieldLabel htmlFor="criteria-name">Name</FieldLabel>
							<Input
								id="criteria-name"
								onChange={(event) => setNewName(event.target.value)}
								placeholder="Technical execution"
								ref={nameInputRef}
								required
								value={newName}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="criteria-description">
								Description
							</FieldLabel>
							<Input
								id="criteria-description"
								onChange={(event) => setNewDescription(event.target.value)}
								placeholder="Optional judging guidance"
								value={newDescription}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="criteria-display-order">Order</FieldLabel>
							<Input
								id="criteria-display-order"
								onChange={(event) =>
									setNewDisplayOrder(Number(event.target.value))
								}
								type="number"
								value={newDisplayOrder}
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="criteria-max-score">Max score</FieldLabel>
							<Input
								id="criteria-max-score"
								max={100}
								min={1}
								onChange={(event) => setNewMaxScore(Number(event.target.value))}
								type="number"
								value={newMaxScore}
							/>
						</Field>
						<Field className="h-10 w-auto self-end" orientation="horizontal">
							<Checkbox
								checked={newIsSidepot}
								id="criteria-sidepot"
								onCheckedChange={(checked) => setNewIsSidepot(checked === true)}
							/>
							<FieldLabel htmlFor="criteria-sidepot">Sidepot</FieldLabel>
						</Field>
						<Field className="w-auto self-end" orientation="horizontal">
							<Button
								disabled={!newName.trim() || createCriteriaMutation.isPending}
								type="submit"
							>
								{createCriteriaMutation.isPending && (
									<Spinner data-icon="inline-start" />
								)}
								Add
							</Button>
							<Button
								onClick={() => setShowAddForm(false)}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
						</Field>
					</FieldGroup>
				</form>
			)}

			{mutationError && (
				<p aria-live="polite" className="text-destructive text-sm">
					{mutationError.message}
				</p>
			)}

			<div className="h-100 w-full">
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					getRowId={({ data }) => data.id}
					onCellValueChanged={(e) => {
						if (!e.data || !e.colDef.field) return;
						if (e.newValue === e.oldValue) return;
						const field = e.colDef.field;
						if (
							field in
							new Set(["name", "description", "displayOrder", "maxScore"])
						) {
							update({ id: e.data.id, [field]: e.newValue }, () =>
								e.node.setDataValue(field, e.oldValue)
							);
						}
					}}
					rowData={initialCriteria}
					theme={theme}
				/>
			</div>
			<ConfirmAlertDialog {...dialogProps} />
		</section>
	);
}
