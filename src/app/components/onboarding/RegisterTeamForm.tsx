"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { TextField } from "@/app/components/forms/TextField";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn, TEAM_NAME_MAX } from "@/lib/utils";
import {
	type RegisterTeamValues,
	registerTeamSchema
} from "@/lib/validation/team";
import { api } from "@/trpc/react";

export function RegisterTeamForm() {
	const router = useRouter();
	const form = useForm<RegisterTeamValues>({
		defaultValues: { name: "" },
		resolver: zodResolver(registerTeamSchema)
	});

	const registerTeam = api.teams.create.useMutation({
		onSuccess: () => router.push(ONBOARDING_ROUTES.teamRegistered),
		onError: (error) => {
			if (error.data?.code === "BAD_REQUEST") {
				form.setError(
					"name",
					{
						message: error.data.zodError?.fieldErrors.name?.[0] ?? error.message
					},
					{ shouldFocus: true }
				);
			} else {
				toast.error("We couldn’t register your team. Please try again.");
			}
		}
	});
	// Stay busy after success while the next step loads.
	const isBusy = registerTeam.isPending || registerTeam.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => registerTeam.mutate(values))}
		>
			<TextField
				autoComplete="off"
				control={form.control}
				disabled={isBusy}
				label="Enter your team’s name"
				maxLength={TEAM_NAME_MAX}
				name="name"
				placeholder="Team name"
			/>
			<AuthActions>
				<Button className="w-full" disabled={isBusy} type="submit">
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
	);
}
