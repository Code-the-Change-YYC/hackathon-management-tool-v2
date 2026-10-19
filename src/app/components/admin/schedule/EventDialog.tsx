"use client";

import { Radio } from "@base-ui/react/radio";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
import { TextField } from "@/app/components/forms/TextField";
import {
	EVENT_TYPE_THEMES,
	EventTypeIcon
} from "@/app/components/ScheduleItem";
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
import { RadioGroup } from "@/app/components/ui/radio-group";
import { Textarea } from "@/app/components/ui/textarea";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import {
	EMPTY_EVENT_FORM,
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_TITLE_MAX_LENGTH,
	type EventFormInput,
	type EventFormValues,
	eventFormSchema
} from "@/lib/validation/event";
import { api, type RouterOutputs } from "@/trpc/react";
import { EVENT_TYPES, EventStatus } from "@/types/types";

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
	const eventType = useWatch({ control: form.control, name: "type" });

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
						<Field>
							<FieldLabel id="event-type-label">Type</FieldLabel>
							<RadioGroup
								aria-labelledby="event-type-label"
								className="grid-cols-4"
								disabled={isPending}
								onValueChange={(type) => form.setValue("type", type)}
								value={eventType}
							>
								{EVENT_TYPES.map((type) => (
									<Radio.Root
										className={cn(
											"flex min-w-0 flex-col items-center gap-1.5 rounded-lg border-2 border-transparent p-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring data-checked:font-medium data-disabled:opacity-50",
											EVENT_TYPE_THEMES[type].selectedClassName
										)}
										key={type}
										value={type}
									>
										<EventTypeIcon className="size-12 p-2.5" type={type} />
										{EVENT_TYPE_THEMES[type].label}
									</Radio.Root>
								))}
							</RadioGroup>
						</Field>
						<div className="grid gap-4 sm:grid-cols-2">
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
								label="Directions or meeting URL"
								name="navigationUrl"
								placeholder="https://"
								type="url"
							/>
						</div>
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
