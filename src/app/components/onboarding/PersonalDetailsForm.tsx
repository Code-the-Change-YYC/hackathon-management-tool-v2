"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { SelectField } from "@/app/components/forms/SelectField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import {
	asksForMajor,
	NAME_MAX_LENGTH,
	PROGRAM_OPTIONS,
	type ProfileInput,
	type ProfileValues,
	profileSchema,
	SCHOOL_OPTIONS
} from "@/lib/validation/profile";
import { api } from "@/trpc/react";

export function PersonalDetailsForm({
	defaultValues
}: {
	defaultValues: Partial<ProfileInput>;
}) {
	const router = useRouter();
	const form = useForm<ProfileInput, unknown, ProfileValues>({
		defaultValues,
		resolver: zodResolver(profileSchema)
	});
	const school = useWatch({ control: form.control, name: "school" });

	const saveDetails = api.users.updateProfile.useMutation({
		onSuccess: () => router.push(ONBOARDING_ROUTES.foodPreferences),
		onError: () =>
			toast.error("We couldn't save your details. Please try again.")
	});
	// Stay busy after success while the next step loads.
	const isBusy = saveDetails.isPending || saveDetails.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => saveDetails.mutate(values))}
		>
			<FieldGroup className="gap-6">
				<TextField
					autoComplete="given-name"
					control={form.control}
					disabled={isBusy}
					label="First name"
					maxLength={NAME_MAX_LENGTH}
					name="firstName"
				/>
				<TextField
					autoComplete="family-name"
					control={form.control}
					disabled={isBusy}
					label="Last name"
					maxLength={NAME_MAX_LENGTH}
					name="lastName"
				/>
				<SelectField
					control={form.control}
					disabled={isBusy}
					label="Which institution are you attending?"
					name="school"
					options={SCHOOL_OPTIONS}
					placeholder="Select an institution"
				/>
				{asksForMajor(school) && (
					<SelectField
						control={form.control}
						disabled={isBusy}
						label="What is your major?*"
						name="program"
						options={PROGRAM_OPTIONS}
						placeholder="Select a major"
					/>
				)}
			</FieldGroup>
			<Button className="w-full" disabled={isBusy} type="submit">
				{isBusy && <Spinner data-icon="inline-start" />}
				Continue
			</Button>
		</form>
	);
}
