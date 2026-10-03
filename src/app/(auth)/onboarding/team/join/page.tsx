import { AuthHeading } from "@/app/components/auth/AuthShell";
import { JoinTeamForm } from "@/app/components/onboarding/JoinTeamForm";
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

export default async function JoinTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading
				description={
					<>
						Your teammates can share a join code with you to invite members on
						their “My Team” page.{" "}
						<Popover>
							<PopoverTrigger className="cursor-pointer font-medium text-purple-800 underline-offset-4 hover:underline">
								Where is this code?
							</PopoverTrigger>
							<PopoverContent align="start">
								<PopoverHeader>
									<PopoverTitle>Finding your invite code</PopoverTitle>
									<PopoverDescription>
										Whoever registered your team can find its 6-character code
										by selecting Invite on their “My Team” page.
									</PopoverDescription>
								</PopoverHeader>
							</PopoverContent>
						</Popover>
					</>
				}
				title="Enter your team’s Invite Code to join"
			/>
			<JoinTeamForm />
		</>
	);
}
