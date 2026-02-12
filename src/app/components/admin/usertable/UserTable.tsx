"use client";

import type {
	CellValueChangedEvent,
	ColDef,
	ValueFormatterParams,
	ValueParserParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { api } from "@/trpc/react";
import { ALL_ROLES, PROGRAMS, type User, type UserInsert } from "@/types/types";

ModuleRegistry.registerModules([AllCommunityModule]);

const editableFields = new Set([
	"name",
	"email",
	"role",
	"allergies",
	"school",
	"program",
	"completedRegistration",
	"banned",
]);

const formatDateTime = (value: unknown) => {
	if (!value) return "";
	if (value instanceof Date) return value.toLocaleString();
	const parsed = new Date(String(value));
	return Number.isNaN(parsed.getTime())
		? String(value)
		: parsed.toLocaleString();
};

const parseEnumValue = (params: ValueParserParams) => {
	if (params.newValue === "") return null;
	return params.newValue as string;
};

const parseBooleanValue = (params: ValueParserParams) => {
	if (typeof params.newValue === "boolean") return params.newValue;
	return String(params.newValue) === "true";
};

export default function UserTable() {
	const { data, isLoading } = api.users.getAll.useQuery(); // prefetch these eventually
	const utils = api.useUtils();
	const updateUser = api.users.update.useMutation({
		onSuccess: async () => {
			await utils.users.getAll.invalidate();
		},
	});

	const columnDefs = useMemo<ColDef<User>[]>(
		() => [
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
				valueFormatter: ({ value }: ValueFormatterParams) =>
					value ? "Yes" : "No",
			},
			{
				field: "banned",
				editable: true,
				cellEditor: "agSelectCellEditor",
				cellEditorParams: { values: ["true", "false"] },
				valueParser: (params) => parseBooleanValue(params),
				valueFormatter: ({ value }: ValueFormatterParams) =>
					value ? "Yes" : "No",
			},
			{
				field: "createdAt",
				editable: false,
				valueFormatter: ({ value }: ValueFormatterParams) =>
					formatDateTime(value),
			},
			{
				field: "updatedAt",
				editable: false,
				valueFormatter: ({ value }: ValueFormatterParams) =>
					formatDateTime(value),
			},
		],
		[],
	);

	const defaultColDef = useMemo<ColDef<User>>(
		() => ({
			flex: 1,
			sortable: true,
			filter: true,
			resizable: true,
		}),
		[],
	);

	const onCellValueChanged = useCallback(
		(event: CellValueChangedEvent<User>) => {
			if (!event.data || !event.colDef.field) return;
			if (event.newValue === event.oldValue) return;
			if (!editableFields.has(event.colDef.field)) return;

			const updates: UserInsert = {
				id: event.data.id,
				[event.colDef.field]: event.newValue,
			};

			updateUser.mutate(updates);
		},
		[updateUser],
	);

	return (
		<div className="ag-theme-quartz" style={{ height: 600, width: "100%" }}>
			<AgGridReact
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				getRowId={({ data }) => data.id}
				loading={isLoading}
				onCellValueChanged={onCellValueChanged}
				rowData={data ?? []}
			/>
		</div>
	);
}
