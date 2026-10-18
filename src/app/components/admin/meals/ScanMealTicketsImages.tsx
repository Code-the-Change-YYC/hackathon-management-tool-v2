import Image from "next/image";

export default function ScanMealTicketsImages() {
	return (
		<div className="relative aspect-540/336 h-full">
			<Image
				alt=""
				className="absolute top-0 left-0 h-full w-auto"
				height={335}
				src="/svgs/breads.svg"
				width={335}
			/>
			<Image
				alt=""
				className="absolute top-[17%] left-[48%] h-[77%] w-auto rotate-[8.97deg]"
				height={226}
				src="/svgs/pizza.svg"
				width={238}
			/>
		</div>
	);
}
