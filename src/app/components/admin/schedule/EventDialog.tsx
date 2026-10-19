"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
import { SelectField } from "@/app/components/forms/SelectField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Textarea } from "@/app/components/ui/textarea";
import { toDateTimeLocalValue } from "@/lib/datetime";
import {
	EMPTY_EVENT_FORM,
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_TITLE_MAX_LENGTH,
	EVENT_TYPE_OPTIONS,
	type EventFormInput,
	type EventFormValues,
	eventFormSchema
} from "@/lib/validation/event";
import { api, type RouterOutputs } from "@/trpc/react";
import { EventStatus } from "@/types/types";

export type AdminEvent = RouterOutputs["events"]["getAllEvents"][number];

function toFormInput(event?: AdminEvent): EventFormInput {
	if (!event) return EMPTY_EVENT_FORM;
	return {
		title: event.title,
		description: event.description,
		type: event.type,
		published: event.status === EventStatus.ACTIVE,
		location: event.location ?? "",
		navigationUrl: event.navigationUrl ?? "",
		startTime: toDateTimeLocalValue(event.startTime),
		endTime: toDateTimeLocalValue(event.endTime)
	};
}

export function EventDialog({
	event,
	onClose
}: {
	event?: AdminEvent;
	onClose: () => void;
}) {
	const router = useRouter();
	const form = useForm<EventFormInput, unknown, EventFormValues>({
		defaultValues: toFormInput(event),
		resolver: zodResolver(eventFormSchema)
	});
	const callbacks = {
		onSuccess: () => {
			toast.success(event ? "Event updated." : "Event added.");
			router.refresh();
			onClose();
		},
		onError: () => toast.error("We couldn’t save this event. Please try again.")
	};
	const addEvent = api.events.addEvent.useMutation(callbacks);
	const updateEvent = api.events.updateEvent.useMutation(callbacks);
	const isPending = addEvent.isPending || updateEvent.isPending;
	const descriptionError = form.formState.errors.description;

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>{event ? "Edit event" : "Add event"}</DialogTitle>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit((values) =>
						event
							? updateEvent.mutate({ id: event.id, ...values })
							: addEvent.mutate(values)
					)}
				>
					<FieldGroup className="gap-4">
						<TextField
							control={form.control}
							disabled={isPending}
							label="Title"
							maxLength={EVENT_TITLE_MAX_LENGTH}
							name="title"
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<SelectField
								control={form.control}
								disabled={isPending}
								label="Type"
								name="type"
								options={EVENT_TYPE_OPTIONS}
							/>
							<TextField
								control={form.control}
								disabled={isPending}
								label="Location"
								maxLength={EVENT_LOCATION_MAX_LENGTH}
								name="location"
								placeholder="Room or venue"
							/>
							<TextField
								control={form.control}
								disabled={isPending}
								label="Starts"
								name="startTime"
								type="datetime-local"
							/>
							<TextField
								control={form.control}
								disabled={isPending}
								label="Ends"
								name="endTime"
								type="datetime-local"
							/>
						</div>
						<TextField
							control={form.control}
							disabled={isPending}
							label="Directions or meeting URL"
							name="navigationUrl"
							placeholder="https://"
							type="url"
						/>
						<Field data-invalid={Boolean(descriptionError)}>
							<FieldLabel htmlFor="event-description">Description</FieldLabel>
							<Textarea
								aria-invalid={Boolean(descriptionError)}
								disabled={isPending}
								id="event-description"
								maxLength={EVENT_DESCRIPTION_MAX_LENGTH}
								{...form.register("description")}
							/>
							<FieldError errors={[descriptionError]} />
						</Field>
						<CheckboxField
							control={form.control}
							disabled={isPending}
							name="published"
						>
							Show on the participant schedule
						</CheckboxField>
					</FieldGroup>
					<DialogFooter className="sm:flex-row">
						<Button onClick={onClose} type="button" variant="ghost">
							Cancel
						</Button>
						<Button disabled={isPending} type="submit">
							{event ? "Save changes" : "Add event"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
