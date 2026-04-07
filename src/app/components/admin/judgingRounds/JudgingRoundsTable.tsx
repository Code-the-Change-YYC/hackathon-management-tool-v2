"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";

ModuleRegistry.registerModules([AllCommunityModule]);

type RoundRow = RouterOutputs["judgingRounds"]["getAll"][number];

export default function JudgingRoundsTable() {
	const utils = api.useUtils();
	const { data: rounds, isLoading } = api.judgingRounds.getAll.useQuery();

	const [name, setName] = useState("");
	const [startTime, setStartTime] = useState("");
	const [endTime, setEndTime] = useState("");

	const createRound = api.judgingRounds.create.useMutation({
		onSuccess: async () => {
			await utils.judgingRounds.getAll.invalidate();
			setName("");
			setStartTime("");
			setEndTime("");
		}
	});

	const deleteRound = api.judgingRounds.delete.useMutation({
		onSuccess: async () => {
			await utils.judgingRounds.getAll.invalidate();
		}
	});

	const status = useMemo(() => {
		if (createRound.isPending) return "Creating round...";
		if (deleteRound.isPending) return "Deleting round...";
		if (createRound.error) return `Create failed: ${createRound.error.message}`;
		if (deleteRound.error) return `Delete failed: ${deleteRound.error.message}`;
		return "";
	}, [
		createRound.error,
		createRound.isPending,
		deleteRound.error,
		deleteRound.isPending
	]);

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<RoundRow>[]>(
		() => [
			{ headerName: "Round", field: "name", flex: 1.2 },
			{
				headerName: "Start",
				field: "startTime",
				flex: 1.4,
				valueFormatter: (p) =>
					p.value ? new Date(p.value as Date).toLocaleString() : ""
			},
			{
				headerName: "End",
				field: "endTime",
				flex: 1.4,
				valueFormatter: (p) =>
					p.value ? new Date(p.value as Date).toLocaleString() : ""
			},
			{
				headerName: "",
				width: 120,
				sortable: false,
				filter: false,
				cellRenderer: (params: ICellRendererParams<RoundRow>) => (
					<button
						disabled={deleteRound.isPending}
						onClick={() => {
							if (!params.data) return;
							deleteRound.mutate({ id: params.data.id });
						}}
						type="button"
					>
						Delete
					</button>
				)
			}
		],
		[deleteRound]
	);

	const defaultColDef = useMemo<ColDef<RoundRow>>(
		() => ({
			flex: 1,
			sortable: true,
			filter: true,
			resizable: true
		}),
		[]
	);

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
			<div
				style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "end" }}
			>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Round Name</span>
					<input
						onChange={(e) => setName(e.target.value)}
						placeholder="Round 1"
						type="text"
						value={name}
					/>
				</label>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Start</span>
					<input
						onChange={(e) => setStartTime(e.target.value)}
						type="datetime-local"
						value={startTime}
					/>
				</label>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>End</span>
					<input
						onChange={(e) => setEndTime(e.target.value)}
						type="datetime-local"
						value={endTime}
					/>
				</label>
				<button
					disabled={
						!name.trim() || !startTime || !endTime || createRound.isPending
					}
					onClick={() =>
						createRound.mutate({
							name: name.trim(),
							startTime: new Date(startTime),
							endTime: new Date(endTime)
						})
					}
					type="button"
				>
					Add Round
				</button>
			</div>

			<div style={{ fontSize: 12, opacity: 0.85, minHeight: 18 }}>{status}</div>

			<div style={{ height: 450, width: "100%" }}>
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					getRowId={({ data }) => data.id}
					loading={isLoading}
					rowData={rounds ?? []}
					theme={theme}
				/>
			</div>
		</div>
	);
}
