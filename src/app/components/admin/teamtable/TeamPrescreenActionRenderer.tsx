"use client";

import type { ICellRendererParams } from "ag-grid-community";
import {
	isTeamPrescreenPending,
	type PrescreenTeam,
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
		<button
			className="rounded-full bg-medium-pink px-4 py-1 font-bold text-sm text-white shadow-sm"
			onClick={() => context.onOpenPrescreen({ id: data.id, name: data.name })}
			type="button"
		>
			Prescreen
		</button>
	);
}
