import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { TeamSituationForm } from "@/app/components/onboarding/TeamSituationForm";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "./team-guards";

export const metadata: Metadata = {
	title: "Your team"
};

export default async function TeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading
				description="Select the statement that describes your situation best."
				title="Form your team"
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			<TeamSituationForm />
		</>
	);
}
