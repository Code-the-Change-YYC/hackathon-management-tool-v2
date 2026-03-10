import type { ColDef, ValueGetterParams } from "ag-grid-community";
import type { RouterOutputs } from "@/trpc/react";

type Assignment = RouterOutputs["scores"]["getByRound"][number];

export const JUDGING_DEFAULT_COLUMN_WIDTH = 150;
export const TEAM_NAME_COLUMN_WIDTH = 220;

export const JUDGING_TABLE_THEME_PARAMS = {
	fontFamily: "var(--font-omnes), sans-serif",
	headerBackgroundColor: "var(--color-dark-pink)",
	headerTextColor: "#ffffff",
	headerFontWeight: 700,
	headerFontSize: "18px",
	cellTextColor: "var(--color-dark-grey)",
	rowHeight: 66,
	borderRadius: "12px",
	borderColor: "var(--color-dashboard-grey)",
	accentColor: "var(--color-dark-pink)",
	headerColumnBorder: true,
	headerColumnResizeHandleWidth: "0px",
	headerColumnResizeHandleColor: "transparent",
	columnBorder: true,
	wrapperBorder: false
} as const;

export const createJudgingColumnDefs = (
	criteria: { id: string; name: string; isSidepot: boolean; maxScore: number }[]
): ColDef<Assignment>[] => {
	return [
		{
			headerName: "Team Name",
			field: "team.name",
			pinned: "left",
			minWidth: TEAM_NAME_COLUMN_WIDTH,
			cellClass: "font-bold text-lg",
			sort: "asc",
			suppressMovable: true,
			valueGetter: (params) => params.data?.team?.name
		},
		...criteria.map((c) => ({
			headerName: c.isSidepot ? `Sidepot: ${c.name}` : c.name,
			colId: `score_${c.id}`,
			headerClass: c.isSidepot ? "bg-pastel-pink text-dark-pink" : "",
			width: JUDGING_DEFAULT_COLUMN_WIDTH,
			editable: true,
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values: Array.from({ length: c.maxScore + 1 }, (_, i) => i)
			},
			criteriaId: c.id,
			suppressMovable: true,
			valueGetter: (params: ValueGetterParams<Assignment>) => {
				const score = params.data?.scores?.find((s) => s.criteriaId === c.id);
				return score?.value ?? null;
			}
		})),
		{
			headerName: "Actions",
			pinned: "right",
			width: 120,
			sortable: false,
			filter: false,
			cellRenderer: "actionCellRenderer",
			suppressMovable: true
		}
	];
};
