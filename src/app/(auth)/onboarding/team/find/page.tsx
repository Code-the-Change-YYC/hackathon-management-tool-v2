import Image from "next/image";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { CompleteRegistrationButton } from "@/app/components/onboarding/CompleteRegistrationButton";
import { DiscordLinkButton } from "@/app/components/onboarding/DiscordLinkButton";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export default async function FindTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<div className="flex flex-col gap-4">
				<AuthHeading>
					Check out the #looking-for-a-team channel on our Discord!
				</AuthHeading>
				<p>
					Please find teammates on our Discord server or on your own before
					registering a team in the system through your dashboard!
				</p>
			</div>
			<Image
				alt=""
				className="self-center"
				height={250}
				src="/images/mascot-discord.png"
				width={250}
			/>
			<div className="flex flex-col gap-4">
				<DiscordLinkButton>
					Visit the #looking-for-a-team channel
				</DiscordLinkButton>
				<CompleteRegistrationButton variant="outline" />
			</div>
		</>
	);
}
