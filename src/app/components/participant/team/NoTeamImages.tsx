import Image from "next/image";

export default function NoTeamImages() {
	return (
		<div className="flex h-full items-end">
			<Image
				alt=""
				className="h-full w-auto"
				height={160}
				loading="eager"
				src="/team/mascot-celebrate.png"
				width={160}
			/>
			<Image
				alt=""
				className="-ml-[15%] h-full w-auto"
				height={160}
				loading="eager"
				src="/team/mascot-flag.png"
				width={160}
			/>
		</div>
	);
}
