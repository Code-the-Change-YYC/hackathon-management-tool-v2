import type {
	ColDef,
	ValueFormatterParams,
	ValueParserParams,
} from "ag-grid-community";
import { ALL_ROLES, PROGRAMS, type User } from "@/types/types";

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
	borderColor: "var(--color-border)",
} as const;

export const TABLE_SLOT_MIN_TIME = "08:00:00";
export const TABLE_SLOT_MAX_TIME = "19:00:00";
export const TABLE_SLOT_DURATION = "01:00:00";

// Editable fields for user table
export const EDITABLE_FIELDS = new Set([
	"name",
	"email",
	"role",
	"allergies",
	"school",
	"program",
	"completedRegistration",
	"banned",
]);

// Helper functions for formatting and parsing cell values
export const formatDateTime = (value: unknown) => {
	if (!value) return "";
	if (value instanceof Date) return value.toLocaleString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime())
		? String(value)
		: parsed.toLocaleString();
};

export const parseEnumValue = (params: ValueParserParams) => {
	if (params.newValue === "") return null;
	return params.newValue as string;
};

export const parseBooleanValue = (params: ValueParserParams) => {
	if (typeof params.newValue === "boolean") return params.newValue;
	return String(params.newValue) === "true";
};

// User table column definitions
export const createUserColumnDefs = (): ColDef<User>[] => [
	{ field: "id", editable: false, minWidth: 220 },
	{ field: "name", editable: true, minWidth: 160 },
	{ field: "email", editable: true, minWidth: 220 },
	{
		field: "role",
		editable: true,
		cellEditor: "agSelectCellEditor",
		cellEditorParams: { values: ["", ...ALL_ROLES] },
		valueParser: (params) => parseEnumValue(params),
	},
	{ field: "school", editable: true, minWidth: 160 },
	{
		field: "program",
		editable: true,
		cellEditor: "agSelectCellEditor",
		cellEditorParams: { values: ["", ...PROGRAMS] },
		valueParser: (params) => parseEnumValue(params),
	},
	{ field: "allergies", editable: true, minWidth: 160 },
	{
		field: "completedRegistration",
		editable: true,
		cellEditor: "agSelectCellEditor",
		cellEditorParams: { values: ["true", "false"] },
		valueParser: (params) => parseBooleanValue(params),
		valueFormatter: ({ value }: ValueFormatterParams) => (value ? "Yes" : "No"),
	},
	{
		field: "banned",
		editable: true,
		cellEditor: "agSelectCellEditor",
		cellEditorParams: { values: ["true", "false"] },
		valueParser: (params) => parseBooleanValue(params),
		valueFormatter: ({ value }: ValueFormatterParams) => (value ? "Yes" : "No"),
	},
	{
		field: "createdAt",
		editable: false,
		valueFormatter: ({ value }: ValueFormatterParams) => formatDateTime(value),
	},
	{
		field: "updatedAt",
		editable: false,
		valueFormatter: ({ value }: ValueFormatterParams) => formatDateTime(value),
	},
];
