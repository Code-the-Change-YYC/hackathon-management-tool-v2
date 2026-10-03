import Image from "next/image";
import Link from "next/link";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { DiscordLinkButton } from "@/app/components/onboarding/DiscordLinkButton";
import { buttonVariants } from "@/app/components/ui/button";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export default async function DiscordPage() {
	await requireOnboardingStep("discord");

	return (
		<>
			<AuthHeading title="Join the Hack the Change 2026 Discord Server for live updates, questions, and more!" />
			<Image
				alt=""
				className="self-center"
				height={250}
				src="/images/mascot-discord.png"
				width={250}
			/>
			<AuthActions>
				<DiscordLinkButton>Join the server</DiscordLinkButton>
				<Link
					className={cn(buttonVariants({ variant: "outline" }), "w-full")}
					href={ONBOARDING_ROUTES.team}
				>
					I’ve already joined, continue
				</Link>
			</AuthActions>
		</>
	);
}
