"use client";

import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";

ModuleRegistry.registerModules([AllCommunityModule]);

// This is the shape we use in the browser while editing rooms.
type RoomDraft = {
	id: string;
	name: string;
	roomLink: string;
	staffIds: string[];
	teamIds: string[];
};

function newRoomId() {
	// Create a unique id for a brand new room row.
	return crypto.randomUUID();
}

// Re-use backend return types so frontend and backend stay in sync.
type Layout = RouterOutputs["judgingRooms"]["getLayoutByRound"];

export default function JudgingRoomsManager() {
	// Helper object used to refresh cached tRPC data after mutations.
	const utils = api.useUtils();

	// Read all data we need to build room management UI.
	const { data: rounds } = api.judgingRounds.getAll.useQuery();
	const { data: settings } = api.hackathonSettings.get.useQuery();

	// Prefer active round; if not available, fall back to first round.
	const defaultRoundId = settings?.currentRoundId ?? rounds?.[0]?.id ?? "";
	// This is the round currently being edited in the UI.
	const [roundId, setRoundId] = useState(defaultRoundId);

	// Fetch saved room layout for the selected round.
	const { data: layout } = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId },
		{ enabled: Boolean(roundId) }
	);

	// Save current room layout into room/staff/assignment tables.
	const saveLayout = api.judgingRooms.saveLayoutByRound.useMutation({
		onSuccess: async () => {
			await utils.judgingRooms.getLayoutByRound.invalidate({ roundId });
		}
	});

	// Placeholder endpoint for future "auto assign" algorithm.
	const autoAssign = api.judgingRooms.autoAssignStub.useMutation();
	const [isApplying, setIsApplying] = useState(false);
	const [applyMessage, setApplyMessage] = useState("");

	// draft = unsaved edits in the current browser session.
	// null means "show exactly what is persisted on backend".
	const [draft, setDraft] = useState<RoomDraft[] | null>(null);
	useEffect(() => {
		// If data arrives after first render, set round once we know it.
		if (!roundId && defaultRoundId) setRoundId(defaultRoundId);
	}, [defaultRoundId, roundId]);

	const persistedRooms: RoomDraft[] = useMemo(() => {
		// Normalize backend layout to the exact local draft shape.
		const roomsFromLayout = (layout?.rooms ?? []) as Layout["rooms"];
		return roomsFromLayout.map((r) => ({
			id: r.id,
			name: r.name,
			roomLink: r.roomLink ?? "",
			staffIds: r.staffIds ?? [],
			teamIds: r.teamIds ?? []
		}));
	}, [layout]);

	// Use local draft if present, otherwise show saved rooms.
	const rooms = draft ?? persistedRooms;

	const roomGridRef = useRef<AgGridReact<RoomDraft>>(null);
	const readRoomsFromGrid = (): RoomDraft[] => {
		const api = roomGridRef.current?.api;
		if (!api) return rooms;
		const next: RoomDraft[] = [];
		api.forEachNode((node) => {
			if (node.data) next.push(node.data);
		});
		return next;
	};

	const handleApply = async () => {
		if (!roundId) return;
		setApplyMessage("");
		setIsApplying(true);
		try {
			const latestRooms = readRoomsFromGrid();
			setDraft(latestRooms);
			await saveLayout.mutateAsync({ roundId, layout: { rooms: latestRooms } });
			await utils.judgingAssignments.getByRound.invalidate({ roundId });
			setDraft(null);
			setApplyMessage("Applied: layout was saved to database.");
		} catch (e) {
			const message = e instanceof Error ? e.message : "Unknown error";
			setApplyMessage(`Apply failed: ${message}`);
		} finally {
			setIsApplying(false);
		}
	};

	// Build one simple status line so admins always know what happened.
	const statusMessage = useMemo(() => {
		if (saveLayout.isPending) return "Saving room layout...";
		if (saveLayout.isSuccess) return "Room layout saved.";
		if (saveLayout.error) return `Save failed: ${saveLayout.error.message}`;

		if (isApplying) return "Applying layout to assignments...";
		if (applyMessage) return applyMessage;

		if (autoAssign.isPending) return "Auto-assign is running...";
		if (autoAssign.isSuccess)
			return autoAssign.data?.message ?? "Auto-assign is not ready yet.";
		if (autoAssign.error)
			return `Auto-assign failed: ${autoAssign.error.message}`;

		return "";
	}, [
		autoAssign.data,
		autoAssign.error,
		autoAssign.isPending,
		autoAssign.isSuccess,
		applyMessage,
		isApplying,
		saveLayout.error,
		saveLayout.isPending,
		saveLayout.isSuccess
	]);

	// Columns for top "rooms" grid.
	const roomsColumnDefs = useMemo<ColDef<RoomDraft>[]>(
		() => [
			{ headerName: "Room", field: "name", editable: true, flex: 1.2 },
			{ headerName: "Link", field: "roomLink", editable: true, flex: 1.6 },
			{
				headerName: "Judges",
				width: 110,
				valueGetter: (p) => p.data?.staffIds.length ?? 0
			},
			{
				headerName: "Teams",
				width: 110,
				valueGetter: (p) => p.data?.teamIds.length ?? 0
			},
			{
				headerName: "",
				width: 120,
				sortable: false,
				filter: false,
				cellRenderer: (p: { data?: RoomDraft }) => (
					<button
						onClick={() => {
							// Remove room from local draft immediately.
							if (!p.data) return;
							const id = p.data.id;
							setDraft(rooms.filter((r) => r.id !== id));
						}}
						type="button"
					>
						Delete
					</button>
				)
			}
		],
		[rooms]
	);

	// Default behavior shared by room grid columns.
	const roomsDefaultColDef = useMemo<ColDef<RoomDraft>>(
		() => ({ sortable: true, filter: true, resizable: true }),
		[]
	);

	// Same visual theme used by other admin tables.
	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	return (
		// TODO: remove height and width inline style
		<div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
			<div
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 8,
					alignItems: "center"
				}}
			>
				<select
					onChange={(e) => {
						setRoundId(e.target.value);
						setDraft(null);
					}}
					value={roundId}
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

				<button
					disabled={!roundId}
					onClick={() => {
						const next = [
							...rooms,
							{
								id: newRoomId(),
								name: `Room ${rooms.length + 1}`,
								roomLink: "",
								staffIds: [],
								teamIds: []
							}
						];
						setDraft(next);
						queueMicrotask(() =>
							roomGridRef.current?.api?.ensureIndexVisible(next.length - 1)
						);
					}}
					type="button"
				>
					+ Add Room
				</button>

				<button
					disabled={!roundId || autoAssign.isPending}
					onClick={() => autoAssign.mutate({ roundId })}
					type="button"
				>
					Auto-assign
				</button>

				<button
					disabled={!roundId || isApplying || saveLayout.isPending}
					onClick={() => void handleApply()}
					type="button"
				>
					Apply layout → create assignments
				</button>
			</div>

			<div style={{ fontSize: 12, opacity: 0.85, minHeight: 18 }}>
				{statusMessage}
			</div>

			<div style={{ height: 320, width: "100%" }}>
				<AgGridReact
					columnDefs={roomsColumnDefs}
					defaultColDef={roomsDefaultColDef}
					getRowId={({ data }) => data.id}
					onCellValueChanged={(e: CellValueChangedEvent<RoomDraft>) => {
						if (!e.data) return;
						// Keep local state synced with current grid edits (roomLink, room name, etc).
						setDraft(readRoomsFromGrid());
					}}
					ref={roomGridRef}
					rowData={rooms}
					theme={theme}
				/>
			</div>
		</div>
	);
}
