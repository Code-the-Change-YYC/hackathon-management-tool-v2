"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";

export default function RegisterTeamForm() {
	const router = useRouter();
	const [teamName, setTeamName] = useState("");

	const createTeam = api.teams.create.useMutation({
		onSuccess(data) {
			router.push(`/team/register/success?teamId=${data?.teamCode ?? ""}`);
		}
	});

	const isDisabled = createTeam.isPending || teamName.trim() === "";

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (isDisabled) return;
		createTeam.mutate({ name: teamName.trim() });
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-1.5">
				<label
					className="font-medium text-dark-grey text-sm"
					htmlFor="teamName"
				>
					Team Name
				</label>
				<input
					className="h-12 w-full rounded-full border border-ehhh-grey bg-pale-grey px-5 text-base text-dark-grey outline-none transition focus:border-awesomer-purple"
					disabled={createTeam.isPending}
					id="teamName"
					maxLength={50}
					onChange={(e) => setTeamName(e.target.value)}
					placeholder="Team Name"
					required
					type="text"
					value={teamName}
				/>
				<p className="text-ehhh-grey text-xs">
					Letters, numbers, spaces, hyphens, and underscores only (max 50
					chars).
				</p>
			</div>

			{createTeam.error && (
				<p className="rounded-lg bg-pastel-pink px-4 py-2.5 text-sm text-strawberry-red">
					{createTeam.error.message}
				</p>
			)}

			<div className="flex items-center justify-between pt-2">
				<button
					className="rounded-full bg-awesomer-purple px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-awesome-purple"
					onClick={() => router.back()}
					type="button"
				>
					Back
				</button>
				<div className="flex gap-3">
					<Link
						className="rounded-full border border-awesomer-purple px-6 py-2.5 font-semibold text-awesomer-purple text-sm transition hover:bg-lilac-purple"
						href="/team"
					>
						Cancel
					</Link>
					<button
						className="rounded-full bg-awesomer-purple px-6 py-2.5 font-semibold text-sm text-white transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isDisabled}
						type="submit"
					>
						{createTeam.isPending ? "Registering…" : "Register"}
					</button>
				</div>
			</div>
		</form>
	);
}
