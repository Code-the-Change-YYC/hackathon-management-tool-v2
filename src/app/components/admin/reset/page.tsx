"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	ICellRendererParams
} from "ag-grid-community";

import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";

import { useCallback, useEffect, useMemo, useState } from "react";

import { toast } from "react-toastify";

import { api, type RouterOutputs } from "@/trpc/react";

ModuleRegistry.registerModules([AllCommunityModule]);

type Criterion = RouterOutputs["criteria"]["getAll"][number];

const theme = themeQuartz.withParams({
	backgroundColor: "#ffffff",
	headerBackgroundColor: "#f5f5f5",
	headerTextColor: "#111827",
	rowBorder: true,
	fontFamily: "inherit"
});

const DeleteRenderer = (
	props: ICellRendererParams<Criterion> & {
		onDelete: (id: string) => Promise<void>;
	}
) => {
	const id = props.data?.id;

	if (!id) return null;

	return (
		<button
			className="rounded-lg bg-dark-pink px-3 py-1 font-semibold text-sm text-white hover:bg-strawberry-red"
			onClick={async () => {
				try {
					await props.onDelete(id);
					toast.success("Deleted");
				} catch (error) {
					console.error(error);
					toast.error("Failed to delete");
				}
			}}
			type="button"
		>
			Delete
		</button>
	);
};

export default function ResetPage() {
	const utils = api.useUtils();

	const { data: criteriaData = [], isLoading } = api.criteria.getAll.useQuery();

	const { data: settings } = api.hackathonSettings.get.useQuery();

	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	// TODO: implement ability to reset users, teams, rooms, and scores
	// const [resetUsers, setResetUsers] = useState(false);
	// const [resetTeams, setResetTeams] = useState(false);
	// const [resetRooms, setResetRooms] = useState(false);
	// const [resetScores, setResetScores] = useState(false);

	const [confirmation, setConfirmation] = useState("");

	useEffect(() => {
		if (!settings) return;

		setStartDate(
			settings.startDate
				? (new Date(settings.startDate).toISOString().split("T")[0] ?? "")
				: ""
		);

		setEndDate(
			settings.endDate
				? (new Date(settings.endDate).toISOString().split("T")[0] ?? "")
				: ""
		);
	}, [settings]);

	const createCriteriaMutation = api.criteria.create.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
		}
	});

	const updateCriteriaMutation = api.criteria.update.useMutation();

	const deleteCriteriaMutation = api.criteria.delete.useMutation({
		onSuccess: async () => {
			await utils.criteria.getAll.invalidate();
		}
	});

	const updateSettingsMutation = api.hackathonSettings.update.useMutation();

	const resetMutation = api.hackathonSettings.reset.useMutation();

	const mainCriteria = criteriaData.filter((c) => !c.isSidepot);

	const sidepots = criteriaData.filter((c) => c.isSidepot);

	const onCellValueChanged = async (e: CellValueChangedEvent<Criterion>) => {
		if (!e.data?.id) return;

		try {
			await updateCriteriaMutation.mutateAsync({
				id: e.data.id,
				name: e.data.name,
				maxScore: Number(e.data.maxScore),
				isSidepot: e.data.isSidepot
			});

			toast.success("Updated");
		} catch (error) {
			console.error(error);
			toast.error("Failed to update");
		}
	};

	const handleDelete = useCallback(
		async (id: string) => {
			await deleteCriteriaMutation.mutateAsync({
				id
			});
		},
		[deleteCriteriaMutation]
	);

	const columnDefs = useMemo<ColDef<Criterion>[]>(
		() => [
			{
				field: "name",
				headerName: "Name",
				editable: true,
				flex: 2
			},
			{
				field: "maxScore",
				headerName: "Max Score",
				editable: true,
				flex: 1
			},
			{
				headerName: "",
				width: 140,
				cellRenderer: DeleteRenderer,
				cellRendererParams: {
					onDelete: handleDelete
				}
			}
		],
		[handleDelete]
	);

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center">
				Loading...
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col gap-6 bg-neutral-100 p-4 sm:p-6 lg:p-8">
			<h1 className="font-bold text-2xl sm:text-3xl lg:text-4xl">
				Hackathon Administration
			</h1>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="font-bold text-2xl">Scoring Components</h2>

						<button
							className="rounded-xl bg-awesome-purple px-4 py-2 font-semibold text-white hover:bg-awesomer-purple"
							onClick={async () => {
								try {
									await createCriteriaMutation.mutateAsync({
										name: "New Criteria",
										maxScore: 10,
										isSidepot: false
									});

									toast.success("Created");
								} catch (error) {
									console.error(error);
									toast.error("Failed to create");
								}
							}}
							type="button"
						>
							Add Component
						</button>
					</div>

					<div className="h-80 sm:h-96 lg:h-125">
						<AgGridReact
							columnDefs={columnDefs}
							defaultColDef={{
								resizable: false,
								sortable: false
							}}
							onCellValueChanged={onCellValueChanged}
							rowData={mainCriteria}
							theme={theme}
						/>
					</div>
				</div>

				<div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6">
					<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="font-bold text-2xl">Scoring Sidepots</h2>

						<button
							className="rounded-xl bg-awesome-purple px-4 py-2 font-semibold text-white hover:bg-awesomer-purple"
							onClick={async () => {
								try {
									await createCriteriaMutation.mutateAsync({
										name: "New Sidepot",
										maxScore: 10,
										isSidepot: true
									});

									toast.success("Created");
								} catch (error) {
									console.error(error);
									toast.error("Failed to create");
								}
							}}
							type="button"
						>
							Add Sidepot
						</button>
					</div>

					<div className="h-80 sm:h-96 lg:h-125">
						<AgGridReact
							columnDefs={columnDefs}
							defaultColDef={{
								resizable: false,
								sortable: false
							}}
							onCellValueChanged={onCellValueChanged}
							rowData={sidepots}
							theme={theme}
						/>
					</div>
				</div>
			</div>

			<div className="rounded-2xl bg-white p-4 shadow-lg sm:p-6 lg:p-8">
				<h2 className="mb-6 font-bold text-2xl">Hackathon Period</h2>

				<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
					<div className="flex flex-col gap-2">
						<label className="font-semibold" htmlFor="startDate">
							Start Date
						</label>

						<input
							className="rounded-xl border border-ehhh-grey p-3"
							id="startDate"
							onChange={(e) => setStartDate(e.target.value)}
							type="date"
							value={startDate}
						/>
					</div>

					<div className="flex flex-col gap-2">
						<label className="font-semibold" htmlFor="endDate">
							End Date
						</label>

						<input
							className="rounded-xl border border-ehhh-grey p-3"
							id="endDate"
							onChange={(e) => setEndDate(e.target.value)}
							type="date"
							value={endDate}
						/>
					</div>
				</div>

				<button
					className="mt-6 w-full rounded-xl bg-dark-green px-6 py-3 font-semibold text-white hover:bg-emerald-green sm:w-auto"
					onClick={async () => {
						try {
							await updateSettingsMutation.mutateAsync({
								startDate: startDate ? new Date(startDate) : undefined,

								endDate: endDate ? new Date(endDate) : undefined
							});

							toast.success("Settings saved");
						} catch (error) {
							console.error(error);
							toast.error("Failed to save settings");
						}
					}}
					type="button"
				>
					Save Settings
				</button>
			</div>

			<div className="rounded-2xl border-2 border-strawberry-red bg-pastel-pink/50 p-4 shadow-lg sm:p-6 lg:p-8">
				<h2 className="mb-4 font-bold text-2xl text-strawberry-red">
					Confirm Changes
				</h2>

				<input
					className="mb-4 w-full rounded-xl border border-dark-pink p-3"
					onChange={(e) => setConfirmation(e.target.value)}
					placeholder='Type "i love code the change"'
					value={confirmation}
				/>

				<button
					className="rounded-xl bg-dark-pink px-6 py-3 font-semibold text-white hover:bg-strawberry-red disabled:cursor-not-allowed disabled:opacity-50"
					disabled={confirmation !== "i love code the change"}
					onClick={async () => {
						try {
							await resetMutation.mutateAsync({
								confirmation
							});

							toast.success("Hackathon reset successfully");

							setConfirmation("");

							await utils.criteria.getAll.invalidate();

							await utils.hackathonSettings.get.invalidate();
						} catch (error) {
							console.error(error);

							toast.error("Failed to reset");
						}
					}}
					type="button"
				>
					Reset Everything
				</button>
			</div>
		</div>
	);
}
