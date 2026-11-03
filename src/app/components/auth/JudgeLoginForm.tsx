"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions, AuthHeading } from "@/app/components/auth/AuthShell";
import { CodeField } from "@/app/components/forms/CodeField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { getSignedInHref } from "@/lib/onboarding";
import { AUTH_ROUTES } from "@/lib/routes";
import {
	type JudgeLoginValues,
	judgeLoginSchema,
	VERIFICATION_CODE_LENGTH,
	type VerifyEmailValues,
	verifyEmailSchema
} from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import {
	getAuthErrorMessage,
	hasAuthErrorCode,
	isCodeError,
	unwrapAuthResponse
} from "./auth-errors";
import { useCodeAttempts } from "./use-code-attempts";

async function sendSignInCode(email: string) {
	return unwrapAuthResponse(
		await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" })
	);
}

/** Judges have no password: they enter their email, then the code we send. */
export function JudgeLoginForm({ email }: { email: string }) {
	const [codeSentTo, setCodeSentTo] = useState<string | null>(null);

	if (codeSentTo) {
		return (
			<JudgeCodeStep
				email={codeSentTo}
				onChangeEmail={() => setCodeSentTo(null)}
			/>
		);
	}
	return <JudgeEmailStep email={email} onCodeSent={setCodeSentTo} />;
}

function JudgeEmailStep({
	email,
	onCodeSent
}: {
	email: string;
	onCodeSent: (email: string) => void;
}) {
	const form = useForm<JudgeLoginValues>({
		defaultValues: { email },
		resolver: zodResolver(judgeLoginSchema)
	});

	const sendCode = useMutation({
		mutationFn: ({ email }: JudgeLoginValues) => sendSignInCode(email),
		onSuccess: (_, { email }) => onCodeSent(email),
		onError: (error) => {
			if (hasAuthErrorCode(error, "JUDGE_NOT_FOUND", "INVALID_EMAIL")) {
				form.setError(
					"email",
					{ message: getAuthErrorMessage(error) },
					{ shouldFocus: true }
				);
			} else {
				toast.error(getAuthErrorMessage(error));
			}
		}
	});

	return (
		<>
			<AuthHeading
				description="Enter the email your judge invitation was sent to and we’ll email you a one-time code."
				title="Sign in to judge"
			/>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => sendCode.mutate(values))}
			>
				<TextField
					autoComplete="email"
					control={form.control}
					disabled={sendCode.isPending}
					label="Email"
					name="email"
					placeholder="Email"
					type="email"
				/>
				<AuthActions>
					<Button
						className="w-full"
						disabled={sendCode.isPending}
						type="submit"
					>
						{sendCode.isPending && <Spinner data-icon="inline-start" />}
						Send code
					</Button>
					<p className="text-center font-medium text-sm">
						Not a judge?{" "}
						<Link className="link text-sm" href={AUTH_ROUTES.login}>
							Log in
						</Link>
					</p>
				</AuthActions>
			</form>
		</>
	);
}

function JudgeCodeStep({
	email,
	onChangeEmail
}: {
	email: string;
	onChangeEmail: () => void;
}) {
	const router = useRouter();
	const codeAttempts = useCodeAttempts();
	const form = useForm<VerifyEmailValues>({
		defaultValues: { code: "" },
		resolver: zodResolver(verifyEmailSchema)
	});
	const code = useWatch({ control: form.control, name: "code" });

	const signIn = useMutation({
		mutationFn: async ({ code }: VerifyEmailValues) =>
			unwrapAuthResponse(
				await authClient.signIn.emailOtp({ email, otp: code })
			),
		onSuccess: ({ user }) => router.replace(getSignedInHref(user)),
		onError: (error) => {
			if (isCodeError(error)) {
				form.setValue("code", ""); // Clear the failed code for the next try.
				form.setError(
					"code",
					{ message: codeAttempts.getCodeErrorMessage(error) },
					{ shouldFocus: true }
				);
			} else {
				toast.error(getAuthErrorMessage(error));
			}
		}
	});

	const resendCode = useMutation({
		mutationFn: () => sendSignInCode(email),
		onSuccess: () => {
			form.reset({ code: "" });
			codeAttempts.onCodeResent();
			toast.success("We sent you a new code");
		},
		onError: (error) => toast.error(getAuthErrorMessage(error))
	});
	// Stay busy after success while the dashboard loads.
	const isBusy = signIn.isPending || signIn.isSuccess;

	const submit = form.handleSubmit((values) => {
		// A used-up code can't work, so don't send it.
		if (codeAttempts.spentCodeMessage) {
			form.setError(
				"code",
				{ message: codeAttempts.spentCodeMessage },
				{ shouldFocus: true }
			);
			return;
		}
		signIn.mutate(values);
	});

	return (
		<>
			<AuthHeading
				description={
					<>
						We sent an email with a one-time code to{" "}
						<span className="font-medium">{email}</span>
					</>
				}
				title="Check your email"
			/>
			<form className="flex flex-col gap-6" noValidate onSubmit={submit}>
				<CodeField
					autoComplete="one-time-code"
					control={form.control}
					disabled={isBusy}
					hideLabel
					label="One-time code"
					length={VERIFICATION_CODE_LENGTH}
					name="code"
					onPasteComplete={submit}
					pattern={REGEXP_ONLY_DIGITS}
				/>
				<AuthActions className="items-center">
					<Button
						className="w-full"
						disabled={code.length < VERIFICATION_CODE_LENGTH || isBusy}
						type="submit"
					>
						{isBusy && <Spinner data-icon="inline-start" />}
						Sign in
					</Button>
					<button
						className="link inline-flex items-center gap-1.5 text-sm disabled:pointer-events-none disabled:opacity-50"
						disabled={resendCode.isPending || isBusy}
						onClick={() => resendCode.mutate()}
						type="button"
					>
						{resendCode.isPending && <Spinner />}
						Resend one-time code
					</button>
					<button
						className="link text-sm disabled:pointer-events-none disabled:opacity-50"
						disabled={isBusy}
						onClick={onChangeEmail}
						type="button"
					>
						Use a different email
					</button>
				</AuthActions>
			</form>
		</>
	);
}
