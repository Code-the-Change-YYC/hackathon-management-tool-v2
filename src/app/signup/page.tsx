"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/server/better-auth/client";

type MealOption = "yes" | "no" | "";

export default function SignupPage() {
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [school, setSchool] = useState("");
	const [wantsFood, setWantsFood] = useState<MealOption>("");
	const [allergies, setAllergies] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await authClient.signUp.email({
				email,
				name: `${firstName} ${lastName}`.trim(),
				password
			});

			if (result.error) {
				setError(result.error.message || "Failed to sign up");
				return;
			}

			// Save profile details after account creation if supported by your backend later.
			void school;
			void wantsFood;
			void allergies;
			router.push("/login");
		} catch (_err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-awesomer-purple text-dark-grey">
			<header className="bg-light-grey">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
					<Link
						className="font-semibold text-awesomer-purple text-lg hover:text-awesome-purple"
						href="/signup"
					>
						Join a Team
					</Link>
					<div className="flex h-10 w-10 items-center justify-center rounded-md border-2 border-dark-grey bg-pale-grey text-dark-pink text-lg leading-none">
						♡
					</div>
					<div className="w-20" />
				</div>
			</header>

			<section className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
				<h1 className="mb-6 text-center font-extrabold text-3xl text-pale-grey md:text-5xl">
					Register for Hack the Change 2026
				</h1>

				<div className="mx-auto max-w-5xl rounded-2xl bg-pale-grey p-5 shadow-lg md:p-8">
					<h2 className="mb-5 font-bold text-2xl text-dark-grey">
						Individual Registration
					</h2>

					<form className="space-y-4" onSubmit={handleSubmit}>
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
							<div className="space-y-1">
								<label className="font-medium text-sm" htmlFor="firstName">
									*First Name
								</label>
								<input
									className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
									disabled={loading}
									id="firstName"
									onChange={(e) => setFirstName(e.target.value)}
									placeholder="First Name"
									required
									value={firstName}
								/>
							</div>

							<div className="space-y-1">
								<label className="font-medium text-sm" htmlFor="lastName">
									*Last Name
								</label>
								<input
									className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
									disabled={loading}
									id="lastName"
									onChange={(e) => setLastName(e.target.value)}
									placeholder="Last Name"
									required
									value={lastName}
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-sm" htmlFor="email">
								*Email
							</label>
							<input
								className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
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
								*Password
							</label>
							<input
								className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
								disabled={loading}
								id="password"
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Password"
								required
								type="password"
								value={password}
							/>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-sm" htmlFor="school">
								Which institution do you go to?
							</label>
							<select
								className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
								disabled={loading}
								id="school"
								onChange={(e) => setSchool(e.target.value)}
								value={school}
							>
								<option value="">Select institution</option>
								<option value="University of Calgary">
									University of Calgary
								</option>
								<option value="Mount Royal University">
									Mount Royal University
								</option>
								<option value="SAIT">SAIT</option>
								<option value="Other">Other</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-sm" htmlFor="food">
								*Do you want provided food at the hackathon? (required)
							</label>
							<select
								className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
								disabled={loading}
								id="food"
								onChange={(e) => setWantsFood(e.target.value as MealOption)}
								required
								value={wantsFood}
							>
								<option value="">Select an option</option>
								<option value="yes">Yes</option>
								<option value="no">No</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="font-medium text-sm" htmlFor="allergies">
								*If you wanted provided food, please indicate any allergies:
							</label>
							<input
								className="h-11 w-full rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
								disabled={loading}
								id="allergies"
								onChange={(e) => setAllergies(e.target.value)}
								placeholder="e.g. peanuts"
								value={allergies}
							/>
						</div>

						{error && (
							<p className="rounded-md bg-pastel-pink px-3 py-2 text-sm text-strawberry-red">
								{error}
							</p>
						)}

						<div className="flex justify-end gap-3 pt-2">
							<Link
								className="inline-flex h-11 min-w-28 items-center justify-center rounded-full border border-awesome-purple bg-pale-grey px-6 font-semibold text-awesomer-purple text-sm transition hover:bg-lilac-purple"
								href="/login"
							>
								Cancel
							</Link>
							<button
								className="h-11 min-w-28 rounded-full bg-awesomer-purple px-6 font-semibold text-pale-grey text-sm transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-70"
								disabled={loading}
								type="submit"
							>
								{loading ? "Signing up..." : "Sign up"}
							</button>
						</div>
					</form>
				</div>
			</section>

			<footer className="bg-awesome-purple/70 py-6 text-center text-pale-grey/90 text-xs">
				<p>Keep up with us!</p>
				<p className="mt-2">Copyright © Code The Change YYC</p>
			</footer>
		</main>
	);
}
