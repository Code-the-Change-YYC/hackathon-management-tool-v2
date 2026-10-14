import type { Metadata } from "next";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { CompleteRegistrationButton } from "@/app/components/onboarding/CompleteRegistrationButton";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { TeamCodeDisplay } from "@/app/components/onboarding/TeamCodeDisplay";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { requireTeam } from "../team-guards";

export const metadata: Metadata = {
	title: "Invite your team"
};

export default async function TeamRegisteredPage() {
	await requireOnboardingStep("team");
	const team = await requireTeam();

	return (
		<>
			<AuthHeading
				description="Share this code with your teammates so they can join your team! You can always find this code by inviting teammates on the “Team” page."
				title="Invite others to join your team!"
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			{team.teamCode && <TeamCodeDisplay code={team.teamCode} />}
			<AuthActions>
				<CompleteRegistrationButton />
			</AuthActions>
		</>
	);
}
