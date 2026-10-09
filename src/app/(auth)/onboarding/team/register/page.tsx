import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { RegisterTeamForm } from "@/app/components/onboarding/RegisterTeamForm";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export const metadata: Metadata = {
	title: "Register your team"
};

export default async function RegisterTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading
				description="Register your team so your teammates can join you."
				title="Register your team"
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			<RegisterTeamForm />
		</>
	);
}
