"use client";

import type { CellValueChangedEvent, ColDef } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";
import { api } from "@/trpc/react";
import {
	createTeamColumnDefs,
	TABLE_THEME_PARAMS,
	TEAM_EDITABLE_FIELDS
} from "@/types/teamTableConstants";
import type { Organization } from "@/types/types";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function TeamTable() {
	const { data, isLoading } = api.teams.getAll.useQuery();
	const utils = api.useUtils();
	const updateTeam = api.teams.update.useMutation({
		onSuccess: async () => {
			await utils.teams.getAll.invalidate();
		}
	});

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<Organization>[]>(
		() => createTeamColumnDefs(),
		[]
	);

	const defaultColDef = useMemo<ColDef<Organization>>(
		() => ({
			flex: 1,
			sortable: true,
			filter: true,
			resizable: true
		}),
		[]
	);

	const onCellValueChanged = useCallback(
		(event: CellValueChangedEvent<Organization>) => {
			if (!event.data || !event.colDef.field) return;
			if (event.newValue === event.oldValue) return;
			if (!TEAM_EDITABLE_FIELDS.has(event.colDef.field)) return;

			const updates = {
				id: event.data.id,
				[event.colDef.field]: event.newValue
			};

			updateTeam.mutate(updates);
		},
		[updateTeam]
	);

	// TODO: remove height and width inline style
	return (
		<div style={{ height: 600, width: "100%" }}>
			<AgGridReact
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				getRowId={({ data }) => data.id}
				loading={isLoading}
				onCellValueChanged={onCellValueChanged}
				rowData={data ?? []}
				theme={theme}
			/>
		</div>
	);
}
