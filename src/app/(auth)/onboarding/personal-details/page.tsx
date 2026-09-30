import { AuthHeading } from "@/app/components/auth/AuthShell";
import { PersonalDetailsForm } from "@/app/components/onboarding/PersonalDetailsForm";
import { getProfileDefaults } from "@/lib/validation/profile";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export default async function PersonalDetailsPage() {
	const user = await requireOnboardingStep("personalDetails");

	return (
		<>
			<AuthHeading>Fill out your personal profile</AuthHeading>
			<PersonalDetailsForm defaultValues={getProfileDefaults(user)} />
		</>
	);
}
