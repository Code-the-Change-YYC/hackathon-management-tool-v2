"use client";

import { Radio } from "@base-ui/react/radio";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
import { DateField } from "@/app/components/forms/DateField";
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
import { toDateInputValue, toTimeInputValue } from "@/lib/datetime";
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

const TIME_INPUT_CLASS_NAME =
	"appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none";

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
		date: toDateInputValue(event.startTime),
		startTime: toTimeInputValue(event.startTime),
		endTime: toTimeInputValue(event.endTime)
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
			<DialogContent className="sm:max-w-xl">
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
								className="grid-cols-2 sm:grid-cols-4"
								disabled={isPending}
								onValueChange={(type) => form.setValue("type", type)}
								value={eventType}
							>
								{EVENT_TYPES.map((type) => (
									<Radio.Root
										className={cn(
											"flex min-w-0 cursor-pointer items-center gap-1.5 rounded-lg border border-input p-1.5 pr-2 text-sm outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring data-disabled:pointer-events-none data-checked:font-medium data-disabled:opacity-50 data-checked:ring-1",
											EVENT_TYPE_THEMES[type].selectedClassName
										)}
										key={type}
										value={type}
									>
										<EventTypeIcon
											className="size-7 rounded-md p-1.5"
											type={type}
										/>
										<span className="truncate">
											{EVENT_TYPE_THEMES[type].label}
										</span>
									</Radio.Root>
								))}
							</RadioGroup>
						</Field>
						<DateField
							control={form.control}
							disabled={isPending}
							label="Date"
							name="date"
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<TextField
								className={TIME_INPUT_CLASS_NAME}
								control={form.control}
								disabled={isPending}
								label="Starts"
								name="startTime"
								type="time"
							/>
							<TextField
								className={TIME_INPUT_CLASS_NAME}
								control={form.control}
								disabled={isPending}
								label="Ends"
								name="endTime"
								type="time"
							/>
						</div>
						<div className="grid gap-4 sm:grid-cols-2">
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
								label="URL (optional)"
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
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							{event ? "Save changes" : "Add event"}
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
