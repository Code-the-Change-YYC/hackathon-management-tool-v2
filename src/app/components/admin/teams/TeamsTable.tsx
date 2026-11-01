"use client";

import { DeleteLine, More1Line, User3Line } from "@mingcute/react";
import { BooleanIcon } from "@/app/components/admin/BooleanIcon";
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
import { formatMemberNames, type Team, type TeamRound } from "./types";

type TeamsTableProps = {
	teams: Team[];
	rounds: TeamRound[];
	onDelete: (team: Team) => void;
};

function OptionalBooleanIcon({ value }: { value: boolean | null }) {
	return value === null ? "n/a" : <BooleanIcon value={value} />;
}

export function TeamsTable({ teams, rounds, onDelete }: TeamsTableProps) {
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
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow className="border-none hover:bg-white">
						<TableHead className="min-w-44 pl-4">Team Name</TableHead>
						<TableHead className="min-w-28">Team Code</TableHead>
						<TableHead className="min-w-28">Prescreen</TableHead>
						{rounds.map((round) => (
							<TableHead className="min-w-28" key={round.id}>
								{round.name}
							</TableHead>
						))}
						<TableHead className="min-w-52">Feedback</TableHead>
						<TableHead className="min-w-64">Members</TableHead>
						<TableHead className="w-12 pr-4">
							<span className="sr-only">Actions</span>
						</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{teams.map((team) => (
						<TableRow className="border-none hover:bg-white" key={team.id}>
							<TableCell className="pl-4">{team.name}</TableCell>
							<TableCell className="tracking-wider">
								{team.teamCode ?? "n/a"}
							</TableCell>
							<TableCell>
								<OptionalBooleanIcon
									value={
										team.prescreen === "pending"
											? null
											: team.prescreen === "passed"
									}
								/>
							</TableCell>
							{rounds.map((round) => (
								<TableCell key={round.id}>
									<OptionalBooleanIcon value={team.rounds[round.id] ?? null} />
								</TableCell>
							))}
							<TableCell className="whitespace-normal">
								{team.feedback ?? "n/a"}
							</TableCell>
							<TableCell className="whitespace-normal">
								{team.members.length > 0 ? formatMemberNames(team) : "n/a"}
							</TableCell>
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
