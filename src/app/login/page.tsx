"use client";

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
				password,
			});

			if (result.error) {
				setError(result.error.message || "Failed to sign in");
			} else {
				// Redirect to dashboard on success
				router.push("/"); // will redirect to home for now
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main>
			<h1>Login</h1>
			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="email">Email:</label>
					<input
						disabled={loading}
						id="email"
						onChange={(e) => setEmail(e.target.value)}
						required
						type="email"
						value={email}
					/>
				</div>
				<div>
					<label htmlFor="password">Password:</label>
					<input
						disabled={loading}
						id="password"
						onChange={(e) => setPassword(e.target.value)}
						required
						type="password"
						value={password}
					/>
				</div>
				{error && <div style={{ color: "red" }}>{error}</div>}
				<button disabled={loading} type="submit">
					{loading ? "Signing in..." : "Sign In"}
				</button>
			</form>
		</main>
	);
}
