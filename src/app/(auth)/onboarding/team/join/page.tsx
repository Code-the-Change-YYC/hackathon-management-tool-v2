import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { JoinTeamForm } from "@/app/components/onboarding/JoinTeamForm";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger
} from "@/app/components/ui/popover";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export const metadata: Metadata = {
	title: "Join a team"
};

export default async function JoinTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading
				description={
					<>
						Ask whoever registered your team for its invite code.{" "}
						<Popover>
							<PopoverTrigger className="link">
								Where is this code?
							</PopoverTrigger>
							<PopoverContent align="start">
								<PopoverHeader>
									<PopoverTitle>Finding your invite code</PopoverTitle>
									<PopoverDescription>
										Whoever registered your team can find its 6‑character invite
										code by selecting Invite on their “Team” page.
									</PopoverDescription>
								</PopoverHeader>
							</PopoverContent>
						</Popover>
					</>
				}
				title="Enter your team’s invite code to join"
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			<JoinTeamForm />
		</>
	);
}
