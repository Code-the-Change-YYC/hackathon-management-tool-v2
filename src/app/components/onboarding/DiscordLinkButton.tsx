import { ArrowRightUpLine } from "@mingcute/react";
import { buttonVariants } from "@/app/components/ui/button";
import { DISCORD_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DiscordLinkButton({ children }: { children: React.ReactNode }) {
	return (
		<a
			className={cn(buttonVariants(), "w-full")}
			href={DISCORD_URL}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
			<ArrowRightUpLine data-icon="inline-end" />
			<span className="sr-only">(opens in a new tab)</span>
		</a>
	);
}
