import Image from "next/image";
import Link from "next/link";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { DiscordLinkButton } from "@/app/components/onboarding/DiscordLinkButton";
import { buttonVariants } from "@/app/components/ui/button";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export default async function DiscordPage() {
	await requireOnboardingStep("discord");

	return (
		<>
			<AuthHeading>
				Join the Hack the Change 2026 Discord Server for live updates,
				questions, and more!
			</AuthHeading>
			<Image
				alt=""
				className="self-center"
				height={250}
				src="/images/mascot-discord.png"
				width={250}
			/>
			<div className="flex flex-col gap-4">
				<DiscordLinkButton>Join the server</DiscordLinkButton>
				<Link
					className={cn(buttonVariants({ variant: "outline" }), "w-full")}
					href={ONBOARDING_ROUTES.team}
				>
					I’ve already joined, continue
				</Link>
			</div>
		</>
	);
}
