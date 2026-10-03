import { AuthHeading } from "@/app/components/auth/AuthShell";
import { TeamSituationForm } from "@/app/components/onboarding/TeamSituationForm";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "./team-guards";

export default async function TeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading title="Select the statement that describes your situation best" />
			<TeamSituationForm />
		</>
	);
}
