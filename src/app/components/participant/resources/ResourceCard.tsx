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
		<Card className="w-full border">
			<CardContent className="flex size-full flex-row gap-2">
				<Image
					alt={imageAlt}
					className="pointer-events-none aspect-square size-24 shrink-0 select-none"
					height={100}
					src={image}
					width={100}
				/>
				<div className="flex size-full flex-1 flex-col justify-between">
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
