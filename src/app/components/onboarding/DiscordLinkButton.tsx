import { ExternalLinkLine } from "@mingcute/react";
import { buttonVariants } from "@/app/components/ui/button";
import { DISCORD_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function DiscordLinkButton({
	children,
	variant = "default"
}: {
	children: React.ReactNode;
	variant?: "default" | "outline";
}) {
	return (
		<a
			className={cn(buttonVariants({ variant }), "w-full")}
			href={DISCORD_URL}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
			<ExternalLinkLine data-icon="inline-end" />
			<span className="sr-only">(opens in a new tab)</span>
		</a>
	);
}
