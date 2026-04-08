"use client";

import LoginForm from "@/app/components/auth/login/LoginForm";

export default function LoginPage() {
	return (
		<main className="min-h-screen bg-pastel-pink text-dark-grey">
			<section className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-6xl flex-col items-center justify-center px-4 py-8">
				<div className="h-10 w-full max-w-4xl rounded-t-xl bg-pale-grey p-2 text-dark-grey">
					<div>○ ○ ○</div>
				</div>
				<div className="w-full max-w-4xl rounded-none bg-awesomer-purple p-5 shadow-lg md:p-8">
					<div className="rounded-2xl bg-pale-grey p-6 md:p-8">
						<h1 className="mb-6 font-bold text-3xl text-dark-grey">Sign In</h1>
						<LoginForm />
					</div>
				</div>
			</section>
		</main>
	);
}
