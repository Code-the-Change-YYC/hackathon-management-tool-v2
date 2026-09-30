"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
	SelectField,
	type SelectOption
} from "@/app/components/forms/SelectField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import {
	type FoodPreferences,
	foodPreferencesSchema
} from "@/lib/validation/signup";
import { api } from "@/trpc/react";
import { DietaryRestrictionsField } from "./DietaryRestrictionsField";

const MEAL_OPTIONS: SelectOption<boolean>[] = [
	{ value: true, label: "Yes" },
	{ value: false, label: "No" }
];

export function FoodPreferencesForm({
	defaultValues
}: {
	defaultValues: Partial<FoodPreferences>;
}) {
	const router = useRouter();
	const form = useForm<FoodPreferences>({
		defaultValues,
		resolver: zodResolver(foodPreferencesSchema)
	});

	const savePreferences = api.users.updateFoodPreferences.useMutation({
		onSuccess: () => router.push(ONBOARDING_ROUTES.discord),
		onError: () =>
			toast.error("We couldn't save your food preferences. Please try again.")
	});
	// Stay busy after success while the next step loads.
	const isBusy = savePreferences.isPending || savePreferences.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => savePreferences.mutate(values))}
		>
			<FieldGroup className="gap-6">
				<SelectField
					control={form.control}
					disabled={isBusy}
					label="Do you want to be provided free meals at the hackathon?"
					name="wantsFood"
					options={MEAL_OPTIONS}
					placeholder="Please select an option"
				/>
				<DietaryRestrictionsField control={form.control} disabled={isBusy} />
			</FieldGroup>
			<Button className="w-full" disabled={isBusy} type="submit">
				{isBusy && <Spinner data-icon="inline-start" />}
				Continue
			</Button>
		</form>
	);
}
