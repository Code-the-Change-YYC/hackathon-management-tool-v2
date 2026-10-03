"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { CodeField } from "@/app/components/forms/CodeField";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger
} from "@/app/components/ui/popover";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import {
	type JoinTeamValues,
	joinTeamSchema,
	TEAM_CODE_LENGTH
} from "@/lib/validation/team";
import { api } from "@/trpc/react";

export function JoinTeamForm() {
	const router = useRouter();
	const form = useForm<JoinTeamValues>({
		defaultValues: { teamCode: "" },
		resolver: zodResolver(joinTeamSchema)
	});
	const teamCode = useWatch({ control: form.control, name: "teamCode" });

	const joinTeam = api.teams.join.useMutation({
		onSuccess: () => router.push(ONBOARDING_ROUTES.teamJoined),
		onError: (error) => {
			if (error.data?.code === "NOT_FOUND") {
				form.setError(
					"teamCode",
					{ message: "No team uses that code. Check it with your teammates." },
					{ shouldFocus: true }
				);
			} else if (error.data?.code === "BAD_REQUEST") {
				// A full team, or the user already being on one.
				form.setError(
					"teamCode",
					{
						message:
							error.data.zodError?.fieldErrors.teamCode?.[0] ?? error.message
					},
					{ shouldFocus: true }
				);
			} else {
				toast.error("We couldn't join that team. Please try again.");
			}
		}
	});
	// Stay busy after success while the next step loads.
	const isBusy = joinTeam.isPending || joinTeam.isSuccess;

	return (
		<>
			<div className="flex flex-col items-start gap-1">
				<p>
					Your teammates can share a join code with you to invite members on
					their “My Team” page.
				</p>
				<Popover>
					<PopoverTrigger className="cursor-pointer font-medium text-purple-800 text-sm underline-offset-4 hover:underline">
						Where is this code?
					</PopoverTrigger>
					<PopoverContent align="start">
						<PopoverHeader>
							<PopoverTitle>Finding your invite code</PopoverTitle>
							<PopoverDescription>
								Whoever registered your team can find its 6-character code by
								selecting Invite on their “My Team” page.
							</PopoverDescription>
						</PopoverHeader>
					</PopoverContent>
				</Popover>
			</div>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => joinTeam.mutate(values))}
			>
				<CodeField
					control={form.control}
					disabled={isBusy}
					inputMode="text"
					label="Team invite code"
					length={TEAM_CODE_LENGTH}
					name="teamCode"
					pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
				/>
				<AuthActions>
					<Button
						className="w-full"
						disabled={teamCode.length < TEAM_CODE_LENGTH || isBusy}
						type="submit"
					>
						{isBusy && <Spinner data-icon="inline-start" />}
						Continue
					</Button>
					<Link
						className={cn(buttonVariants({ variant: "outline" }), "w-full")}
						href={ONBOARDING_ROUTES.team}
					>
						Go back
					</Link>
				</AuthActions>
			</form>
		</>
	);
}
