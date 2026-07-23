import Link from "next/link";
import type { WinnerCardProps } from "@/types/landingPage";

export default function WinnerCard({ winner, index, total }: WinnerCardProps) {
	const scaleValue = (100 - 10 * Math.abs(index - Math.floor(total / 2))) / 100;

	return (
		<li
			className="hover:-translate-y-4 relative flex min-w-40 flex-1 cursor-pointer snap-center rounded-[30px] bg-center bg-cover bg-no-repeat shadow-[0px_4px_81px_0px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:outline hover:outline-4 hover:outline-awesomer-purple"
			style={{
				aspectRatio: "9/18",
				backgroundImage: `url(${winner.image})`,
				transform: `scale(${scaleValue})`
			}}
		>
			<Link
				className="absolute inset-0 flex flex-col justify-end rounded-[30px] bg-linear-to-b from-black/40 via-black/0 to-black/80 py-7"
				href={winner.link}
				target="_blank"
			>
				<div
					className={`${winner.awardColor} mb-2.5 w-48 rounded-tr-20 rounded-br-20 px-2.5 py-2 shadow-[0px_4px_4.8px_0px_rgba(0,0,0,0.25)]`}
				>
					<span className="font-bold text-white text-xl">
						{winner.awardName}
					</span>
				</div>

				<div className="px-2.5">
					<h2 className="font-semibold text-3xl text-white leading-8 [text-shadow:0px_4px_4px_rgb(0_0_0/0.25)]">
						{winner.projectName}
					</h2>
				</div>
			</Link>
		</li>
	);
}
