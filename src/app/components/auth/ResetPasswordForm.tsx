"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { CodeField } from "@/app/components/forms/CodeField";
import { PasswordField } from "@/app/components/forms/PasswordField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { getSignedInHref } from "@/lib/onboarding";
import { AUTH_ROUTES } from "@/lib/routes";
import {
	type ResetPasswordValues,
	resetPasswordSchema,
	VERIFICATION_CODE_LENGTH
} from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import {
	getAuthErrorMessage,
	hasAuthErrorCode,
	isCodeError,
	unwrapAuthResponse
} from "./auth-errors";
import { PasswordRequirements } from "./PasswordRequirements";
import { useCodeAttempts } from "./use-code-attempts";

export function ResetPasswordForm({ email }: { email: string }) {
	const router = useRouter();
	const codeAttempts = useCodeAttempts();
	const form = useForm<ResetPasswordValues>({
		defaultValues: { code: "", password: "" },
		resolver: zodResolver(resetPasswordSchema)
	});
	const password = useWatch({ control: form.control, name: "password" });

	const resetPassword = useMutation({
		mutationFn: async ({ code, password }: ResetPasswordValues) => {
			unwrapAuthResponse(
				await authClient.emailOtp.resetPassword({ email, otp: code, password })
			);
			// The code proved they own the email, so log them straight in.
			// Resetting already worked, so if this fails they can log in themselves.
			const { data } = await authClient.signIn.email({ email, password });
			return data?.user ?? null;
		},
		onSuccess: (user) => {
			toast.success("Password updated");
			router.replace(user ? getSignedInHref(user) : AUTH_ROUTES.login);
		},
		onError: (error) => {
			if (isCodeError(error)) {
				form.setError(
					"code",
					{ message: codeAttempts.getCodeErrorMessage(error) },
					{ shouldFocus: true }
				);
			} else if (
				hasAuthErrorCode(error, "PASSWORD_TOO_SHORT", "PASSWORD_TOO_LONG")
			) {
				form.setError(
					"password",
					{ message: getAuthErrorMessage(error) },
					{ shouldFocus: true }
				);
			} else {
				toast.error(getAuthErrorMessage(error));
			}
		}
	});

	const resendCode = useMutation({
		mutationFn: async () =>
			unwrapAuthResponse(
				await authClient.emailOtp.requestPasswordReset({ email })
			),
		onSuccess: () => {
			form.resetField("code");
			codeAttempts.onCodeResent();
			toast.success("We sent you a new code");
		},
		onError: (error) => toast.error(getAuthErrorMessage(error))
	});
	// Stay busy after success while the next page loads.
	const isBusy = resetPassword.isPending || resetPassword.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => {
				// A used-up code can't work, so don't send it.
				if (codeAttempts.spentCodeMessage) {
					form.setError(
						"code",
						{ message: codeAttempts.spentCodeMessage },
						{ shouldFocus: true }
					);
					return;
				}
				resetPassword.mutate(values);
			})}
		>
			<FieldGroup className="gap-6">
				<CodeField
					autoComplete="one-time-code"
					control={form.control}
					disabled={isBusy}
					label="One-time code"
					length={VERIFICATION_CODE_LENGTH}
					name="code"
					pattern={REGEXP_ONLY_DIGITS}
				/>
				<PasswordField
					autoComplete="new-password"
					control={form.control}
					description={<PasswordRequirements password={password} />}
					disabled={isBusy}
					label="New password"
					name="password"
					placeholder="New password"
				/>
			</FieldGroup>
			<AuthActions className="items-center">
				<Button className="w-full" disabled={isBusy} type="submit">
					{isBusy && <Spinner data-icon="inline-start" />}
					Reset Password
				</Button>
				<button
					className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-purple-800 text-sm underline-offset-4 hover:underline disabled:pointer-events-none disabled:opacity-50"
					disabled={resendCode.isPending || isBusy}
					onClick={() => resendCode.mutate()}
					type="button"
				>
					{resendCode.isPending && <Spinner />}
					Resend one-time code
				</button>
			</AuthActions>
		</form>
	);
}
