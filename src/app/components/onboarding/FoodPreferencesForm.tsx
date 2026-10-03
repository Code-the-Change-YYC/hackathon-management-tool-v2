"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
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
		onSuccess: () => router.push(ONBOARDING_ROUTES.mlhPolicies),
		onError: () =>
			toast.error("We couldn’t save your food preferences. Please try again.")
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
				<CheckboxField
					control={form.control}
					disabled={isBusy}
					name="wantsFood"
				>
					I want to be provided free meals at the hackathon
				</CheckboxField>
				<DietaryRestrictionsField control={form.control} disabled={isBusy} />
			</FieldGroup>
			<AuthActions>
				<Button className="w-full" disabled={isBusy} type="submit">
					{isBusy && <Spinner data-icon="inline-start" />}
					Continue
				</Button>
			</AuthActions>
		</form>
	);
}
