import Link from "next/link";
import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import type { WinnerCardProps } from "@/types/landingPage";

const AWARD_COLORS = [
	"bg-strawberry-red",
	"bg-awesome-purple",
	"bg-dark-pink",
	"bg-dark-green",
	"bg-medium-pink"
] as const;

export default function WinnerCard({ winner, index, total }: WinnerCardProps) {
	const scaleValue = (100 - 10 * Math.abs(index - Math.floor(total / 2))) / 100;
	const fields = getFields(winner);
	const projectName = getString(fields.projectName) ?? "";
	const awardName = getString(fields.awardName)?.trim() ?? "";
	const image = getAssetUrl(fields.projectImage);
	const link = getString(fields.link)?.trim();
	const awardColor =
		AWARD_COLORS[index % AWARD_COLORS.length] ?? "bg-strawberry-red";
	const projectDescription = getString(fields.projectDescription)?.trim() ?? "";

	const cardContent = (
		<div className="absolute inset-0 flex flex-col justify-end rounded-[30px] bg-linear-to-b from-black/40 via-black/0 to-black/80 py-7">
			<div
				className={`${awardColor} mb-2.5 w-48 rounded-tr-20 rounded-br-20 px-2.5 py-2 shadow-[0px_4px_4.8px_0px_rgba(0,0,0,0.25)]`}
			>
				<span className="font-bold text-white text-xl">
					{awardName ?? "Winner"}
				</span>
			</div>

			<div className="px-2.5">
				<h2 className="font-semibold text-3xl text-white leading-8 [text-shadow:0px_4px_4px_rgb(0_0_0/0.25)]">
					{projectName}
				</h2>
			</div>
			<div className="px-2.5">
				<h2 className="line-clamp-2 text-sm text-white">
					{projectDescription}
				</h2>
			</div>
		</div>
	);

	return (
		<li
			className="hover:-translate-y-4 relative flex min-w-40 flex-1 snap-center rounded-[30px] bg-center bg-cover bg-no-repeat shadow-[0px_4px_81px_0px_rgba(0,0,0,0.25)] transition-transform duration-300 hover:outline-4 hover:outline-awesomer-purple"
			style={{
				aspectRatio: "9/18",
				...(image ? { backgroundImage: `url(${image})` } : {}),
				transform: `scale(${scaleValue})`
			}}
		>
			{link ? (
				<Link
					className="absolute inset-0"
					href={link}
					rel="noopener noreferrer"
					target="_blank"
				>
					{cardContent}
				</Link>
			) : (
				<div className="absolute inset-0">{cardContent}</div>
			)}
		</li>
	);
}
