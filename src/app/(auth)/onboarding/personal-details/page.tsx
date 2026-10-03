import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { PersonalDetailsForm } from "@/app/components/onboarding/PersonalDetailsForm";
import { getProfileDefaults } from "@/lib/validation/profile";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { isMlhSchool } from "@/server/mlh-schools";

export const metadata: Metadata = {
	title: "Personal details"
};

export default async function PersonalDetailsPage() {
	const user = await requireOnboardingStep("personalDetails");

	return (
		<>
			<AuthHeading
				description="Fill out your details."
				title="Tell us about yourself"
			>
				<OnboardingSteps current="personalDetails" />
			</AuthHeading>
			<PersonalDetailsForm
				defaultValues={getProfileDefaults({
					...user,
					schoolIsListed: isMlhSchool(user.school)
				})}
			/>
		</>
	);
}
