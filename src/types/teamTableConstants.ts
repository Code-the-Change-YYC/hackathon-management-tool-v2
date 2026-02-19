import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import type { Organization } from "@/types/types";

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

// Editable fields for team table
export const TEAM_EDITABLE_FIELDS = new Set([
	"name",
	"slug",
	"logo",
	"metadata"
]);

// Helper function for formatting date/time
export const formatDateTime = (value: unknown) => {
	if (!value) return "";
	if (value instanceof Date) return value.toLocaleString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime())
		? String(value)
		: parsed.toLocaleString();
};

// Team table column definitions
export const createTeamColumnDefs = (): ColDef<Organization>[] => [
	{ field: "id", editable: false, minWidth: 220 },
	{ field: "name", editable: true, minWidth: 200 },
	{ field: "slug", editable: true, minWidth: 200 },
	{ field: "logo", editable: true, minWidth: 160 },
	{ field: "metadata", editable: true, minWidth: 160 },
	{
		field: "createdAt",
		editable: false,
		valueFormatter: ({ value }: ValueFormatterParams) => formatDateTime(value),
		minWidth: 180
	}
];
