"use client";

import {
	CheckFill,
	CloseFill,
	DeleteLine,
	More1Line,
	User3Line
} from "@mingcute/react";
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
import type { Team } from "./types";

type TeamsTableProps = {
	teams: Team[];
	onPrescreen: (team: Team) => void;
	onReview: (team: Team) => void;
	onDelete: (participant: Team) => void;
};

function getBooleanElement(bool: boolean | null) {
	switch (bool) {
		case true:
			return <CheckFill aria-label="Passed" size={10} />;
		case false:
			return <CloseFill aria-label="Failed" size={10} />;
		default:
			return <p>N/A</p>;
	}
}

function getRoundTwoElement(
	round2: "winner" | "sp-winner" | "rejected" | null
) {
	switch (round2) {
		case "winner":
			return <p>Winner</p>;
		case "sp-winner":
			return <p>SP Winner</p>;
		case "rejected":
			return <CloseFill aria-label="Rejected" size={10} />;
		default:
			return <p>N/A</p>;
	}
}

export function TeamsTable({
	teams,
	onPrescreen,
	onReview,
	onDelete
}: TeamsTableProps) {
	if (teams.length === 0) {
		return (
			<Empty className="rounded-xl border">
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<User3Line />
					</EmptyMedia>
					<EmptyTitle>No teams found</EmptyTitle>
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
						<TableHead>Rank</TableHead>
						<TableHead>ID</TableHead>
						<TableHead>Team Name</TableHead>
						<TableHead>
							<div className="flex size-full items-center justify-center">
								Prescreen
							</div>
						</TableHead>
						<TableHead>
							<div className="flex size-full items-center justify-center">
								Round 1
							</div>
						</TableHead>
						<TableHead>
							<div className="flex size-full items-center justify-center">
								Round 2
							</div>
						</TableHead>
						<TableHead>Feedback</TableHead>
						<TableHead>Members</TableHead>
						<TableHead className="w-12 pr-4">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{teams.map((team) => (
						<TableRow className="border-none hover:bg-white" key={team.id}>
							<TableCell className="pl-3">{team.rank}</TableCell>
							<TableCell>{team.id}</TableCell>
							<TableCell>{team.name}</TableCell>
							<TableCell>
								<div className="flex size-full items-center justify-center">
									{getBooleanElement(team.prescreen)}
								</div>
							</TableCell>
							<TableCell>
								<div className="flex size-full items-center justify-center">
									{getBooleanElement(team.round1)}
								</div>
							</TableCell>
							<TableCell>
								<div className="flex size-full items-center justify-center">
									{getRoundTwoElement(team.round2)}
								</div>
							</TableCell>
							<TableCell>{team.feedback}</TableCell>
							<TableCell>{team.members}</TableCell>
							<TableCell className="pr-4 text-right">
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button
												aria-label={`Actions for ${team.name}`}
												size="icon-sm"
												variant="ghost"
											/>
										}
									>
										<More1Line />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-40">
										<DropdownMenuGroup>
											<DropdownMenuItem onClick={() => onPrescreen(team)}>
												Prescreen team
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onReview(team)}>
												Review judging feedback
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={() => onDelete(team)}
												variant="destructive"
											>
												<DeleteLine />
												Delete team
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
