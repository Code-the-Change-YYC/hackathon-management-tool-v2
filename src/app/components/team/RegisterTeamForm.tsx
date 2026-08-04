"use client";

/**
 * Team registration form used on `/team/register`.
 *
 * TEAM_NAME_PATTERN mirrors the backend's `teamNameSchema` regex in
 * `src/server/api/routers/teams.ts` so the submit button disables before a
 * doomed mutation is attempted.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";

const TEAM_NAME_PATTERN = /^[a-zA-Z0-9 _-]+$/;

export default function RegisterTeamForm() {
	const router = useRouter();
	const [teamName, setTeamName] = useState("");

	const createTeam = api.teams.create.useMutation({
		onSuccess(data) {
			router.push(`/team/register/success?teamId=${data?.teamCode ?? ""}`);
		}
	});

	const trimmedTeamName = teamName.trim();
	const isDisabled =
		createTeam.isPending || !TEAM_NAME_PATTERN.test(trimmedTeamName);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (isDisabled) return;
		createTeam.mutate({ name: trimmedTeamName });
	}

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-1.5">
				<Label htmlFor="teamName">Team Name</Label>
				<Input
					className="h-12 rounded-full px-5 text-base"
					disabled={createTeam.isPending}
					id="teamName"
					maxLength={50}
					onChange={(e) => setTeamName(e.target.value)}
					placeholder="Team Name"
					required
					type="text"
					value={teamName}
				/>
				<p className="text-muted-foreground text-xs">
					Letters, numbers, spaces, hyphens, and underscores only (max 50
					chars).
				</p>
			</div>

			{createTeam.error && (
				<p className="rounded-lg bg-destructive/10 px-4 py-2.5 text-destructive text-sm">
					{createTeam.error.message}
				</p>
			)}

			<div className="flex items-center justify-between pt-2">
				<Button
					className="rounded-full"
					onClick={() => router.back()}
					size="sm"
					type="button"
				>
					Back
				</Button>
				<div className="flex gap-3">
					<Link
						className={cn(
							buttonVariants({ variant: "outline", size: "sm" }),
							"rounded-full"
						)}
						href="/participant/my-team"
					>
						Cancel
					</Link>
					<Button
						className="rounded-full"
						disabled={isDisabled}
						size="sm"
						type="submit"
					>
						{createTeam.isPending ? "Registering…" : "Register"}
					</Button>
				</div>
			</div>
		</form>
	);
}
