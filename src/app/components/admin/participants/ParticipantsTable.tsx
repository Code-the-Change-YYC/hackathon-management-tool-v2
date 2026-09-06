"use client";

import { DeleteLine, EditLine, More1Line, User3Line } from "@mingcute/react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { Role } from "@/types/types";
import { type Participant, ROLE_LABELS } from "./types";

const ROLE_BADGE_VARIANTS: Record<
	Role,
	"default" | "secondary" | "accent" | "outline"
> = {
	[Role.ADMIN]: "default",
	[Role.JUDGE]: "accent",
	[Role.PARTICIPANT]: "secondary"
};

type ParticipantsTableProps = {
	participants: Participant[];
	onEdit: (participant: Participant) => void;
	onDelete: (participant: Participant) => void;
};

export function ParticipantsTable({
	participants,
	onEdit,
	onDelete
}: ParticipantsTableProps) {
	if (participants.length === 0) {
		return (
			<Empty className="rounded-xl border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<User3Line />
					</EmptyMedia>
					<EmptyTitle>No users found</EmptyTitle>
					<EmptyDescription>
						Try adjusting your search or clearing the active filters.
					</EmptyDescription>
				</EmptyHeader>
			</Empty>
		);
	}

	return (
		<div className="overflow-hidden">
			<Table>
				<TableHeader>
					<TableRow className="border-none hover:bg-white">
						<TableHead className="pl-4">First Name</TableHead>
						<TableHead>Last Name</TableHead>
						<TableHead>Email Address</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Team ID</TableHead>
						<TableHead>Team Name</TableHead>
						<TableHead className="w-12 pr-4">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{participants.map((participant) => (
						<TableRow
							className="border-none hover:bg-white"
							key={participant.id}
						>
							<TableCell className="pl-4">{participant.firstName}</TableCell>
							<TableCell>{participant.lastName}</TableCell>
							<TableCell className="text-muted-foreground">
								{participant.email}
							</TableCell>
							<TableCell>
								<Badge variant={ROLE_BADGE_VARIANTS[participant.role]}>
									{ROLE_LABELS[participant.role]}
								</Badge>
							</TableCell>
							<TableCell className="text-muted-foreground">
								{participant.teamId}
							</TableCell>
							<TableCell>{participant.teamName ?? "n/a"}</TableCell>
							<TableCell className="pr-4 text-right">
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button
												aria-label={`Actions for ${participant.firstName} ${participant.lastName}`}
												size="icon-sm"
												variant="ghost"
											/>
										}
									>
										<More1Line />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-40">
										<DropdownMenuGroup>
											<DropdownMenuItem onClick={() => onEdit(participant)}>
												<EditLine />
												Edit user
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDelete(participant)}
												variant="destructive"
											>
												<DeleteLine />
												Delete user
											</DropdownMenuItem>
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
