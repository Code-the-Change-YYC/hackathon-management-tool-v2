import RegisterTeamForm from "@/app/components/team/RegisterTeamForm";

export default function RegisterTeamPage() {
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
							Register new team
						</h2>
					</div>
					<div className="ml-8 h-0.5 w-24 rounded-full bg-awesomer-purple" />
				</div>

				<RegisterTeamForm />
			</div>
		</section>
	);
}
