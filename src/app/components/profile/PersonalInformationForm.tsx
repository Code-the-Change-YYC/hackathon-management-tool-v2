"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { SelectField } from "@/app/components/forms/SelectField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import {
	asksForMajor,
	getProfileDefaults,
	NAME_MAX_LENGTH,
	PROGRAM_OPTIONS,
	type ProfileInput,
	type ProfileValues,
	profileSchema,
	SCHOOL_OPTIONS
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
		resolver: zodResolver(profileSchema)
	});
	const { isDirty } = useFormState({ control: form.control });
	const school = useWatch({ control: form.control, name: "school" });
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
					<SelectField
						control={form.control}
						disabled={isSaving}
						label="Institution"
						name="school"
						options={SCHOOL_OPTIONS}
						placeholder="Select an institution"
					/>
					{asksForMajor(school) && (
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
