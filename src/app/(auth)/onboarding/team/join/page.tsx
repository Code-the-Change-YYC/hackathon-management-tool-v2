import { AuthHeading } from "@/app/components/auth/AuthShell";
import { JoinTeamForm } from "@/app/components/onboarding/JoinTeamForm";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export default async function JoinTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading>Enter your team’s Invite Code to join</AuthHeading>
			<JoinTeamForm />
		</>
	);
}
