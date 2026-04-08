"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/better-auth/client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await authClient.signIn.email({
				email,
				password
			});

			if (result.error) {
				setError(result.error.message || "Failed to sign in");
			} else {
				// Redirect to dashboard on success
				router.push("/"); // will redirect to home for now
			}
		} catch (_err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-[#f9dde4] text-[#2f2f2f]">
			<header className="border-[#dac3c9] border-b bg-[#f4eef0]">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-4">
					<div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-[#393939] bg-white text-[#f15a6a] text-lg leading-none">
						♡
					</div>
				</div>
			</header>

			<section className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-6xl items-center justify-center px-4 py-8">
				<div className="w-full max-w-4xl rounded-none bg-[#6a4dff] p-5 shadow-[0_12px_28px_rgba(79,52,180,0.25)] md:p-8">
					<div className="rounded-2xl bg-[#f4f4f4] p-6 md:p-8">
						<h1 className="mb-6 font-bold text-3xl text-[#1f1f1f]">Sign In</h1>
						<form className="space-y-4" onSubmit={handleSubmit}>
							<div className="space-y-1">
								<label className="font-medium text-sm" htmlFor="email">
									Email
								</label>
								<input
									className="h-10 w-full rounded-full border border-[#bdbdbd] bg-white px-4 text-sm outline-none transition focus:border-[#6a4dff]"
									disabled={loading}
									id="email"
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Email"
									required
									type="email"
									value={email}
								/>
							</div>

							<div className="space-y-1">
								<label className="font-medium text-sm" htmlFor="password">
									Password
								</label>
								<input
									className="h-10 w-full rounded-full border border-[#bdbdbd] bg-white px-4 text-sm outline-none transition focus:border-[#6a4dff]"
									disabled={loading}
									id="password"
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Password"
									required
									type="password"
									value={password}
								/>
							</div>

							<div className="flex items-center justify-between text-sm">
								<label className="inline-flex items-center gap-2 text-[#695fb3]">
									<input className="accent-[#6a4dff]" type="checkbox" />
									Remember me?
								</label>
								<button
									className="text-[#695fb3] transition hover:text-[#4e3cc4]"
									type="button"
								>
									Forgot Password?
								</button>
							</div>

							{error && (
								<p className="rounded-md bg-[#ffe2e7] px-3 py-2 text-[#b3003c] text-sm">
									{error}
								</p>
							)}

							<button
								className="h-10 w-full rounded-full bg-[#6a4dff] font-semibold text-sm text-white transition hover:bg-[#5537f0] disabled:cursor-not-allowed disabled:opacity-70"
								disabled={loading}
								type="submit"
							>
								{loading ? "Signing in..." : "Sign in"}
							</button>

							<div className="flex items-center gap-3 text-[#7d7d7d] text-xs">
								<div className="h-px flex-1 bg-[#cfcfcf]" />
								<span>or</span>
								<div className="h-px flex-1 bg-[#cfcfcf]" />
							</div>

							<button
								className="flex h-10 w-full items-center justify-center gap-2 border border-[#cfcfcf] bg-white font-medium text-[#242424] text-sm transition hover:bg-[#f4f1ff]"
								type="button"
							>
								<span className="text-base">G</span>
								Continue with Google
							</button>

							<p className="pt-2 text-center text-[#666] text-sm">
								Don&apos;t have an account?{" "}
								<Link
									className="font-semibold text-[#5e45f7] hover:text-[#462fd3]"
									href="/signup"
								>
									CREATE AN ACCOUNT
								</Link>
							</p>
						</form>
					</div>
				</div>
			</section>
		</main>
	);
}
