import Link from "next/link";
import { redirect } from "next/navigation";
import CountdownCard from "@/app/components/team/CountdownCard";

interface Props {
	searchParams: Promise<{ teamId?: string }>;
}

function formatTeamId(teamId: string): string {
	return teamId.toUpperCase().split("").join("-");
}

export default async function RegisterSuccessPage({ searchParams }: Props) {
	const params = await searchParams;
	const teamId = params.teamId;

	if (!teamId) {
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
				{/* Team ID header */}
				<div className="mb-6 text-center">
					<h1 className="font-extrabold text-2xl text-dark-grey leading-tight sm:text-3xl">
						Your Team ID is
					</h1>
					<p className="mt-1 font-extrabold text-3xl text-dark-grey sm:text-4xl">
						{formatTeamId(teamId)}.
					</p>
					<p className="mt-3 text-dark-grey/80 text-sm sm:text-base">
						Provide this ID to all team members.
						<br />
						Each member <strong>must</strong> submit this Team ID
						<br />
						to <strong>Join Existing Team</strong> to officially join.
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
