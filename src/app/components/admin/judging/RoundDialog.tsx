"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DateField } from "@/app/components/forms/DateField";
import { TextField } from "@/app/components/forms/TextField";
import { TimeField } from "@/app/components/forms/TimeField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { FieldGroup } from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { toDateInputValue, toTimeInputValue } from "@/lib/datetime";
import type { HackathonDates } from "@/lib/validation/event";
import {
	createRoundFormSchema,
	EMPTY_ROUND_FORM,
	ROUND_NAME_MAX_LENGTH,
	type RoundFormInput,
	type RoundFormValues
} from "@/lib/validation/judging";
import { api } from "@/trpc/react";
import type { Round } from "./judgingShared";

function toFormInput(round?: Round): RoundFormInput {
	if (!round) return EMPTY_ROUND_FORM;
	return {
		name: round.name,
		date: toDateInputValue(round.startTime),
		startTime: toTimeInputValue(round.startTime),
		endTime: toTimeInputValue(round.endTime)
	};
}

export function RoundDialog({
	round,
	hackathonDates,
	onClose,
	onSaved
}: {
	round?: Round;
	hackathonDates: HackathonDates | null;
	onClose: () => void;
	onSaved?: (roundId: string) => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<RoundFormInput, unknown, RoundFormValues>({
		defaultValues: toFormInput(round),
		resolver: zodResolver(createRoundFormSchema(hackathonDates))
	});
	const callbacks = {
		onSuccess: (saved?: { id: string }) =>
			refresh(() => {
				toast.success(round ? "Round updated." : "Round added.");
				if (saved) onSaved?.(saved.id);
				onClose();
			}),
		onError: (error: { message: string }) => toast.error(error.message)
	};
	const createRound = api.judgingRounds.create.useMutation(callbacks);
	const updateRound = api.judgingRounds.update.useMutation(callbacks);
	const isPending =
		createRound.isPending || updateRound.isPending || isRefreshing;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{round ? "Edit round" : "Add round"}</DialogTitle>
					<DialogDescription>
						The schedule must fit between the start and end.
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						round
							? updateRound.mutate({ id: round.id, ...values })
							: createRound.mutate(values)
					)}
				>
					<FieldGroup className="gap-4">
						<TextField
							control={form.control}
							disabled={isPending}
							label="Name"
							maxLength={ROUND_NAME_MAX_LENGTH}
							name="name"
							placeholder="Panel round"
						/>
						<DateField
							control={form.control}
							disabled={isPending}
							label="Date"
							max={hackathonDates?.end}
							min={hackathonDates?.start}
							name="date"
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<TimeField
								control={form.control}
								disabled={isPending}
								label="Starts"
								name="startTime"
							/>
							<TimeField
								control={form.control}
								disabled={isPending}
								label="Ends"
								name="endTime"
							/>
						</div>
					</FieldGroup>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{round ? "Save changes" : "Add round"}
						</Button>
						<Button onClick={onClose} type="button" variant="outline">
							Cancel
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
