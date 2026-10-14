import type { Metadata } from "next";
import Image from "next/image";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { CompleteRegistrationButton } from "@/app/components/onboarding/CompleteRegistrationButton";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { requireTeam } from "../team-guards";

export const metadata: Metadata = {
	title: "Team joined"
};

export default async function TeamJoinedPage() {
	await requireOnboardingStep("team");
	const team = await requireTeam();

	return (
		<>
			<AuthHeading
				description="Your team details will appear on your “Team” page."
				title={<>You have joined team {team.name}!</>}
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			<Image
				alt=""
				className="self-center"
				height={244}
				src="/team/mascot-celebrate.png"
				width={244}
			/>
			<AuthActions>
				<CompleteRegistrationButton />
			</AuthActions>
		</>
	);
}
