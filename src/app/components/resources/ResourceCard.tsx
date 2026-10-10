import Image from "next/image";
import { Card, CardContent } from "../ui/card";

interface ResourceCardProps {
	name: string;
	imgSrc: string;
	description: string;
	link: string;
}

export default function ResourceCard({
	name,
	imgSrc,
	description,
	link
}: ResourceCardProps) {
	return (
		<Card className="w-full p-4">
			<CardContent className="flex size-full flex-row gap-2">
				<Image
					alt={`${name} image`}
					className="pointer-events-none shrink-0"
					height={100}
					src={imgSrc}
					width={100}
				/>
				<div className="flex size-full flex-1 flex-col justify-between">
					<div className="flex flex-col gap-2">
						<h1 className="font-medium text-lg">{name}</h1>
						<p>{description}</p>
					</div>
					<a
						className="mt-4 block text-end text-black/50 hover:text-awesomer-purple"
						href={link}
						rel="noopener noreffer"
						target="_blank"
					>
						Visit →
					</a>
				</div>
			</CardContent>
		</Card>
	);
}
