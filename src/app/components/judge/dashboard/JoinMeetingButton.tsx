import { VideoLine } from "@mingcute/react";
import { buttonVariants } from "@/app/components/ui/button";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import { cn } from "@/lib/utils";

export function JoinMeetingButton({ href }: { href: string }) {
	const url = eventNavigationUrlSchema.safeParse(href);
	if (!url.success) return null;

	return (
		<a
			className={cn(
				buttonVariants({ size: "sm", variant: "outline-purple" }),
				"self-start"
			)}
			href={url.data}
			rel="noreferrer"
			target="_blank"
		>
			<VideoLine data-icon="inline-start" />
			Join meeting
		</a>
	);
}
