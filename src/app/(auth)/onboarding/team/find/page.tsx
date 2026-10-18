import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { CompleteRegistrationButton } from "@/app/components/onboarding/CompleteRegistrationButton";
import { DiscordLinkButton } from "@/app/components/onboarding/DiscordLinkButton";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { buttonVariants } from "@/app/components/ui/button";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";
import { redirectIfOnTeam } from "../team-guards";

export const metadata: Metadata = {
	title: "Find a team"
};

export default async function FindTeamPage() {
	await requireOnboardingStep("team");
	await redirectIfOnTeam();

	return (
		<>
			<AuthHeading
				description="Please find teammates on our Discord server or on your own before registering a team in the system through your dashboard."
				title="Check out the #looking-for-a-team channel on our Discord!"
			>
				<OnboardingSteps current="team" />
			</AuthHeading>
			<Image
				alt=""
				className="self-center"
				height={250}
				src="/images/mascot-discord.png"
				width={250}
			/>
			<AuthActions>
				<CompleteRegistrationButton />
				<DiscordLinkButton variant="outline">
					Visit #looking-for-a-team
				</DiscordLinkButton>
				<Link
					className={cn(buttonVariants({ variant: "outline" }), "w-full")}
					href={ONBOARDING_ROUTES.team}
				>
					Go back
				</Link>
			</AuthActions>
		</>
	);
}
