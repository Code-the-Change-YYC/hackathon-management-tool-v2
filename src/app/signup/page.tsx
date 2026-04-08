"use client";

import SignupForm from "@/app/components/auth/signup/SignupForm";

export default function SignupPage() {
	return (
		<main className="h-screen overflow-hidden bg-awesomer-purple text-dark-grey">
			<section className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-4 py-6 md:py-10">
				<h1 className="mb-6 shrink-0 text-center font-extrabold text-3xl text-pale-grey md:text-5xl">
					Register for Hack the Change 2026
				</h1>

				<div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl bg-pale-grey p-5 shadow-lg md:p-8">
					<h2 className="mb-5 shrink-0 font-bold text-2xl text-dark-grey">
						Individual Registration
					</h2>

					<SignupForm />
				</div>
			</section>
		</main>
	);
}
