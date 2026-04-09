"use client";

import type { ColDef } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { api } from "@/trpc/react";
import { TABLE_THEME_PARAMS } from "@/types/teamTableConstants";
import type { TeamRanking } from "@/types/types";

ModuleRegistry.registerModules([AllCommunityModule]);

export default function ScoreTable() {
	const { data, isLoading } = api.teams.getRankings.useQuery();

	const theme = themeQuartz.withParams(TABLE_THEME_PARAMS);

	const columnDefs = useMemo<ColDef<TeamRanking>[]>(
		() => [
			{
				headerName: "Rank",
				width: 100,
				sortable: false,
				valueGetter: (params) => {
					if (!params.node) return "";
					const idx = params.node.rowIndex;
					return typeof idx === "number" ? idx + 1 : "";
				}
			},
			{
				headerName: "Team Name",
				field: "name",
				sortable: true,
				filter: true
			},
			{
				headerName: "Total Score",
				field: "totalScore",
				sort: "desc", // 👈 default descending
				filter: "agNumberColumnFilter",
				sortable: true
			}
		],
		[]
	);

	const defaultColDef = useMemo<ColDef<TeamRanking>>(
		() => ({
			flex: 1,
			resizable: true
		}),
		[]
	);

	// TODO: remove height and width inline style
	return (
		<div style={{ height: 600, width: "100%" }}>
			<AgGridReact
				columnDefs={columnDefs}
				defaultColDef={defaultColDef}
				getRowId={({ data }) => data.id}
				loading={isLoading}
				rowData={data ?? []}
				theme={theme}
			/>
		</div>
	);
}
