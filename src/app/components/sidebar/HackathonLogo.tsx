import Image from "next/image";
import { EVENT_NAME, EVENT_YEAR } from "@/lib/constants";

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
				{EVENT_NAME}
				<br />
				{EVENT_YEAR}
			</span>
		</div>
	);
}
