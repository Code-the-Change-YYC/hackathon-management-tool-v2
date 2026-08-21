export default function SignupLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<main className="min-h-screen bg-awesomer-purple text-dark-grey">
			<section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 md:py-10">
				<h1 className="mb-6 text-center font-extrabold text-3xl text-pale-grey md:text-5xl">
					Register for Hack the Change 2026
				</h1>
				<div className="mx-auto w-full rounded-2xl bg-pale-grey p-5 shadow-lg md:p-8">
					<h2 className="mb-5 font-bold text-2xl text-dark-grey">
						Individual Registration
					</h2>
					{children}
				</div>
			</section>
		</main>
	);
}
