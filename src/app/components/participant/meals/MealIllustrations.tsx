import Image from "next/image";
import { cn } from "@/lib/utils";

// The pizza and cola overlap in a fixed arrangement. Sizing them as
// percentages of one box lets the pair scale as a unit without clipping.
export function MealIllustrations({ className }: { className?: string }) {
	return (
		<div
			aria-hidden="true"
			className={cn("relative aspect-402/240", className)}
		>
			<Image
				alt=""
				className="absolute top-0 left-0 h-full w-[63%] object-contain"
				height={226}
				loading="eager"
				src="/svgs/pizza.svg"
				width={238}
			/>
			<Image
				alt=""
				className="absolute top-0 right-0 h-full w-[61%] object-contain"
				height={249}
				loading="eager"
				src="/svgs/cola.svg"
				width={254}
			/>
		</div>
	);
}
