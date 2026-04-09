"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";

ModuleRegistry.registerModules([AllCommunityModule]);

type AssignmentRow = RouterOutputs["judgingAssignments"]["getByRound"][number];
export default function JudgingAssignmentsTable() {
	const utils = api.useUtils();

	const { data: settings } = api.hackathonSettings.get.useQuery();
	const { data: rounds } = api.judgingRounds.getAll.useQuery();
	const { data: teams } = api.teams.getAll.useQuery();

	const defaultRoundId = settings?.currentRoundId ?? rounds?.[0]?.id ?? "";
	const [selectedRoundId, setSelectedRoundId] =
		useState<string>(defaultRoundId);

	useEffect(() => {
		if (!selectedRoundId && defaultRoundId) {
			setSelectedRoundId(defaultRoundId);
		}
	}, [defaultRoundId, selectedRoundId]);

	const { data: roomLayout } = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId: selectedRoundId },
		{ enabled: Boolean(selectedRoundId) }
	);

	const { data: assignments, isLoading } =
		api.judgingAssignments.getByRound.useQuery(
			{ roundId: selectedRoundId },
			{ enabled: Boolean(selectedRoundId) }
		);

	const createAssignment = api.judgingAssignments.create.useMutation({
		onSuccess: async () => {
			await utils.judgingAssignments.getByRound.invalidate({
				roundId: selectedRoundId
			});
			setSelectedRoomId("");
			setSelectedTeamId("");
			setTimeSlot("");
		}
	});

	const deleteAssignment = api.judgingAssignments.delete.useMutation({
		onSuccess: async () => {
			await utils.judgingAssignments.getByRound.invalidate({
				roundId: selectedRoundId
			});
		}
	});

	const [selectedRoomId, setSelectedRoomId] = useState("");
	const [selectedTeamId, setSelectedTeamId] = useState("");
	const [timeSlot, setTimeSlot] = useState("");

	const roomOptions = useMemo<Array<{ id: string; name?: string }>>(
		() => (roomLayout?.rooms ?? []) as Array<{ id: string; name?: string }>,
		[roomLayout]
	);

	const teamOptions = useMemo(() => {
		return (teams ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
	}, [teams]);

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<AssignmentRow>[]>(
		() => [
			{
				headerName: "Time Slot",
				field: "timeSlot",
				width: 180,
				valueFormatter: (p) => {
					const v = p.value as Date | null | undefined;
					return v ? v.toLocaleString() : "";
				}
			},
			{
				headerName: "Room",
				valueGetter: (p) => p.data?.room?.id.slice(0, 8) ?? "",
				width: 120
			},
			{
				headerName: "Room Link",
				valueGetter: (p) => p.data?.room?.roomLink ?? "",
				flex: 1.4
			},
			{
				headerName: "Team",
				valueGetter: (p) => p.data?.team?.name ?? "",
				flex: 1.4
			},
			{
				headerName: "Scores",
				width: 110,
				valueGetter: (p) => p.data?.scores?.length ?? 0
			},
			{
				headerName: "",
				width: 110,
				sortable: false,
				filter: false,
				cellRenderer: (params: ICellRendererParams<AssignmentRow>) => (
					<button
						disabled={deleteAssignment.isPending}
						onClick={() => {
							if (!params.data) return;
							deleteAssignment.mutate({ id: params.data.id });
						}}
						type="button"
					>
						Delete
					</button>
				)
			}
		],
		[deleteAssignment]
	);

	const defaultColDef = useMemo<ColDef<AssignmentRow>>(
		() => ({ flex: 1, sortable: true, filter: true, resizable: true }),
		[]
	);

	return (
		// TODO: remove height and width inline style
		<div>
			<div
				style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}
			>
				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Round</span>
					<select
						onChange={(e) => setSelectedRoundId(e.target.value)}
						value={selectedRoundId}
					>
						<option disabled value="">
							Select round…
						</option>
						{(rounds ?? []).map((r) => (
							<option key={r.id} value={r.id}>
								{r.name}
							</option>
						))}
					</select>
				</label>

				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Room</span>
					<select
						onChange={(e) => setSelectedRoomId(e.target.value)}
						value={selectedRoomId}
					>
						<option value="">Select room…</option>
						{roomOptions.map((r) => (
							<option key={r.id} value={r.id}>
								{r.name ?? `Room ${r.id.slice(0, 8)}`}
							</option>
						))}
					</select>
				</label>

				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Team</span>
					<select
						onChange={(e) => setSelectedTeamId(e.target.value)}
						value={selectedTeamId}
					>
						<option value="">Select team…</option>
						{teamOptions.map((t) => (
							<option key={t.id} value={t.id}>
								{t.name}
							</option>
						))}
					</select>
				</label>

				<label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>Time Slot</span>
					<input
						onChange={(e) => setTimeSlot(e.target.value)}
						type="datetime-local"
						value={timeSlot}
					/>
				</label>

				<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>&nbsp;</span>
					<button
						disabled={
							!selectedRoundId ||
							!selectedRoomId ||
							!selectedTeamId ||
							createAssignment.isPending
						}
						onClick={() => {
							const parsedTimeSlot = timeSlot ? new Date(timeSlot) : undefined;
							createAssignment.mutate({
								teamId: selectedTeamId,
								roomId: selectedRoomId,
								timeSlot: parsedTimeSlot
							});
						}}
						type="button"
					>
						{createAssignment.isPending ? "Adding…" : "Add Assignment"}
					</button>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
					<span>&nbsp;</span>
					<button
						disabled={
							!settings?.currentRoundId ||
							settings.currentRoundId === selectedRoundId
						}
						onClick={() => {
							if (!settings?.currentRoundId) return;
							setSelectedRoundId(settings.currentRoundId);
						}}
						type="button"
					>
						Jump to Active Round
					</button>
				</div>
			</div>

			<div style={{ height: 600, width: "100%" }}>
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={defaultColDef}
					getRowId={({ data }) => data.id}
					loading={isLoading}
					rowData={assignments ?? []}
					theme={theme}
				/>
			</div>

			<div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
				{selectedRoundId && (
					<div>
						Selected round:{" "}
						{rounds?.find((r) => r.id === selectedRoundId)?.name ??
							selectedRoundId}
					</div>
				)}
				{settings?.currentRoundId && (
					<div>
						Active round:{" "}
						{rounds?.find((r) => r.id === settings.currentRoundId)?.name ??
							settings.currentRoundId}
					</div>
				)}
			</div>
		</div>
	);
}
