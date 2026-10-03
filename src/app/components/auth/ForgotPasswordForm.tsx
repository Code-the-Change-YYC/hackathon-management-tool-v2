"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { AUTH_ROUTES, getResetPasswordHref } from "@/lib/routes";
import {
	type ForgotPasswordValues,
	forgotPasswordSchema
} from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import { getAuthErrorMessage, unwrapAuthResponse } from "./auth-errors";

export function ForgotPasswordForm({ email }: { email: string }) {
	const router = useRouter();
	const form = useForm<ForgotPasswordValues>({
		defaultValues: { email },
		resolver: zodResolver(forgotPasswordSchema)
	});

	const sendCode = useMutation({
		mutationFn: async ({ email }: ForgotPasswordValues) =>
			unwrapAuthResponse(
				await authClient.emailOtp.requestPasswordReset({ email })
			),
		onSuccess: (_, { email }) => router.push(getResetPasswordHref(email)),
		onError: (error) => toast.error(getAuthErrorMessage(error))
	});
	// Stay busy after success while the next page loads.
	const isBusy = sendCode.isPending || sendCode.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => sendCode.mutate(values))}
		>
			<TextField
				autoComplete="email"
				control={form.control}
				disabled={isBusy}
				label="Email"
				name="email"
				placeholder="Email"
				type="email"
			/>
			<AuthActions>
				<Button className="w-full" disabled={isBusy} type="submit">
					{isBusy && <Spinner data-icon="inline-start" />}
					Send code
				</Button>
				<p className="text-center font-medium text-sm">
					Remembered it?{" "}
					<Link className="link text-sm" href={AUTH_ROUTES.login}>
						Log in
					</Link>
				</p>
			</AuthActions>
		</form>
	);
}
