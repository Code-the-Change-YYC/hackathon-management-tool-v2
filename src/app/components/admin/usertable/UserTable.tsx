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
import type { User } from "@/types/types";
import {
	createUserColumnDefs,
	EDITABLE_FIELDS,
	TABLE_THEME_PARAMS
} from "@/types/userTableConstants";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function UserTable() {
	const { data, isLoading } = api.users.getAll.useQuery(); // prefetch these eventually
	const utils = api.useUtils();
	const updateUser = api.users.update.useMutation({
		onSuccess: async () => {
			await utils.users.getAll.invalidate();
		}
	});

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<User>[]>(() => createUserColumnDefs(), []);

	const defaultColDef = useMemo<ColDef<User>>(
		() => ({
			flex: 1,
			sortable: true,
			filter: true,
			resizable: true
		}),
		[]
	);

	const onCellValueChanged = useCallback(
		(event: CellValueChangedEvent<User>) => {
			if (!event.data || !event.colDef.field) return;
			if (event.newValue === event.oldValue) return;
			if (!EDITABLE_FIELDS.has(event.colDef.field)) return;

			const updates = {
				id: event.data.id,
				[event.colDef.field]: event.newValue
			};

			updateUser.mutate(updates);
		},
		[updateUser]
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
