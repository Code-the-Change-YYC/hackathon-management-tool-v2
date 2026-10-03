import { AuthHeading } from "@/app/components/auth/AuthShell";
import { FoodPreferencesForm } from "@/app/components/onboarding/FoodPreferencesForm";
import { toDietaryRestrictions } from "@/lib/validation/signup";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export default async function FoodPreferencesPage() {
	const user = await requireOnboardingStep("foodPreferences");

	return (
		<>
			<AuthHeading title="Fill out your food preferences" />
			<FoodPreferencesForm
				defaultValues={{
					wantsFood: user.wantsFood ?? false,
					dietaryRestrictions: toDietaryRestrictions(user.dietaryRestrictions)
				}}
			/>
		</>
	);
}
