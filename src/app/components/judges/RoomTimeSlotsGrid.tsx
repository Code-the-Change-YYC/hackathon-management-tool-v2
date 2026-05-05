"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

const HOURS = ["1 PM", "2 PM", "3 PM", "4 PM", "5 PM"] as const;
const ROOMS = ["Room 1", "Room 2", "Room 3", "Room 4", "Room 5"] as const;

/** row index 0-4, col index 0-4 — content per cell or null */
const SLOT_CONTENT: (string | null)[][] = [
	["Team A", null, "Team G", null, "Team K"],
	[null, "Team D", null, null, "Team L"],
	["Team B", "Team E", "Team H", "Team I", null],
	["Team C", null, null, "Team J", "Team M"],
	[null, "Team F", null, null, null]
];

type GridRow = {
	time: string;
} & Record<(typeof ROOMS)[number], string | null>;

function TeamPillRenderer({
	value
}: ICellRendererParams<GridRow, string | null | undefined>) {
	if (!value) return null;
	return (
		<div className="rounded-lg bg-pastel-pink px-3 py-2 text-center font-semibold text-dark-pink text-sm shadow-sm">
			{value}
		</div>
	);
}

const ROOM_GRID_THEME_PARAMS = {
	fontFamily: "var(--font-omnes), sans-serif",
	headerBackgroundColor: "var(--color-medium-pink)",
	headerTextColor: "#ffffff",
	headerFontWeight: 700,
	headerFontSize: "14px",
	cellTextColor: "var(--color-dark-grey)",
	rowHeight: 72,
	borderRadius: "12px",
	borderColor: "var(--color-medium-grey)",
	accentColor: "var(--color-dark-pink)",
	headerColumnBorder: true,
	columnBorder: true,
	wrapperBorder: true,
	oddRowBackgroundColor: "var(--color-light-grey)",
	evenRowBackgroundColor: "#ffffff"
} as const;

export default function RoomTimeSlotsGrid() {
	const [selectedRoom, setSelectedRoom] = useState<
		"all" | (typeof ROOMS)[number]
	>("all");

	const theme = useMemo(
		() => themeQuartz.withParams(ROOM_GRID_THEME_PARAMS),
		[]
	);

	const rowData = useMemo<GridRow[]>(
		() =>
			HOURS.map((hour, rowIdx) => ({
				time: hour,
				...Object.fromEntries(
					ROOMS.map((room, colIdx) => [
						room,
						SLOT_CONTENT[rowIdx]?.[colIdx] ?? null
					])
				)
			})) as GridRow[],
		[]
	);

	const columnDefs = useMemo<ColDef<GridRow>[]>(
		() => [
			{
				headerName: "Times",
				field: "time",
				width: 120,
				pinned: "left",
				cellClass: "font-medium"
			},
			...(selectedRoom === "all" ? ROOMS : [selectedRoom]).map((room) => ({
				headerName: room,
				field: room,
				flex: 1,
				minWidth: 120,
				sortable: false,
				cellRenderer: TeamPillRenderer,
				cellClass: "flex items-center justify-center p-2"
			}))
		],
		[selectedRoom]
	);

	return (
		<div>
			<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h2 className="font-bold text-dark-grey text-xl">Room Time Slots</h2>
				<label className="sr-only" htmlFor="judge-room-select">
					Room
				</label>
				<select
					className="rounded-lg border border-medium-grey bg-white px-4 py-2 text-dark-grey text-sm shadow-sm"
					id="judge-room-select"
					onChange={(e) =>
						setSelectedRoom(e.target.value as "all" | (typeof ROOMS)[number])
					}
					value={selectedRoom}
				>
					<option value="all">Room</option>
					{ROOMS.map((r) => (
						<option key={r} value={r}>
							{r}
						</option>
					))}
				</select>
			</div>

			<div className="h-[440px] w-full overflow-hidden rounded-xl border border-medium-grey bg-white">
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={{
						sortable: false,
						filter: false,
						resizable: false,
						suppressMovable: true,
						cellClass: "flex items-center justify-center"
					}}
					rowData={rowData}
					suppressCellFocus={true}
					theme={theme}
				/>
			</div>
		</div>
	);
}
