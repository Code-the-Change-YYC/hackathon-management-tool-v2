import Image from "next/image";

export default function CheckInImages() {
	return (
		<div className="relative aspect-540/336 h-full">
			<Image
				alt=""
				// Starts below the top of the shorter wide banner and bleeds off its bottom
				className="-top-[2%] absolute @4xl:top-[25%] @4xl:left-[46%] left-[33%] @4xl:h-[62%] h-[88%] w-auto rotate-6"
				height={290}
				loading="eager"
				src="/images/participant-shared/clipboard.webp"
				width={258}
			/>
		</div>
	);
}
