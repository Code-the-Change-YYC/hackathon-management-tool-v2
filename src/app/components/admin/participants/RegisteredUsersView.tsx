"use client";

import { CloseFill, NotificationLine } from "@mingcute/react";
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
import { Button } from "@/app/components/ui/button";
import { SidebarTrigger } from "@/app/components/ui/sidebar";
import { EditParticipantDialog } from "./EditParticipantDialog";
import { InviteUserDialog } from "./InviteUserDialog";
import { ParticipantsTable } from "./ParticipantsTable";
import { ParticipantsToolbar } from "./ParticipantsToolbar";
import { SendEmailDialog } from "./SendEmailDialog";
import {
	EMPTY_FILTERS,
	FOOD_OPTIONS,
	type Participant,
	type ParticipantFilters,
	ROLE_LABELS,
	SORT_OPTIONS,
	type SortOption
} from "./types";

type ActiveChip = {
	key: string;
	label: string;
	onRemove: () => void;
};

function matchesSearch(participant: Participant, search: string) {
	const needle = search.trim().toLowerCase();

	if (needle.length === 0) {
		return true;
	}

	return [
		participant.firstName,
		participant.lastName,
		participant.email,
		participant.teamId ?? "",
		participant.teamName ?? ""
	].some((value) => value.toLowerCase().includes(needle));
}

function matchesFilters(participant: Participant, filters: ParticipantFilters) {
	if (filters.roles.length > 0 && !filters.roles.includes(participant.role)) {
		return false;
	}

	if (filters.food.length === 1) {
		const wantsRegistered = filters.food[0] === "registered";

		if (participant.registeredForFood !== wantsRegistered) {
			return false;
		}
	}

	if (
		filters.institutions.length > 0 &&
		!filters.institutions.includes(participant.institution)
	) {
		return false;
	}

	if (
		filters.majors.length > 0 &&
		!(participant.major && filters.majors.includes(participant.major))
	) {
		return false;
	}

	return true;
}

function compareParticipants(
	a: Participant,
	b: Participant,
	sort: SortOption | null
) {
	switch (sort) {
		case "role-asc":
			return a.role.localeCompare(b.role);
		case "role-desc":
			return b.role.localeCompare(a.role);
		case "name-asc":
			return a.firstName.localeCompare(b.firstName);
		case "name-desc":
			return b.firstName.localeCompare(a.firstName);
		default:
			return 0;
	}
}

type RegisteredUsersViewProps = {
	participants: Participant[];
};

export function RegisteredUsersView({
	participants
}: RegisteredUsersViewProps) {
	const [search, setSearch] = useState("");
	const [filters, setFilters] = useState<ParticipantFilters>(EMPTY_FILTERS);
	const [sort, setSort] = useState<SortOption | null>(null);
	const [inviteOpen, setInviteOpen] = useState(false);
	const [emailOpen, setEmailOpen] = useState(false);
	const [editing, setEditing] = useState<Participant | null>(null);
	const [deleting, setDeleting] = useState<Participant | null>(null);

	const visibleParticipants = useMemo(
		() =>
			participants
				.filter(
					(participant) =>
						matchesSearch(participant, search) &&
						matchesFilters(participant, filters)
				)
				.sort((a, b) => compareParticipants(a, b, sort)),
		[participants, search, filters, sort]
	);

	const activeChips: ActiveChip[] = [
		...filters.roles.map((role) => ({
			key: `role-${role}`,
			label: `Role: ${ROLE_LABELS[role]}`,
			onRemove: () =>
				setFilters((current) => ({
					...current,
					roles: current.roles.filter((value) => value !== role)
				}))
		})),
		...filters.food.map((food) => ({
			key: `food-${food}`,
			label:
				FOOD_OPTIONS.find((option) => option.value === food)?.label ?? food,
			onRemove: () =>
				setFilters((current) => ({
					...current,
					food: current.food.filter((value) => value !== food)
				}))
		})),
		...filters.institutions.map((institution) => ({
			key: `institution-${institution}`,
			label: institution,
			onRemove: () =>
				setFilters((current) => ({
					...current,
					institutions: current.institutions.filter(
						(value) => value !== institution
					)
				}))
		})),
		...filters.majors.map((major) => ({
			key: `major-${major}`,
			label: major,
			onRemove: () =>
				setFilters((current) => ({
					...current,
					majors: current.majors.filter((value) => value !== major)
				}))
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
		const emails = visibleParticipants
			.map((participant) => participant.email)
			.join(", ");

		void navigator.clipboard?.writeText(emails);
		toast.success("Emails copied to clipboard!");
	}

	function handleDownloadCsv() {
		// TODO: generate the export server-side once the router exists.
		toast.success("CSV download started!");
	}

	function handleDelete() {
		// TODO: actually delete the user.
		setDeleting(null);
		toast.success("User deleted!");
	}

	return (
		<div className="flex min-h-svh flex-col">
			<header className="flex items-center justify-between gap-2 border-b px-4 py-3 md:hidden">
				<SidebarTrigger />
				<Button aria-label="Notifications" size="icon-sm" variant="ghost">
					<NotificationLine />
				</Button>
			</header>

			<div className="flex flex-1 flex-col gap-5 p-4 md:p-8">
				<div className="flex flex-col gap-1">
					<h1 className="font-semibold text-2xl md:text-3xl">
						Registered Users
					</h1>
					<p className="text-muted-foreground text-sm">View all participants</p>
				</div>

				<ParticipantsToolbar
					filters={filters}
					onCopyEmails={handleCopyEmails}
					onDownloadCsv={handleDownloadCsv}
					onEmail={() => setEmailOpen(true)}
					onFiltersChange={setFilters}
					onInvite={() => setInviteOpen(true)}
					onSearchChange={setSearch}
					onSortChange={setSort}
					search={search}
					sort={sort}
				/>

				<div className="flex flex-wrap items-center gap-2">
					<span className="text-muted-foreground text-sm">
						Showing {visibleParticipants.length.toLocaleString()} of{" "}
						{participants.length.toLocaleString()} users
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

				<ParticipantsTable
					onDelete={setDeleting}
					onEdit={setEditing}
					participants={visibleParticipants}
				/>
			</div>

			<InviteUserDialog onOpenChange={setInviteOpen} open={inviteOpen} />
			<SendEmailDialog onOpenChange={setEmailOpen} open={emailOpen} />
			<EditParticipantDialog
				onOpenChange={(open) => {
					if (!open) {
						setEditing(null);
					}
				}}
				participant={editing}
			/>

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
						<AlertDialogTitle>Delete this user?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleting
								? `${deleting.firstName} ${deleting.lastName} will lose access to the event. This cannot be undone.`
								: null}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							variant="destructive-solid"
						>
							Delete user
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
