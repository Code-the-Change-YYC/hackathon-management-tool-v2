"use client";

import type { ICellRendererParams } from "ag-grid-community";
import { Button } from "@/app/components/ui/button";
import {
	isTeamPrescreenPending,
	type TeamTableContext
} from "@/types/teamTableConstants";
import type { Organization } from "@/types/types";

type PrescreenActionRendererParams = ICellRendererParams<Organization> & {
	context: TeamTableContext;
};

export function TeamPrescreenActionRenderer({
	data,
	context
}: PrescreenActionRendererParams) {
	if (!data || !isTeamPrescreenPending(data.prescreenStatus)) return null;

	return (
		<Button
			onClick={() => context.onOpenPrescreen({ id: data.id, name: data.name })}
			size="sm"
			type="button"
		>
			Prescreen
		</Button>
	);
}
