"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { ComboboxField } from "@/app/components/forms/ComboboxField";
import { NumberField } from "@/app/components/forms/NumberField";
import { PhoneField } from "@/app/components/forms/PhoneField";
import { SchoolField } from "@/app/components/forms/SchoolField";
import { SelectField } from "@/app/components/forms/SelectField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { getCountryFlag } from "@/app/components/ui/phone-input";
import { Spinner } from "@/app/components/ui/spinner";
import { COUNTRY_CODES, getCountryName } from "@/lib/countries";
import {
	asksForMajor,
	getProfileDefaults,
	getSchoolName,
	LEVEL_OF_STUDY_OPTIONS,
	MAX_AGE,
	MIN_AGE,
	NAME_MAX_LENGTH,
	PROGRAM_OPTIONS,
	type ProfileInput,
	type ProfileValues,
	profileFormSchema
} from "@/lib/validation/profile";
import { api } from "@/trpc/react";
import { PersonalInformationCard } from "./PersonalInformationCard";
import type { Profile } from "./types";

const FORM_ID = "personal-information-form";

export function PersonalInformationForm({
	profile,
	onDone
}: {
	profile: Profile;
	onDone: () => void;
}) {
	const router = useRouter();
	const [isRefreshing, startTransition] = useTransition();
	const updateProfile = api.users.updateProfile.useMutation();
	const form = useForm<ProfileInput, unknown, ProfileValues>({
		defaultValues: getProfileDefaults(profile),
		resolver: zodResolver(profileFormSchema)
	});
	const { isDirty } = useFormState({ control: form.control });
	const [school, otherSchool] = useWatch({
		control: form.control,
		name: ["school", "otherSchool"]
	});
	const isSaving = updateProfile.isPending || isRefreshing;

	function cancel() {
		onDone();
		if (isDirty) toast("Cancelled changes");
	}

	function save(values: ProfileValues) {
		if (!isDirty) {
			onDone();
			return;
		}

		updateProfile.mutate(values, {
			onError: () => {
				toast.error("We couldn't update your profile. Try again.");
			},
			onSuccess: () => {
				toast.success("Profile updated");
				// Leave edit mode once the refreshed profile is ready so nothing flickers.
				startTransition(() => {
					router.refresh();
					onDone();
				});
			}
		});
	}

	return (
		<PersonalInformationCard
			actions={
				<>
					<Button
						disabled={isSaving}
						onClick={cancel}
						size="sm"
						type="button"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button disabled={isSaving} form={FORM_ID} size="sm" type="submit">
						{isSaving && <Spinner data-icon="inline-start" />}
						Save changes
					</Button>
				</>
			}
		>
			<form id={FORM_ID} noValidate onSubmit={form.handleSubmit(save)}>
				<FieldGroup className="grid gap-6 sm:grid-cols-2 sm:gap-x-12">
					<TextField
						autoComplete="given-name"
						control={form.control}
						disabled={isSaving}
						label="First name"
						maxLength={NAME_MAX_LENGTH}
						name="firstName"
					/>
					<TextField
						autoComplete="family-name"
						control={form.control}
						disabled={isSaving}
						label="Last name"
						maxLength={NAME_MAX_LENGTH}
						name="lastName"
					/>
					<NumberField
						control={form.control}
						disabled={isSaving}
						label="Age"
						max={MAX_AGE}
						min={MIN_AGE}
						name="age"
						placeholder="Enter your age"
					/>
					<PhoneField
						control={form.control}
						disabled={isSaving}
						label="Phone number"
						name="phoneNumber"
						placeholder="Enter your phone number"
					/>
					<ComboboxField
						control={form.control}
						disabled={isSaving}
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
						disabled={isSaving}
						label="Institution"
					/>
					<SelectField
						control={form.control}
						disabled={isSaving}
						label="Level of study"
						name="levelOfStudy"
						options={LEVEL_OF_STUDY_OPTIONS}
						placeholder="Select your level of study"
					/>
					{asksForMajor(getSchoolName(school, otherSchool)) && (
						<SelectField
							control={form.control}
							disabled={isSaving}
							label="Major"
							name="program"
							options={PROGRAM_OPTIONS}
							placeholder="Select a major"
						/>
					)}
				</FieldGroup>
			</form>
		</PersonalInformationCard>
	);
}
