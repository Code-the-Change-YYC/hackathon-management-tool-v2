"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { PasswordField } from "@/app/components/forms/PasswordField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { getSignedInHref } from "@/lib/onboarding";
import { AUTH_ROUTES, getVerifyEmailHref } from "@/lib/routes";
import { type LoginValues, loginSchema } from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import {
	getAuthErrorMessage,
	hasAuthErrorCode,
	unwrapAuthResponse
} from "./auth-errors";
import { GoogleSignInButton } from "./GoogleSignInButton";

export function LoginForm({ googleFailed }: { googleFailed: boolean }) {
	const router = useRouter();
	const form = useForm<LoginValues>({
		defaultValues: { email: "", password: "" },
		resolver: zodResolver(loginSchema)
	});

	const logIn = useMutation({
		mutationFn: async (values: LoginValues) =>
			unwrapAuthResponse(await authClient.signIn.email(values)),
		onSuccess: ({ user }) => router.replace(getSignedInHref(user)),
		onError: (error, { email }) => {
			if (hasAuthErrorCode(error, "EMAIL_NOT_VERIFIED")) {
				// Logging in sent a fresh code, so pick up where sign-up left off.
				toast("Verify your email to continue. We sent you a new code.");
				router.push(getVerifyEmailHref(email));
			} else if (hasAuthErrorCode(error, "INVALID_EMAIL_OR_PASSWORD")) {
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
	// Stay busy after success while the next page loads.
	const isBusy = logIn.isPending || logIn.isSuccess;

	return (
		<>
			<GoogleSignInButton
				errorCallbackURL={AUTH_ROUTES.login}
				failed={googleFailed}
			/>
			<FieldSeparator className="my-0">OR</FieldSeparator>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => logIn.mutate(values))}
			>
				<FieldGroup className="gap-6">
					<TextField
						autoComplete="email"
						control={form.control}
						disabled={isBusy}
						label="Email"
						name="email"
						placeholder="Email"
						type="email"
					/>
					<PasswordField
						autoComplete="current-password"
						control={form.control}
						disabled={isBusy}
						label="Password"
						name="password"
						placeholder="Password"
					/>
				</FieldGroup>
				<div className="flex flex-col gap-4">
					<Button className="w-full" disabled={isBusy} type="submit">
						{isBusy && <Spinner data-icon="inline-start" />}
						Log In
					</Button>
					<p className="text-center font-medium text-sm">
						Don't have an account yet?{" "}
						<Link
							className="font-medium text-purple-800 text-sm underline-offset-4 hover:underline"
							href={AUTH_ROUTES.signup}
						>
							Sign Up
						</Link>
					</p>
				</div>
			</form>
		</>
	);
}
