import { AuthHeading } from "@/app/components/auth/AuthShell";
import { RegisterTeamForm } from "@/app/components/onboarding/RegisterTeamForm";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export default async function RegisterTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading>Register your team</AuthHeading>
			<RegisterTeamForm />
		</>
	);
}
