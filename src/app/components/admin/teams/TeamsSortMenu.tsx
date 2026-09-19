"use client";

import { SortAscendingLine } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import { SORT_OPTIONS, type SortOption } from "./types";

type TeamsSortMenuProps = {
	sort: SortOption | null;
	onSortChange: (sort: SortOption) => void;
};

export function TeamsSortMenu({ sort, onSortChange }: TeamsSortMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Sort teams" size="icon-lg" variant="ghost" />
				}
			>
				<SortAscendingLine />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64">
				<DropdownMenuGroup>
					<DropdownMenuRadioGroup
						onValueChange={(value) => onSortChange(value as SortOption)}
						value={sort ?? ""}
					>
						{SORT_OPTIONS.map((option) => (
							<DropdownMenuRadioItem key={option.value} value={option.value}>
								{option.label}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
