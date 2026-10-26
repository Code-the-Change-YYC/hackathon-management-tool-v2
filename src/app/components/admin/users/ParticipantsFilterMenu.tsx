"use client";

import { Filter2Line } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import type { Role } from "@/types/types";
import {
	FOOD_OPTIONS,
	type FoodFilter,
	INSTITUTION_OPTIONS,
	MAJOR_OPTIONS,
	type ParticipantFilters,
	ROLE_OPTIONS
} from "./types";

type ParticipantsFilterMenuProps = {
	filters: ParticipantFilters;
	onFiltersChange: (filters: ParticipantFilters) => void;
};

function toggle<T>(values: T[], value: T): T[] {
	return values.includes(value)
		? values.filter((current) => current !== value)
		: [...values, value];
}

export function ParticipantsFilterMenu({
	filters,
	onFiltersChange
}: ParticipantsFilterMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button aria-label="Filter users" size="icon-lg" variant="ghost" />
				}
			>
				<Filter2Line />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Role</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{ROLE_OPTIONS.map((option) => (
								<DropdownMenuCheckboxItem
									checked={filters.roles.includes(option.value)}
									key={option.value}
									onCheckedChange={() =>
										onFiltersChange({
											...filters,
											roles: toggle<Role>(filters.roles, option.value)
										})
									}
								>
									{option.label}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Registered for food</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{FOOD_OPTIONS.map((option) => (
								<DropdownMenuCheckboxItem
									checked={filters.food.includes(option.value)}
									key={option.value}
									onCheckedChange={() =>
										onFiltersChange({
											...filters,
											food: toggle<FoodFilter>(filters.food, option.value)
										})
									}
								>
									{option.label}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Institution</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{INSTITUTION_OPTIONS.map((institution) => (
								<DropdownMenuCheckboxItem
									checked={filters.institutions.includes(institution)}
									key={institution}
									onCheckedChange={() =>
										onFiltersChange({
											...filters,
											institutions: toggle(filters.institutions, institution)
										})
									}
								>
									{institution}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>Major (U of C only)</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							{MAJOR_OPTIONS.map((major) => (
								<DropdownMenuCheckboxItem
									checked={filters.majors.includes(major)}
									key={major}
									onCheckedChange={() =>
										onFiltersChange({
											...filters,
											majors: toggle(filters.majors, major)
										})
									}
								>
									{major}
								</DropdownMenuCheckboxItem>
							))}
						</DropdownMenuSubContent>
					</DropdownMenuSub>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
