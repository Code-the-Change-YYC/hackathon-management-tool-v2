import { ArrowRightUpLine, DiscordFill } from "@mingcute/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import {
	getAssetUrl,
	getFields,
	getHttpUrl,
	getString
} from "@/lib/contentful";
import { getInitials } from "@/lib/names";
import type { Mentor } from "@/types/contentfulTypes";

export default function MentorCard({ mentor }: { mentor: Mentor }) {
	const fields = getFields(mentor);
	const name = getString(fields.name)?.trim() ?? "Mentor";
	const role = getString(fields.role)?.trim();
	const discordUrl = getHttpUrl(fields.discord);
	// Editors may enter a plain Discord username instead of a profile link
	const discordHandle = discordUrl
		? undefined
		: getString(fields.discord)?.trim() || undefined;
	const image = getAssetUrl(fields.image)?.trim();

	const content = (
		<>
			<div className="flex items-center gap-3">
				<Avatar className="size-12">
					{image ? (
						<AvatarImage alt={`${name} profile photo`} src={image} />
					) : null}
					<AvatarFallback>{getInitials(name)}</AvatarFallback>
				</Avatar>
				<div className="flex min-w-0 flex-1 flex-col">
					<h3 className="font-medium leading-snug">{name}</h3>
					<p className="text-muted-foreground text-xs">{role}</p>
				</div>
				{discordUrl ? (
					<ArrowRightUpLine
						aria-hidden="true"
						className="size-4 shrink-0 self-start text-muted-foreground transition-colors group-hover:text-foreground"
					/>
				) : null}
			</div>
			{discordUrl ? (
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<DiscordFill aria-hidden="true" className="size-4 shrink-0" />
					Message on Discord
				</div>
			) : null}
			{discordHandle ? (
				<div className="flex min-w-0 items-center gap-2 text-muted-foreground text-sm">
					<DiscordFill aria-hidden="true" className="size-4 shrink-0" />
					<span className="truncate">{discordHandle}</span>
				</div>
			) : null}
		</>
	);

	if (!discordUrl) {
		return (
			<div className="flex w-full flex-col gap-3 rounded-xl p-4 ring-1 ring-border">
				{content}
			</div>
		);
	}

	return (
		<a
			className="group flex w-full flex-col gap-3 rounded-xl p-4 ring-1 ring-border transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			href={discordUrl.href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{content}
		</a>
	);
}
