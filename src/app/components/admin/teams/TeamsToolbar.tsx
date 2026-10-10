"use client";

import { Search3Line } from "@mingcute/react";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from "@/app/components/ui/input-group";
import { TeamsExportMenu } from "./TeamsExportMenu";
import { TeamsFilterMenu } from "./TeamsFilterMenu";
import { TeamsSortMenu } from "./TeamsSortMenu";
import type { FilterOption, SortOption } from "./types";

type TeamsToolbarProps = {
	search: string;
	onSearchChange: (search: string) => void;
	filters: FilterOption[];
	onFiltersChange: (filters: FilterOption[]) => void;
	sort: SortOption | null;
	onSortChange: (sort: SortOption) => void;
	onCopyEmails: () => void;
	onDownloadCsv: () => void;
};

export function TeamsToolbar({
	search,
	onSearchChange,
	filters,
	onFiltersChange,
	sort,
	onSortChange,
	onCopyEmails,
	onDownloadCsv
}: TeamsToolbarProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
			<InputGroup className="h-10 lg:max-w-sm">
				<InputGroupAddon>
					<Search3Line />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search for a team"
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Search for a team"
					value={search}
				/>
			</InputGroup>
			<div className="flex flex-wrap items-center gap-2 lg:ml-auto">
				<TeamsFilterMenu filters={filters} onFiltersChange={onFiltersChange} />
				<TeamsSortMenu onSortChange={onSortChange} sort={sort} />
				<TeamsExportMenu
					onCopyEmails={onCopyEmails}
					onDownloadCsv={onDownloadCsv}
				/>
			</div>
		</div>
	);
}
