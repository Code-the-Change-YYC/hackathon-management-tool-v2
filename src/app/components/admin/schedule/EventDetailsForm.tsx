"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import { api } from "@/trpc/react";

type EventDetails = {
	id: string;
	title: string;
	location: string | null;
	navigationUrl: string | null;
};

export function EventDetailsForm({ event }: { event: EventDetails }) {
	const router = useRouter();
	const utils = api.useUtils();
	const [error, setError] = useState("");
	const update = api.events.updateEventDetails.useMutation({
		onSuccess: async () => {
			await utils.events.getActiveEvents.invalidate();
			router.refresh();
		}
	});
	return (
		<details className="rounded-lg border p-4">
			<summary className="cursor-pointer font-medium">
				{event.title} — location and directions
			</summary>
			<form
				className="mt-4 flex flex-col gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					const form = new FormData(e.currentTarget);
					const location = String(form.get("location") || "").trim();
					const navigationUrl = String(form.get("navigationUrl") || "").trim();
					if (
						navigationUrl &&
						!eventNavigationUrlSchema.safeParse(navigationUrl).success
					) {
						setError("Use an HTTP or HTTPS URL.");
						return;
					}
					setError("");
					update.mutate({
						id: event.id,
						location: location || null,
						navigationUrl: navigationUrl || null
					});
				}}
			>
				<FieldGroup className="sm:flex-row">
					<Field>
						<FieldLabel htmlFor={`${event.id}-location`}>Location</FieldLabel>
						<Input
							defaultValue={event.location ?? ""}
							id={`${event.id}-location`}
							maxLength={200}
							name="location"
							placeholder="Room or venue"
						/>
					</Field>
					<Field data-invalid={!!error}>
						<FieldLabel htmlFor={`${event.id}-url`}>
							Directions or meeting URL
						</FieldLabel>
						<Input
							aria-invalid={!!error}
							defaultValue={event.navigationUrl ?? ""}
							id={`${event.id}-url`}
							name="navigationUrl"
							placeholder="https://…"
							type="url"
						/>
						<FieldError>{error}</FieldError>
					</Field>
				</FieldGroup>
				<div className="flex items-center gap-3">
					<Button disabled={update.isPending} size="sm" type="submit">
						{update.isPending ? "Saving…" : "Save event details"}
					</Button>
					<output className="text-sm">
						{update.error
							? update.error.message
							: update.isSuccess
								? "Event details saved."
								: ""}
					</output>
				</div>
			</form>
		</details>
	);
}
