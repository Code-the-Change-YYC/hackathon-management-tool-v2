"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { CodeField } from "@/app/components/forms/CodeField";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import {
	type JoinTeamValues,
	joinTeamSchema,
	TEAM_CODE_LENGTH
} from "@/lib/validation/team";
import { api } from "@/trpc/react";
import { TeamGoBackButton } from "./TeamGoBackButton";

export function JoinTeamForm({
	onJoined,
	onBack,
	Actions = AuthActions
}: {
	onJoined?: () => Promise<void> | void;
	onBack?: () => void;
	Actions?: typeof AuthActions;
}) {
	const router = useRouter();
	const form = useForm<JoinTeamValues>({
		defaultValues: { teamCode: "" },
		resolver: zodResolver(joinTeamSchema)
	});
	const teamCode = useWatch({ control: form.control, name: "teamCode" });

	const joinTeam = api.teams.join.useMutation({
		onSuccess: () => {
			if (onJoined) return onJoined();
			router.push(ONBOARDING_ROUTES.teamJoined);
			// Drops cached pages, so going back shows the saved answers.
			router.refresh();
		},
		onError: (error) => {
			const isCodeError =
				error.data?.code === "NOT_FOUND" || error.data?.code === "BAD_REQUEST";
			if (isCodeError) form.setValue("teamCode", ""); // Clear the failed code for the next try.

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
				toast.error("We couldn’t join that team. Please try again.");
			}
		}
	});
	// Stay busy after success while the next step loads.
	const isBusy = joinTeam.isPending || joinTeam.isSuccess;

	const submit = form.handleSubmit((values) => joinTeam.mutate(values));

	return (
		<form className="flex flex-col gap-6" noValidate onSubmit={submit}>
			<CodeField
				control={form.control}
				disabled={isBusy}
				inputMode="text"
				label="Team invite code"
				length={TEAM_CODE_LENGTH}
				name="teamCode"
				onPasteComplete={submit}
				pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
			/>
			<Actions>
				<Button
					className="w-full"
					disabled={teamCode.length < TEAM_CODE_LENGTH || isBusy}
					type="submit"
				>
					{isBusy && <Spinner data-icon="inline-start" />}
					Continue
				</Button>
				<TeamGoBackButton onBack={onBack} />
			</Actions>
		</form>
	);
}
