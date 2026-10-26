"use client";

import { MailSendLine, Search3Line, UserAddLine } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput
} from "@/app/components/ui/input-group";
import { ParticipantsExportMenu } from "./ParticipantsExportMenu";
import { ParticipantsFilterMenu } from "./ParticipantsFilterMenu";
import { ParticipantsSortMenu } from "./ParticipantsSortMenu";
import type { ParticipantFilters, SortOption } from "./types";

type ParticipantsToolbarProps = {
	search: string;
	onSearchChange: (search: string) => void;
	filters: ParticipantFilters;
	onFiltersChange: (filters: ParticipantFilters) => void;
	sort: SortOption | null;
	onSortChange: (sort: SortOption) => void;
	onInvite: () => void;
	onEmail: () => void;
	onCopyEmails: () => void;
	onDownloadCsv: () => void;
};

export function ParticipantsToolbar({
	search,
	onSearchChange,
	filters,
	onFiltersChange,
	sort,
	onSortChange,
	onInvite,
	onEmail,
	onCopyEmails,
	onDownloadCsv
}: ParticipantsToolbarProps) {
	return (
		<div className="flex flex-col gap-3 lg:flex-row lg:items-center">
			<InputGroup className="h-10 lg:max-w-sm">
				<InputGroupAddon>
					<Search3Line />
				</InputGroupAddon>
				<InputGroupInput
					aria-label="Search for a user"
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Search for a user"
					value={search}
				/>
			</InputGroup>
			<div className="flex flex-wrap items-center gap-2 lg:ml-auto">
				<ParticipantsFilterMenu
					filters={filters}
					onFiltersChange={onFiltersChange}
				/>
				<ParticipantsSortMenu onSortChange={onSortChange} sort={sort} />
				<Button
					aria-haspopup="dialog"
					aria-label="Invite a user"
					onClick={onInvite}
					size="icon-lg"
					variant="ghost"
				>
					<UserAddLine />
				</Button>
				<ParticipantsExportMenu
					onCopyEmails={onCopyEmails}
					onDownloadCsv={onDownloadCsv}
				/>
				<Button aria-haspopup="dialog" onClick={onEmail} size="sm">
					<MailSendLine data-icon="inline-start" />
					Email users
				</Button>
			</div>
		</div>
	);
}
