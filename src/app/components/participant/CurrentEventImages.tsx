import Image from "next/image";

export default function CurrentEventImages() {
	return (
		<div className="relative aspect-540/336 h-full">
			<Image
				alt=""
				className="absolute top-0 left-0 h-[93%] w-auto rotate-[-4deg]"
				height={314}
				loading="eager"
				src="/images/participant-shared/trophy.png"
				width={314}
			/>
			<Image
				alt=""
				className="absolute top-[12%] left-[52%] h-[77%] w-auto rotate-[9deg]"
				height={260}
				src="/images/participant-shared/gift.png"
				width={260}
			/>
		</div>
	);
}
