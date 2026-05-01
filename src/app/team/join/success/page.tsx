import Link from "next/link";
import { redirect } from "next/navigation";
import CountdownCard from "@/app/components/team/CountdownCard";

interface Props {
	searchParams: Promise<{ teamId?: string; teamName?: string }>;
}

function formatTeamId(teamId: string): string {
	return teamId.toUpperCase().split("").join("-");
}

export default async function JoinSuccessPage({ searchParams }: Props) {
	const params = await searchParams;
	const teamId = params.teamId;
	const teamName = params.teamName
		? decodeURIComponent(params.teamName)
		: undefined;

	if (!teamId || !teamName) {
		redirect("/team");
	}

	return (
		<section className="min-h-full bg-mint-green px-4 py-10 sm:px-6 sm:py-14">
			{/* Decorative sparkles */}
			<div aria-hidden="true" className="pointer-events-none select-none">
				<span className="absolute top-32 left-4 text-2xl text-awesomer-purple/20 sm:left-10 sm:text-4xl">
					✦
				</span>
				<span className="absolute top-48 right-6 text-3xl text-awesomer-purple/15 sm:right-14">
					✦
				</span>
				<span className="absolute bottom-32 left-8 text-awesomer-purple/20 text-xl sm:left-16">
					✦
				</span>
				<span className="absolute right-10 bottom-44 text-2xl text-awesomer-purple/15 sm:right-20">
					✦
				</span>
			</div>

			<div className="mx-auto max-w-sm sm:max-w-md">
				{/* Joined team header */}
				<div className="mb-6 text-center">
					<h1 className="font-extrabold text-2xl text-dark-grey leading-tight sm:text-3xl">
						It&apos;s official!
						<br />
						You joined {teamName}.
					</h1>
					<p className="mt-3 font-semibold text-dark-grey text-sm sm:text-base">
						Your Team ID is {formatTeamId(teamId)}.
					</p>
				</div>

				{/* Countdown card */}
				<CountdownCard />

				{/* Return button */}
				<div className="mt-6 flex justify-end">
					<Link
						className="rounded-full bg-awesomer-purple px-8 py-3 font-semibold text-base text-white shadow transition hover:bg-awesome-purple"
						href="/participant"
					>
						Return
					</Link>
				</div>
			</div>
		</section>
	);
}
