"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/server/better-auth/client";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction,
	PROGRAMS
} from "@/server/db/auth-schema";
import { api } from "@/trpc/react";

type MealOption = "yes" | "no" | "";

export default function SignupForm() {
	const router = useRouter();
	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [school, setSchool] = useState("");
	const [program, setProgram] = useState("");
	const [wantsFood, setWantsFood] = useState<MealOption>("");
	const [dietaryRestrictions, setDietaryRestrictions] = useState<
		DietaryRestriction[]
	>([]);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const completeRegistration =
		api.users.completeRegistrationByEmail.useMutation();

	const isRequiredComplete =
		firstName.trim() !== "" &&
		lastName.trim() !== "" &&
		email.trim() !== "" &&
		password.trim() !== "" &&
		wantsFood !== "";

	const isSubmitDisabled = loading || !isRequiredComplete;

	function handleDietaryRestrictionsChange(
		event: React.ChangeEvent<HTMLSelectElement>
	) {
		const selectedValues = Array.from(
			event.target.selectedOptions,
			(option) => option.value
		);

		if (selectedValues.includes("none")) {
			setDietaryRestrictions([]);
			return;
		}

		setDietaryRestrictions(
			DIETARY_RESTRICTIONS.filter((restriction) =>
				selectedValues.includes(restriction)
			)
		);
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!isRequiredComplete) {
			setError("Please fill in all required fields.");
			return;
		}

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

			await completeRegistration.mutateAsync({
				email,
				school,
				program: PROGRAMS.includes(program as (typeof PROGRAMS)[number])
					? (program as (typeof PROGRAMS)[number])
					: undefined,
				dietaryRestrictions,
				wantsFood
			});

			router.push("/login");
		} catch (_err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
			<div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
				<div className="space-y-4 pb-1">
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
							className="h-11 w-full cursor-pointer rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
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
						<label className="font-medium text-sm" htmlFor="program">
							Which program are you in?
						</label>
						<select
							className="h-11 w-full cursor-pointer rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
							disabled={loading}
							id="program"
							onChange={(e) => setProgram(e.target.value)}
							value={program}
						>
							<option value="">Select program</option>
							<option value="computer_science">Computer Science</option>
							<option value="software_engineering">Software Engineering</option>
							<option value="electrical_engineering">
								Electrical Engineering
							</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div className="space-y-1">
						<label className="font-medium text-sm" htmlFor="food">
							*Do you want provided food at the hackathon? (required)
						</label>
						<select
							className="h-11 w-full cursor-pointer rounded-xl border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
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
						<label className="font-medium text-sm" htmlFor="dietaryRestriction">
							*If you wanted provided food, please indicate any dietary
							restrictions:
						</label>
						<select
							className="min-h-36 w-full cursor-pointer rounded-xl border border-ehhh-grey bg-pale-grey px-4 py-2 text-sm outline-none transition focus:border-awesomer-purple"
							disabled={loading}
							id="dietaryRestriction"
							multiple
							onChange={handleDietaryRestrictionsChange}
							value={dietaryRestrictions}
						>
							<option value="none">None</option>
							<option value="halal">Halal</option>
							<option value="vegetarian">Vegetarian</option>
							<option value="vegan">Vegan</option>
							<option value="gluten_free">Gluten-Free</option>
							<option value="other">Other</option>
						</select>
					</div>
				</div>
			</div>

			{error && (
				<p className="mt-3 rounded-md bg-pastel-pink px-3 py-2 text-sm text-strawberry-red">
					{error}
				</p>
			)}

			<div className="mt-3 flex shrink-0 justify-end gap-3 border-medium-grey border-t pt-3">
				<Link
					className="inline-flex h-11 min-w-28 items-center justify-center rounded-full border border-awesome-purple bg-pale-grey px-6 font-semibold text-awesomer-purple text-sm transition hover:bg-lilac-purple"
					href="/login"
				>
					Cancel
				</Link>
				<button
					className="h-11 min-w-28 cursor-pointer rounded-full bg-awesomer-purple px-6 font-semibold text-pale-grey text-sm transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:bg-medium-grey disabled:text-dark-grey disabled:opacity-100"
					disabled={isSubmitDisabled}
					type="submit"
				>
					{loading ? "Signing up..." : "Sign up"}
				</button>
			</div>
		</form>
	);
}
