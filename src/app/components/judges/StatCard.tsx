import Image from "next/image";

interface StatCardProps {
	stat: number;
	caption: string;
	icon: string;
}

export default function StatCard({ stat, caption, icon }: StatCardProps) {
	return (
		<div className="flex min-h-44 w-full flex-col items-center rounded-lg bg-white px-4 py-5 text-center shadow-md">
			{/* These cards use SVG paths from public so the icons stay easy to swap. */}
			<div className="flex size-11 items-center justify-center rounded-full bg-pastel-pink">
				<Image
					alt=""
					className="size-7 object-contain"
					height={28}
					src={icon}
					width={28}
				/>
			</div>
			<p className="mt-3 font-bold text-4xl text-dark-grey italic leading-none sm:text-5xl">
				{stat}
			</p>
			<p className="mt-2 max-w-32 text-center text-dark-grey text-xs leading-tight sm:text-sm">
				{caption}
			</p>
		</div>
	);
}
