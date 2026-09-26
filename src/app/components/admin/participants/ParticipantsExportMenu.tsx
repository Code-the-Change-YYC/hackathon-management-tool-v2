"use client";

import { Copy3Line, Download2Line, FileExportLine } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";

type ParticipantsExportMenuProps = {
	onCopyEmails: () => void;
	onDownloadCsv: () => void;
};

export function ParticipantsExportMenu({
	onCopyEmails,
	onDownloadCsv
}: ParticipantsExportMenuProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button size="sm" variant="ghost" />}>
				<FileExportLine data-icon="inline-start" />
				Export
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-48">
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={onCopyEmails}>
						<Copy3Line />
						Copy all emails
					</DropdownMenuItem>
					<DropdownMenuItem onClick={onDownloadCsv}>
						<Download2Line />
						Download as CSV
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
