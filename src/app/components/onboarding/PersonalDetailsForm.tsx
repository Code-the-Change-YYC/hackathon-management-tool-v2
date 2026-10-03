"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ComboboxField } from "@/app/components/forms/ComboboxField";
import { PhoneField } from "@/app/components/forms/PhoneField";
import { SchoolField } from "@/app/components/forms/SchoolField";
import { SelectField } from "@/app/components/forms/SelectField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { getCountryFlag } from "@/app/components/ui/phone-input";
import { Spinner } from "@/app/components/ui/spinner";
import { COUNTRY_CODES, getCountryName } from "@/lib/countries";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import {
	AGE_OPTIONS,
	asksForMajor,
	getSchoolName,
	LEVEL_OF_STUDY_OPTIONS,
	NAME_MAX_LENGTH,
	PROGRAM_OPTIONS,
	type ProfileInput,
	type ProfileValues,
	profileFormSchema
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
		resolver: zodResolver(profileFormSchema)
	});
	const [school, otherSchool] = useWatch({
		control: form.control,
		name: ["school", "otherSchool"]
	});

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
				<div className="grid @sm/field-group:grid-cols-2 gap-6 @sm/field-group:gap-x-4">
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
				</div>
				<SelectField
					control={form.control}
					disabled={isBusy}
					label="Age"
					name="age"
					options={AGE_OPTIONS}
					placeholder="Select your age"
				/>
				<PhoneField
					control={form.control}
					disabled={isBusy}
					label="Phone number"
					name="phoneNumber"
					placeholder="Enter your phone number"
				/>
				<ComboboxField
					control={form.control}
					disabled={isBusy}
					emptyMessage="No countries found"
					itemIcon={getCountryFlag}
					items={COUNTRY_CODES}
					itemToLabel={getCountryName}
					label="Country of residence"
					name="countryOfResidence"
					placeholder="Search for your country"
				/>
				<SchoolField
					control={form.control}
					disabled={isBusy}
					label="Which institution are you attending?"
				/>
				<SelectField
					control={form.control}
					disabled={isBusy}
					label="What is your current level of study?"
					name="levelOfStudy"
					options={LEVEL_OF_STUDY_OPTIONS}
					placeholder="Select your level of study"
				/>
				{asksForMajor(getSchoolName(school, otherSchool)) && (
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
