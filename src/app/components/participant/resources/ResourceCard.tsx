import { ArrowRightUpLine } from "@mingcute/react";
import Image from "next/image";
import { getFields, getString } from "@/lib/contentful";
import type { Resource } from "@/types/contentfulTypes";
import { getResourceUrl } from "./data/resources";

function getFaviconUrl(hostname: string): string {
	return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
}

export default function ResourceCard({ resource }: { resource: Resource }) {
	const fields = getFields(resource);
	const name = getString(fields.name)?.trim() ?? "Resource";
	const description = getString(fields.description)?.trim();
	const url = getResourceUrl(resource);
	if (!url) {
		return null;
	}

	const hostname = url.hostname.replace(/^www\./, "");

	return (
		<a
			className="group flex w-full flex-col gap-3 rounded-xl p-4 ring-1 ring-border transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
			href={url.href}
			rel="noopener noreferrer"
			target="_blank"
		>
			<div className="flex items-center gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
					<Image
						alt=""
						className="size-5"
						height={20}
						src={getFaviconUrl(url.hostname)}
						unoptimized
						width={20}
					/>
				</div>
				<div className="flex min-w-0 flex-1 flex-col">
					<h3 className="font-medium leading-snug">{name}</h3>
					<p className="truncate text-muted-foreground text-xs">{hostname}</p>
				</div>
				<ArrowRightUpLine
					aria-hidden="true"
					className="size-4 shrink-0 self-start text-muted-foreground transition-colors group-hover:text-foreground"
				/>
			</div>
			<p className="text-muted-foreground text-sm">{description}</p>
		</a>
	);
}
