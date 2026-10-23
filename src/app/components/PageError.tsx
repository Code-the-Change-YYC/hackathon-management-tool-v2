"use client";

import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia
} from "@/app/components/ui/empty";

// The in-layout error state for a page whose server data failed to load.
export default function PageError({ retry }: { retry: () => void }) {
	return (
		<Empty className="min-h-[70svh]">
			<EmptyMedia>
				<Image
					alt="Our mascot puzzling over two disconnected computer cables"
					className="h-auto w-40 sm:w-52"
					height={1215}
					preload
					sizes="(min-width: 640px) 208px, 160px"
					src="/images/mascot-error.png"
					width={1215}
				/>
			</EmptyMedia>
			<EmptyHeader>
				<h1 className="font-semibold text-2xl md:text-3xl">
					Something went wrong
				</h1>
				<EmptyDescription>
					We couldn’t load this page. Give it another try.
				</EmptyDescription>
			</EmptyHeader>
			<EmptyContent>
				<Button onClick={retry} type="button">
					Try again
				</Button>
			</EmptyContent>
		</Empty>
	);
}
