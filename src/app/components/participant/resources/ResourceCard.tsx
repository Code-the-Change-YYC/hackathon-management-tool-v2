import Image from "next/image";
import { Card, CardContent } from "@/app/components/ui/card";
import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import type { Resource } from "@/types/contentfulTypes";

export default function ResourceCard({ resource }: { resource: Resource }) {
	const fields = getFields(resource);
	const name = getString(fields.name)?.trim() ?? "Resource";
	const description = getString(fields.description)?.trim();
	const link = getString(fields.link)?.trim() ?? "/";
	const image = getAssetUrl(fields.image)?.trim() ?? "";
	const imageAlt = `${name} logo`;

	return (
		<Card className="@container w-full border">
			<CardContent className="flex flex-row gap-2">
				<Image
					alt={imageAlt}
					className="pointer-events-none aspect-square h-auto w-[clamp(3rem,30cqw,6rem)] shrink-0 select-none self-start object-cover"
					height={100}
					src={image}
					width={100}
				/>
				<div className="flex flex-1 flex-col justify-between">
					<div className="flex flex-col gap-2">
						<h3 className="font-medium text-lg">{name}</h3>
						<p>{description}</p>
					</div>
					<a
						className="mt-4 block text-end text-black/50 hover:text-awesomer-purple"
						href={link}
						rel="noopener noreferrer"
						target="_blank"
					>
						Visit →
					</a>
				</div>
			</CardContent>
		</Card>
	);
}
