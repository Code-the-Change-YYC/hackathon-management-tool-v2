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
import { api } from "@/trpc/react";
import type { Round, Team } from "./judgingShared";

const addTeamSchema = z.object({
	teamId: z.string({ message: "Choose a team." }).min(1, "Choose a team.")
});

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
	const addTeam = api.judgingTables.addTeam.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => {
				toast.success("Team added to the schedule.");
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
							? "The team takes two free slots at different tables. Nobody else’s time changes."
							: "No other teams have passed prescreening."}
					</DialogDescription>
				</DialogHeader>
				{teams.length ? (
					<form
						className="flex flex-col gap-6"
						noValidate
						onSubmit={form.handleSubmit(({ teamId }) =>
							addTeam.mutate({ roundId: round.id, teamId })
						)}
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
						<DialogFooter>
							<Button disabled={isPending} type="submit">
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
