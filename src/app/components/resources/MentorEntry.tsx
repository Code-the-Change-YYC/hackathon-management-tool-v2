import Image from "next/image";
import { cn } from "@/lib/utils";

type MentorEntryProps = {
	name: string;
	discord?: string;
	role: string;
	background: string;
	image?: string;
};

export default function MentorEntry({
	name,
	discord,
	role,
	background,
	image
}: MentorEntryProps) {
	return (
		<div className="group relative isolate mx-auto flex w-48 cursor-pointer flex-col items-center gap-2 rounded-md px-4 py-2 text-center outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
			<div
				aria-hidden="true"
				className={cn(
					"-top-2 pointer-events-none absolute inset-x-0 z-0 h-68 rounded-md opacity-0 shadow-lg transition-opacity duration-0 group-hover:opacity-100 group-hover:duration-150 group-focus-visible:opacity-100 group-focus-visible:duration-150",
					background
				)}
			/>

			<Image
				alt={`${name} image`}
				className="relative z-10 size-32 rounded-full object-cover"
				height={128}
				src={image ?? "/images/resources/defaultProfile.png"}
				width={128}
			/>
			<p className="relative z-10 w-full truncate font-semibold text-muted-foreground text-xs transition-colors group-hover:text-white group-focus-visible:text-white">
				{name}
			</p>

			<div className="pointer-events-none absolute inset-x-2 top-46 z-10 flex flex-col items-center gap-2 overflow-hidden px-2 text-sm text-white leading-5 opacity-0 transition-opacity duration-0 group-hover:opacity-100 group-hover:duration-150 group-focus-visible:opacity-100 group-focus-visible:duration-150">
				<div className="flex w-full min-w-0 items-center justify-center gap-2">
					<Image
						alt=""
						className="size-6 shrink-0"
						height={15}
						src="/svgs/resources/personIcon.svg"
						width={15}
					/>
					<span className="min-w-0 truncate">{role}</span>
				</div>
				{discord && (
					<div className="flex w-full min-w-0 items-center justify-center gap-2">
						<Image
							alt=""
							className="size-6 shrink-0"
							height={20}
							src="/svgs/resources/discordLogo.svg"
							width={20}
						/>
						<span className="min-w-0 truncate">{discord}</span>
					</div>
				)}
			</div>
		</div>
	);
}
