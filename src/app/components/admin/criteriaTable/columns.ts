import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { createElement } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";

export type Criteria = {
	id: string;
	name: string;
	description: string;
	displayOrder: number;
	maxScore: number;
	isSidepot: boolean;
};

export type CriteriaUpdate = { id: string } & Partial<
	Pick<
		Criteria,
		"name" | "description" | "displayOrder" | "maxScore" | "isSidepot"
	>
>;

type ColumnCallbacks = {
	onUpdate: (input: CriteriaUpdate) => void;
	onDelete: (criterion: Criteria) => void;
	deletePending: boolean;
};

export const defaultColDef: ColDef<Criteria> = {
	flex: 1,
	sortable: true,
	filter: true,
	resizable: true
};

export function createColumnDefs({
	onUpdate,
	onDelete,
	deletePending
}: ColumnCallbacks): ColDef<Criteria>[] {
	return [
		{
			headerName: "Name",
			field: "name",
			editable: true,
			flex: 2
		},
		{
			headerName: "Description",
			field: "description",
			editable: true,
			flex: 4
		},
		{
			headerName: "Display Order",
			field: "displayOrder",
			editable: true,
			width: 130
		},
		{
			headerName: "Max Score",
			field: "maxScore",
			editable: true,
			width: 130
		},
		{
			headerName: "Sidepot",
			field: "isSidepot",
			width: 100,
			cellRenderer: (params: ICellRendererParams<Criteria>) => {
				const criterion = params.data;
				if (!criterion) return null;

				return createElement(Checkbox, {
					"aria-label": `Mark ${criterion.name} as a sidepot`,
					className: "mx-auto mt-2.5",
					checked: params.value === true,
					onCheckedChange: (checked) =>
						onUpdate({
							id: criterion.id,
							isSidepot: checked === true
						})
				});
			}
		},
		{
			headerName: "",
			width: 90,
			sortable: false,
			filter: false,
			cellRenderer: (params: ICellRendererParams<Criteria>) => {
				if (!params.data) return null;

				return createElement(
					Button,
					{
						disabled: deletePending,
						onClick: () => onDelete(params.data as Criteria),
						size: "sm",
						type: "button",
						variant: "destructive"
					},
					"Delete"
				);
			}
		}
	];
}
