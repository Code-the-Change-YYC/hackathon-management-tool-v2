"use client";

import { Filter2Line } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { FILTER_OPTIONS, type FilterOption } from "./types";

type TeamsFilterMenuProps = {
	filters: FilterOption[];
	onFiltersChange: (filters: FilterOption[]) => void;
};

function toggle<T>(values: T[], value: T): T[] {
	return values.includes(value)
		? values.filter((current) => current !== value)
		: [...values, value];
}

export function TeamsFilterMenu({
	filters,
	onFiltersChange
}: TeamsFilterMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Filter teams" size="icon-lg" variant="ghost" />
				}
			>
				<Filter2Line />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					{FILTER_OPTIONS.map((option) => (
						<DropdownMenuCheckboxItem
							checked={filters.includes(option.value)}
							key={option.value}
							onCheckedChange={() =>
								onFiltersChange(toggle<FilterOption>(filters, option.value))
							}
						>
							{option.label}
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
