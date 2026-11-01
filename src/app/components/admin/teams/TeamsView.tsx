"use client";

import { CloseFill } from "@mingcute/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/app/components/ui/alert-dialog";
import { Badge } from "@/app/components/ui/badge";
import { useRefresh } from "@/hooks/use-refresh";
import { api } from "@/trpc/react";
import PageHeader from "../../PageHeader";
import { Card, CardContent } from "../../ui/card";
import { PrescreenDialog } from "./PrescreenDialog";
import { PrescreeningCard } from "./PrescreeningCard";
import { TeamsTable } from "./TeamsTable";
import { TeamsToolbar } from "./TeamsToolbar";
import {
	type FilterOption,
	getFilterOptions,
	SORT_OPTIONS,
	type SortOption,
	type Team,
	type TeamRound
} from "./types";

type ActiveChip = {
	key: string;
	label: string;
	onRemove: () => void;
};

function matchesSearch(team: Team, search: string) {
	const needle = search.trim().toLowerCase();

	if (needle.length === 0) {
		return true;
	}

	return [
		team.name,
		team.teamCode ?? "",
		team.feedback ?? "",
		...team.members.flatMap((member) => [member.name, member.email])
	].some((value) => value.toLowerCase().includes(needle));
}

function matchesFilters(team: Team, filters: FilterOption[]) {
	if (filters.length === 0) return true;

	return filters.every((filter) => {
		switch (filter) {
			case "prescreen":
				return team.prescreen === "passed";
			case "lt-two":
				return team.members.length < 2;
			default:
				return team.rounds[filter.slice("round:".length)] === true;
		}
	});
}

function compareTeams(a: Team, b: Team, sort: SortOption | null) {
	switch (sort) {
		case "name-asc":
			return a.name.localeCompare(b.name);
		case "name-desc":
			return b.name.localeCompare(a.name);
		default:
			return 0;
	}
}

type TeamsViewProps = {
	teams: Team[];
	rounds: TeamRound[];
};

export function TeamsView({ teams, rounds }: TeamsViewProps) {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<FilterOption[]>([]);
	const [sort, setSort] = useState<SortOption | null>(null);
	const [isPrescreening, setIsPrescreening] = useState(false);
	const [deleting, setDeleting] = useState<Team | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { refresh } = useRefresh();

	const visibleTeams = useMemo(
		() =>
			teams
				.filter(
					(team) => matchesSearch(team, search) && matchesFilters(team, filters)
				)
				.sort((a, b) => compareTeams(a, b, sort)),
		[teams, search, filters, sort]
	);

	const filterOptions = useMemo(() => getFilterOptions(rounds), [rounds]);

	const activeChips: ActiveChip[] = [
		...filters.map((filter) => ({
			key: `${filter}`,
			label:
				filterOptions.find((option) => option.value === filter)?.label ??
				filter,
			onRemove: () =>
				setFilters((current) => current.filter((value) => value !== filter))
		}))
	];

	if (sort) {
		activeChips.push({
			key: `sort-${sort}`,
			label:
				SORT_OPTIONS.find((option) => option.value === sort)?.label ?? sort,
			onRemove: () => setSort(null)
		});
	}

	function handleCopyEmails() {
		const emails = visibleTeams
			.flatMap((team) => team.members.map((member) => member.email))
			.join(", ");

		void navigator.clipboard?.writeText(emails);
		toast.success("Emails copied to clipboard!");
	}

	function handleDownloadCsv() {
		toast.success("CSV download started!");
		window.location.href = "/api/admin/teams/export";
	}

	const deleteTeamMutation = api.teams.delete.useMutation({
		onSuccess: () => {
			setDeleting(null);
			toast.success("Team deleted!");
			refresh();
		},
		onError: (error) => {
			toast.error(error.message || "Unable to delete team.");
		}
	});

	async function handleDelete() {
		if (!deleting || isDeleting) return;

		setIsDeleting(true);
		try {
			deleteTeamMutation.mutate({ id: deleting.id });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Unable to delete team."
			);
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<>
			<div className="flex flex-col gap-6">
				<PageHeader
					description="Manage teams and prescreening."
					title="Teams"
				/>
				<PrescreeningCard
					onStart={() => setIsPrescreening(true)}
					teams={teams}
				/>
				<Card>
					<CardContent className="flex flex-col gap-6">
						<TeamsToolbar
							filterOptions={filterOptions}
							filters={filters}
							onCopyEmails={handleCopyEmails}
							onDownloadCsv={handleDownloadCsv}
							onFiltersChange={setFilters}
							onSearchChange={setSearch}
							onSortChange={setSort}
							search={search}
							sort={sort}
						/>

						<div className="flex flex-wrap items-center gap-2">
							<span className="text-muted-foreground text-sm">
								Showing {visibleTeams.length.toLocaleString()} of{" "}
								{teams.length.toLocaleString()} teams
							</span>
							{activeChips.map((chip) => (
								<Badge
									aria-label={`Remove filter: ${chip.label}`}
									className="h-7 cursor-pointer rounded-md px-3 font-medium"
									key={chip.key}
									render={<button onClick={chip.onRemove} type="button" />}
									variant="accent"
								>
									{chip.label}
									<CloseFill />
								</Badge>
							))}
						</div>

						<TeamsTable
							onDelete={setDeleting}
							rounds={rounds}
							teams={visibleTeams}
						/>
					</CardContent>
				</Card>
			</div>

			{isPrescreening ? (
				<PrescreenDialog
					onClose={() => setIsPrescreening(false)}
					teams={teams}
				/>
			) : null}

			<AlertDialog
				onOpenChange={(open) => {
					if (!open) {
						setDeleting(null);
					}
				}}
				open={deleting !== null}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete this team?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleting
								? `Team ${deleting.name} will be removed. This cannot be undone.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							variant="destructive-solid"
						>
							{isDeleting ? "Deleting..." : "Delete team"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
