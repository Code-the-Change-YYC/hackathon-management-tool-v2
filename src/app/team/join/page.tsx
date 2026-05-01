import JoinTeamForm from "@/app/components/team/JoinTeamForm";

export default function JoinTeamPage() {
	return (
		<section className="min-h-full bg-awesomer-purple px-4 py-8 sm:px-6 sm:py-12">
			<h1 className="mb-6 text-center font-extrabold text-3xl text-white sm:text-4xl md:text-5xl">
				Register for Hack the Change 2026
			</h1>

			<div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
				<div className="mb-6">
					<div className="mb-1 flex items-center gap-2">
						<span className="h-1 w-6 rounded-full bg-awesomer-purple" />
						<h2 className="font-bold text-dark-grey text-lg sm:text-xl">
							Join existing team
						</h2>
					</div>
					<div className="ml-8 h-0.5 w-24 rounded-full bg-awesomer-purple" />
				</div>

				<ol className="mb-6 space-y-2 text-dark-grey text-sm sm:text-base">
					<li className="flex gap-2">
						<span className="shrink-0 font-bold">1.</span>
						<span>
							Obtain the unique 4-character Team ID from your team member who
							registered your group.
						</span>
					</li>
					<li className="flex gap-2">
						<span className="shrink-0 font-bold">2.</span>
						<span>Enter the Team ID below.</span>
					</li>
					<li className="flex gap-2">
						<span className="shrink-0 font-bold">3.</span>
						<span>Click on &ldquo;Join.&rdquo;</span>
					</li>
					<li className="flex gap-2">
						<span className="shrink-0 font-bold">4.</span>
						<span>It&apos;s official! You joined the team!</span>
					</li>
				</ol>

				<JoinTeamForm />
			</div>
		</section>
	);
}
