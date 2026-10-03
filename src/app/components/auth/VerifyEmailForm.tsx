"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { CodeField } from "@/app/components/forms/CodeField";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { getSignedInHref } from "@/lib/onboarding";
import {
	VERIFICATION_CODE_LENGTH,
	type VerifyEmailValues,
	verifyEmailSchema
} from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import {
	getAuthErrorMessage,
	isCodeError,
	unwrapAuthResponse
} from "./auth-errors";

export function VerifyEmailForm({ email }: { email: string }) {
	const router = useRouter();
	const form = useForm<VerifyEmailValues>({
		defaultValues: { code: "" },
		resolver: zodResolver(verifyEmailSchema)
	});
	const code = useWatch({ control: form.control, name: "code" });

	const verify = useMutation({
		mutationFn: async ({ code }: VerifyEmailValues) =>
			unwrapAuthResponse(
				await authClient.emailOtp.verifyEmail({ email, otp: code })
			),
		onSuccess: ({ user }) => {
			toast.success("Email verified");
			router.replace(getSignedInHref(user));
		},
		onError: (error) => {
			if (isCodeError(error)) {
				form.setError(
					"code",
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
				await authClient.emailOtp.sendVerificationOtp({
					email,
					type: "email-verification"
				})
			),
		onSuccess: () => {
			form.reset({ code: "" });
			toast.success("We sent you a new code");
		},
		onError: (error) => toast.error(getAuthErrorMessage(error))
	});
	// Stay busy after success while the next page loads.
	const isBusy = verify.isPending || verify.isSuccess;

	return (
		<>
			<div className="flex flex-col items-start gap-1">
				<p>
					We sent an email with a one-time code to{" "}
					<span className="font-medium">{email}</span>
				</p>
			</div>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => verify.mutate(values))}
			>
				<CodeField
					autoComplete="one-time-code"
					control={form.control}
					disabled={isBusy}
					hideLabel
					label="One-time code"
					length={VERIFICATION_CODE_LENGTH}
					name="code"
					pattern={REGEXP_ONLY_DIGITS}
				/>
				<AuthActions className="items-center">
					<Button
						className="w-full"
						disabled={code.length < VERIFICATION_CODE_LENGTH || isBusy}
						type="submit"
					>
						{isBusy && <Spinner data-icon="inline-start" />}
						Verify
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
		</>
	);
}
