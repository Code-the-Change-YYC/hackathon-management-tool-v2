import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { FoodPreferencesForm } from "@/app/components/onboarding/FoodPreferencesForm";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { toDietaryRestrictions } from "@/lib/validation/signup";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "Food preferences"
};

export default async function FoodPreferencesPage() {
	const user = await requireOnboardingStep("foodPreferences");

	return (
		<>
			<AuthHeading
				description="Let us know if you have any allergies or dietary restrictions so we can accommodate you."
				title="Food preferences"
			>
				<OnboardingSteps current="foodPreferences" />
			</AuthHeading>
			<FoodPreferencesForm
				defaultValues={{
					wantsFood: user.wantsFood ?? false,
					dietaryRestrictions: toDietaryRestrictions(user.dietaryRestrictions)
				}}
			/>
		</>
	);
}
