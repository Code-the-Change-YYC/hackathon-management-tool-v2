import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import type { Organization, PrescreenStatus } from "@/types/types";

export const DEFAULT_COLUMN_WIDTH = 300;
export const MIN_COLUMN_WIDTH = 175;

export const TABLE_THEME_PARAMS = {
	fontFamily: "var(--font-albert-sans), sans-serif",
	wrapperBorder: false,
	columnBorder: true,
	headerBackgroundColor: "transparent",
	spacing: "8px",
	headerTextColor: "var(--color-dark-grey)",
	cellTextColor: "var(--color-dark-grey)",
	borderColor: "var(--color-border)"
} as const;

export const TABLE_SLOT_MIN_TIME = "08:00:00";
export const TABLE_SLOT_MAX_TIME = "19:00:00";
export const TABLE_SLOT_DURATION = "01:00:00";

export const TEAM_PRESCREEN_ACTION_RENDERER = "teamPrescreenActionRenderer";

export type PrescreenTeam = Pick<Organization, "id" | "name">;

export type TeamTableContext = {
	onOpenPrescreen: (team: PrescreenTeam) => void;
};

// Editable fields for team table
export const TEAM_EDITABLE_FIELDS = new Set([
	"name",
	"slug",
	"logo",
	"metadata"
]);

export const formatDateTime = (value: unknown) => {
	if (!value) return "";
	if (value instanceof Date) return value.toLocaleString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime())
		? String(value)
		: parsed.toLocaleString();
};

const PRESCREEN_STATUS_LABELS: Record<PrescreenStatus, string> = {
	pending: "Pending",
	passed: "Passed",
	failed: "Failed"
};

export function isTeamPrescreenPending(
	status: Organization["prescreenStatus"] | null | undefined
) {
	return !status || status === "pending";
}

// Team table column definitions
export const createTeamColumnDefs = (): ColDef<Organization>[] => [
	{ field: "id", editable: false, minWidth: 220 },
	{ field: "name", editable: true, minWidth: 200 },
	{ field: "slug", editable: true, minWidth: 200 },
	{ field: "logo", editable: true, minWidth: 160 },
	{ field: "metadata", editable: true, minWidth: 160 },
	{
		field: "prescreenStatus",
		headerName: "Prescreen Status",
		editable: false,
		minWidth: 140,
		valueFormatter: ({ value }: ValueFormatterParams) =>
			isTeamPrescreenPending(value as PrescreenStatus | null | undefined)
				? PRESCREEN_STATUS_LABELS.pending
				: (PRESCREEN_STATUS_LABELS[value as PrescreenStatus] ??
					String(value ?? ""))
	},
	{
		field: "prescreenComments",
		headerName: "Prescreen Comments",
		editable: false,
		minWidth: 200
	},
	{
		field: "prescreenedAt",
		headerName: "Prescreened At",
		editable: false,
		valueFormatter: ({ value }: ValueFormatterParams) => formatDateTime(value),
		minWidth: 180
	},
	{
		field: "createdAt",
		editable: false,
		valueFormatter: ({ value }: ValueFormatterParams) => formatDateTime(value),
		minWidth: 180
	},
	{
		headerName: "Actions",
		colId: "actions",
		editable: false,
		sortable: false,
		filter: false,
		minWidth: 130,
		cellRenderer: TEAM_PRESCREEN_ACTION_RENDERER
	}
];
