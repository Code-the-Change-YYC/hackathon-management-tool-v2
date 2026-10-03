import Image from "next/image";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { CompleteRegistrationButton } from "@/app/components/onboarding/CompleteRegistrationButton";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { requireTeam } from "../team-guards";

export default async function TeamJoinedPage() {
	await requireOnboardingStep("team");
	const team = await requireTeam();

	return (
		<>
			<AuthHeading
				description="Your team details will appear on your “My Team” page."
				title={<>You have joined team {team.name}!</>}
			/>
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
