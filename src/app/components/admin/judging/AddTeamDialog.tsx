"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SelectField } from "@/app/components/forms/SelectField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { useRefresh } from "@/hooks/use-refresh";
import { formatTime } from "@/lib/datetime";
import { ARRIVAL_BUFFER_MINUTES } from "@/lib/judging";
import { api, type RouterOutputs } from "@/trpc/react";
import type { Round, Team } from "./judgingShared";

const addTeamSchema = z.object({
	teamId: z.string({ message: "Choose a team." }).min(1, "Choose a team.")
});

function SlotsPreview({
	slots,
	error
}: {
	slots?: RouterOutputs["judgingTables"]["previewLateTeamSlots"];
	error: { message: string } | null;
}) {
	if (slots === null) {
		return (
			<p className="m-0 font-medium text-destructive">
				There are no back-to-back free slots left at two different tables.
			</p>
		);
	}
	if (!slots) {
		return (
			<p className="m-0 text-muted-foreground">
				{error ? error.message : "Finding free slots…"}
			</p>
		);
	}
	return (
		<p className="m-0 font-medium">
			{formatTime(slots.first.startsAt)} at Table {slots.first.tableNumber},
			then {formatTime(slots.second.startsAt)} at Table{" "}
			{slots.second.tableNumber}
		</p>
	);
}

export function AddTeamDialog({
	round,
	teams,
	onClose
}: {
	round: Round;
	teams: Team[];
	onClose: () => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<z.input<typeof addTeamSchema>>({
		defaultValues: { teamId: "" },
		resolver: zodResolver(addTeamSchema)
	});
	// The free slots move on as time passes, so keep the shown times current.
	const preview = api.judgingTables.previewLateTeamSlots.useQuery(
		{ roundId: round.id },
		{ enabled: teams.length > 0, refetchInterval: 30_000 }
	);
	const slots = preview.data;
	const addTeam = api.judgingTables.addTeam.useMutation({
		onError: (error) => {
			toast.error(error.message);
			void preview.refetch();
		},
		onSuccess: (added, { teamId }) =>
			refresh(() => {
				const name = teams.find((team) => team.id === teamId)?.name;
				toast.success(
					`${name ?? "Team"} added: ${formatTime(added.first.startsAt)} at Table ${added.first.tableNumber}, then ${formatTime(added.second.startsAt)} at Table ${added.second.tableNumber}.`
				);
				onClose();
			})
	});
	const isPending = addTeam.isPending || isRefreshing;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add a team</DialogTitle>
					<DialogDescription>
						{teams.length
							? `The team takes the next two back-to-back free slots at different tables, starting at least ${ARRIVAL_BUFFER_MINUTES} minutes from now. Nobody else’s time changes.`
							: "No other teams have passed prescreening."}
					</DialogDescription>
				</DialogHeader>
				{teams.length ? (
					<form
						className="flex flex-col gap-6"
						noValidate
						onSubmit={form.handleSubmit(({ teamId }) => {
							if (!slots) return;
							addTeam.mutate({
								roundId: round.id,
								teamId,
								first: slots.first,
								second: slots.second
							});
						})}
					>
						<SelectField
							control={form.control}
							disabled={isPending}
							label="Team"
							name="teamId"
							options={teams.map((team) => ({
								value: team.id,
								label: team.name
							}))}
							placeholder="Choose a team"
						/>
						<div
							aria-live="polite"
							className="flex flex-col gap-1 rounded-lg bg-muted/50 p-4 text-sm"
						>
							<SlotsPreview error={preview.error} slots={slots} />
						</div>
						<DialogFooter>
							<Button disabled={isPending || !slots} type="submit">
								Add team
							</Button>
							<Button onClick={onClose} type="button" variant="outline">
								Cancel
							</Button>
						</DialogFooter>
					</form>
				) : (
					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							Close
						</Button>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
