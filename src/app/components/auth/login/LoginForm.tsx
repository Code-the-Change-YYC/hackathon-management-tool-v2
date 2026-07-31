"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/server/better-auth/client";

export default function LoginForm() {
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
				return;
			}

			router.push("/");
		} catch (_err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="space-y-4" onSubmit={handleSubmit}>
			<div className="space-y-1">
				<label className="font-medium text-sm" htmlFor="email">
					Email
				</label>
				<input
					className="h-10 w-full rounded-full border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
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
					className="h-10 w-full rounded-full border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
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
				<label className="group inline-flex cursor-pointer items-center gap-2 text-grey-purple transition-colors hover:text-awesomer-purple">
					<input
						className="cursor-pointer accent-awesomer-purple transition-colors group-hover:accent-awesomer-purple"
						type="checkbox"
					/>
					<span>Remember me?</span>
				</label>
				<button
					className="cursor-pointer text-grey-purple transition-colors hover:text-awesomer-purple"
					type="button"
				>
					Forgot Password?
				</button>
			</div>

			{error && (
				<p className="rounded-md bg-pastel-pink px-3 py-2 text-sm text-strawberry-red">
					{error}
				</p>
			)}

			<button
				className="h-10 w-full cursor-pointer rounded-full bg-awesomer-purple font-semibold text-pale-grey text-sm transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-70"
				disabled={loading}
				type="submit"
			>
				{loading ? "Signing in..." : "Sign in"}
			</button>

			<p className="pt-2 text-center text-dark-grey/75 text-sm">
				Don&apos;t have an account?{" "}
				<Link
					className="font-semibold text-awesomer-purple hover:text-awesome-purple"
					href="/signup"
				>
					CREATE AN ACCOUNT
				</Link>
			</p>
		</form>
	);
}
