"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useRef, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";

ModuleRegistry.registerModules([AllCommunityModule]);

type Criteria = RouterOutputs["criteria"]["getAll"][number];

export default function CriteriaTable() {
	const { data, isLoading } = api.criteria.getAll.useQuery();
	const utils = api.useUtils();

	const [showAddForm, setShowAddForm] = useState(false);
	const [deleteTarget, setDeleteTarget] = useState<Criteria | null>(null);
	const [hasScores, setHasScores] = useState(false);
	const [newName, setNewName] = useState("");
	const [newDescription, setNewDescription] = useState("");
	const [newDisplayOrder, setNewDisplayOrder] = useState(0);
	const [newMaxScore, setNewMaxScore] = useState(10);
	const [newIsSidepot, setNewIsSidepot] = useState(false);
	const [addError, setAddError] = useState("");
	const nameInputRef = useRef<HTMLInputElement>(null);

	const update = api.criteria.update.useMutation({
		onSuccess: () => utils.criteria.getAll.invalidate()
	});

	const create = api.criteria.create.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
			setNewName("");
			setNewDescription("");
			setNewDisplayOrder(0);
			setNewMaxScore(10);
			setNewIsSidepot(false);
			setShowAddForm(false);
		},
		onError: (e) => setAddError(e.message)
	});

	const deleteMutation = api.criteria.delete.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
			setDeleteTarget(null);
			setHasScores(false);
		},
		onError: (e) => {
			if (e.data?.code === "PRECONDITION_FAILED") setHasScores(true);
		}
	});

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<Criteria>[]>(
		() => [
			{
				headerName: "Name",
				field: "name",
				editable: true,
				flex: 2
			},
			{
				headerName: "Description",
				field: "description",
				editable: true,
				flex: 4
			},
			{
				headerName: "Display Order",
				field: "displayOrder",
				editable: true,
				width: 130
			},
			{
				headerName: "Max Score",
				field: "maxScore",
				editable: true,
				width: 130
			},
			{
				headerName: "Sidepot",
				field: "isSidepot",
				width: 100,
				cellRenderer: (params: ICellRendererParams<Criteria>) => (
					<input
						checked={params.value as boolean}
						onChange={(e) => {
							if (!params.data) return;
							update.mutate({
								id: params.data.id,
								isSidepot: e.target.checked
							});
						}}
						type="checkbox"
					/>
				)
			},
			{
				headerName: "",
				width: 90,
				sortable: false,
				filter: false,
				cellRenderer: (params: ICellRendererParams<Criteria>) => (
					<button
						onClick={() => {
							if (!params.data) return;
							setHasScores(false);
							setDeleteTarget(params.data);
						}}
						type="button"
					>
						Delete
					</button>
				)
			}
		],
		[update]
	);

	const defaultColDef = useMemo<ColDef<Criteria>>(
		() => ({ flex: 1, sortable: true, filter: true, resizable: true }),
		[]
	);

	const handleSubmit = () => {
		if (!newName.trim()) return;
		create.mutate({
			name: newName,
			description: newDescription.trim(),
			displayOrder: newDisplayOrder,
			maxScore: newMaxScore,
			isSidepot: newIsSidepot
		});
	};

	return (
		// TODO: remove all the styling here and replace with tailwind later
		<div>
			{/* Toolbar */}
			<div style={{ marginBottom: 8 }}>
				<button
					onClick={() => {
						setShowAddForm(true);
						setAddError("");
						setTimeout(() => nameInputRef.current?.focus(), 0);
					}}
					type="button"
				>
					+ Add Criteria
				</button>
			</div>

			{showAddForm && (
				<div
					style={{
						marginBottom: 8,
						display: "flex",
						alignItems: "center",
						gap: 8,
						flexWrap: "wrap"
					}}
				>
					<input
						onChange={(e) => setNewName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleSubmit();
							if (e.key === "Escape") setShowAddForm(false);
						}}
						placeholder="Name"
						ref={nameInputRef}
						value={newName}
					/>
					<input
						onChange={(e) => setNewDescription(e.target.value)}
						placeholder="Description"
						value={newDescription}
					/>
					<input
						aria-label="Display order"
						onChange={(e) => setNewDisplayOrder(Number(e.target.value))}
						style={{ width: 100 }}
						type="number"
						value={newDisplayOrder}
					/>
					<input
						max={100}
						min={1}
						onChange={(e) => setNewMaxScore(Number(e.target.value))}
						style={{ width: 70 }}
						type="number"
						value={newMaxScore}
					/>
					<label style={{ display: "flex", alignItems: "center", gap: 4 }}>
						<input
							checked={newIsSidepot}
							onChange={(e) => setNewIsSidepot(e.target.checked)}
							type="checkbox"
						/>
						Sidepot
					</label>
					<button
						disabled={!newName.trim() || create.isPending}
						onClick={handleSubmit}
						type="button"
					>
						{create.isPending ? "Adding…" : "Add"}
					</button>
					<button onClick={() => setShowAddForm(false)} type="button">
						Cancel
					</button>
					{addError && (
						<span style={{ color: "red", fontSize: 12 }}>{addError}</span>
					)}
				</div>
			)}

			<div style={{ height: 400, width: "100%" }}>
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					getRowId={({ data }) => data.id}
					loading={isLoading}
					onCellValueChanged={(e) => {
						if (!e.data || !e.colDef.field) return;
						if (e.newValue === e.oldValue) return;
						if (
							e.colDef.field === "name" ||
							e.colDef.field === "description" ||
							e.colDef.field === "displayOrder" ||
							e.colDef.field === "maxScore"
						) {
							update.mutate({ id: e.data.id, [e.colDef.field]: e.newValue });
						}
					}}
					rowData={data ?? []}
					theme={theme}
				/>
			</div>

			{deleteTarget && (
				<div style={{ marginTop: 8 }}>
					{hasScores ? (
						<p>⚠️ "{deleteTarget.name}" has existing scores. Delete anyway?</p>
					) : (
						<p>Delete "{deleteTarget.name}"?</p>
					)}
					<button
						disabled={deleteMutation.isPending}
						onClick={() => deleteMutation.mutate({ id: deleteTarget.id })}
						type="button"
					>
						{deleteMutation.isPending ? "Deleting…" : "Confirm"}
					</button>{" "}
					<button
						onClick={() => {
							setDeleteTarget(null);
							setHasScores(false);
						}}
						type="button"
					>
						Cancel
					</button>
				</div>
			)}
		</div>
	);
}
