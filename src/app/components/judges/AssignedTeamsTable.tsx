"use client";

import type { ColDef, ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

const MOCK_ROWS = [
	{ id: "mock-1", teamName: "Name", score: "87" as const, scored: true },
	{ id: "mock-2", teamName: "Name", score: "79" as const, scored: true },
	{ id: "mock-3", teamName: "Name", score: "not" as const, scored: false },
	{ id: "mock-4", teamName: "Name", score: "not" as const, scored: false },
	{ id: "mock-5", teamName: "Name", score: "not" as const, scored: false },
	{ id: "mock-6", teamName: "Name", score: "not" as const, scored: false }
] as const;

type AssignedTeamRow = (typeof MOCK_ROWS)[number];

const CENTERED_HEADER_CLASS = "[&_.ag-header-cell-label]:justify-center";
const CENTERED_CELL_CLASS = "flex items-center justify-center";

// AG Grid handles the table, these params keep it looking like the design.
const ASSIGNED_TEAMS_GRID_THEME_PARAMS = {
	fontFamily: "var(--font-omnes), sans-serif",
	headerBackgroundColor: "var(--color-dark-pink)",
	headerTextColor: "#ffffff",
	headerFontWeight: 700,
	headerFontSize: "16px",
	cellTextColor: "var(--color-dark-grey)",
	rowHeight: 42,
	headerHeight: 42,
	borderRadius: "0px",
	borderColor: "#ffffff",
	accentColor: "var(--color-dark-pink)",
	headerColumnBorder: true,
	headerColumnResizeHandleWidth: "0px",
	headerColumnResizeHandleColor: "transparent",
	columnBorder: true,
	wrapperBorder: false,
	wrapperBorderRadius: "8px 8px 0 0",
	oddRowBackgroundColor: "var(--color-light-grey)",
	evenRowBackgroundColor: "var(--color-medium-grey)"
} as const;

function CheckPill() {
	// Renders the check icon in the grid cell.
	return (
		// Fill the whole grid cell so the check mark actually sits in the middle.
		<span className="flex h-full w-full items-center justify-center">
			<svg
				aria-label="Scored"
				className="block size-5 rounded-full bg-medium-pink p-1 text-white"
				fill="none"
				role="img"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<title>Scored</title>
				<path
					d="M5 13l4 4L19 7"
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2.5}
				/>
			</svg>
		</span>
	);
}

function ActionCellRenderer({
	data
}: ICellRendererParams<AssignedTeamRow, string>) {
	// Renders the create score button or the check icon depending on the row data.
	if (!data) return null;

	if (data.scored) {
		return <CheckPill />;
	}

	return (
		<button
			className="whitespace-nowrap rounded-full border border-dark-pink bg-transparent px-3 py-1 font-semibold text-dark-pink text-xs leading-none transition hover:bg-pastel-pink"
			type="button"
		>
			+ Create Score
		</button>
	);
}

export default function AssignedTeamsTable() {
	const theme = useMemo(
		() => themeQuartz.withParams(ASSIGNED_TEAMS_GRID_THEME_PARAMS),
		[]
	);

	// Mock rows for the visual dashboard; hook this up to real assignments later.
	const columnDefs = useMemo<ColDef<AssignedTeamRow>[]>(
		() => [
			{
				headerName: "Team Name",
				field: "teamName",
				flex: 2,
				minWidth: 180,
				cellClass: `${CENTERED_CELL_CLASS} font-medium`,
				headerClass: CENTERED_HEADER_CLASS,
				suppressMovable: true
			},
			{
				headerName: "Score",
				field: "score",
				flex: 1,
				minWidth: 120,
				cellClass: CENTERED_CELL_CLASS,
				headerClass: CENTERED_HEADER_CLASS,
				suppressMovable: true,
				valueGetter: ({ data }) => (data?.scored ? data.score : "Not Scored")
			},
			{
				headerName: "",
				colId: "action",
				flex: 1.4,
				minWidth: 170,
				cellClass: CENTERED_CELL_CLASS,
				cellRenderer: ActionCellRenderer,
				headerClass: CENTERED_HEADER_CLASS,
				sortable: false,
				filter: false,
				suppressMovable: true
			}
		],
		[]
	);

	return (
		<div className="flex w-full flex-col rounded-lg bg-white px-5 py-6 shadow-md sm:px-6">
			<div className="w-full overflow-hidden rounded-t-lg">
				<AgGridReact
					columnDefs={columnDefs}
					defaultColDef={{
						sortable: false,
						filter: false,
						resizable: false,
						suppressMovable: true
					}}
					domLayout="autoHeight"
					getRowId={({ data }) => data.id}
					headerHeight={42}
					rowData={[...MOCK_ROWS]}
					rowHeight={42}
					scrollbarWidth={0}
					suppressCellFocus={true}
					suppressPaginationPanel={true}
					theme={theme}
				/>
			</div>
			<div className="mt-4 flex justify-end gap-2">
				<button
					aria-label="Previous page"
					className="flex h-5 w-10 items-center justify-center rounded-full bg-dark-pink font-bold text-sm text-white shadow-sm transition hover:bg-medium-pink"
					type="button"
				>
					&lt;
				</button>
				<button
					aria-label="Next page"
					className="flex h-5 w-10 items-center justify-center rounded-full bg-dark-pink font-bold text-sm text-white shadow-sm transition hover:bg-medium-pink"
					type="button"
				>
					&gt;
				</button>
			</div>
		</div>
	);
}
