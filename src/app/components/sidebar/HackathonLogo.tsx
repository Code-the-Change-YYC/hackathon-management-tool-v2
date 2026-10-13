import Image from "next/image";

export default function HackathonLogo() {
	return (
		<div className="flex items-center gap-2.5">
			<Image
				alt=""
				className="size-9 shrink-0"
				height={70}
				preload
				src="/svgs/CTCLogo.svg"
				width={72}
			/>
			<span className="font-semibold text-lg leading-none tracking-tight">
				Hack the Change
				<br />
				2026
			</span>
		</div>
	);
}
