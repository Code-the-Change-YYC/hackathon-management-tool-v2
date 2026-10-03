"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { AuthActions } from "@/app/components/auth/AuthShell";
import { PasswordField } from "@/app/components/forms/PasswordField";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup, FieldSeparator } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { AUTH_ROUTES, getVerifyEmailHref } from "@/lib/routes";
import { type SignupValues, signupSchema } from "@/lib/validation/auth";
import { authClient } from "@/server/better-auth/client";
import {
	getAuthErrorMessage,
	hasAuthErrorCode,
	unwrapAuthResponse
} from "./auth-errors";
import { GoogleSignInButton } from "./GoogleSignInButton";
import { PasswordRequirements } from "./PasswordRequirements";

export function SignupForm({ googleFailed }: { googleFailed: boolean }) {
	const router = useRouter();
	const form = useForm<SignupValues>({
		defaultValues: { email: "", password: "" },
		resolver: zodResolver(signupSchema)
	});
	const password = useWatch({ control: form.control, name: "password" });

	const signUp = useMutation({
		mutationFn: async ({ email, password }: SignupValues) =>
			unwrapAuthResponse(
				// Names are collected on the first onboarding step.
				await authClient.signUp.email({ email, password, name: "" })
			),
		onSuccess: (_, { email }) => router.push(getVerifyEmailHref(email)),
		onError: (error) => {
			if (hasAuthErrorCode(error, "INVALID_EMAIL")) {
				form.setError(
					"email",
					{ message: getAuthErrorMessage(error) },
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
	// Stay busy after success while the verify page loads.
	const isBusy = signUp.isPending || signUp.isSuccess;

	return (
		<>
			<GoogleSignInButton
				errorCallbackURL={AUTH_ROUTES.signup}
				failed={googleFailed}
			/>
			<FieldSeparator className="my-0">OR</FieldSeparator>
			<form
				className="flex flex-col gap-6"
				noValidate
				onSubmit={form.handleSubmit((values) => signUp.mutate(values))}
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
						autoComplete="new-password"
						control={form.control}
						description={<PasswordRequirements password={password} />}
						disabled={isBusy}
						label="Password"
						name="password"
						placeholder="Password"
					/>
				</FieldGroup>
				<AuthActions>
					<Button className="w-full" disabled={isBusy} type="submit">
						{isBusy && <Spinner data-icon="inline-start" />}
						Sign Up
					</Button>
					<p className="text-center font-medium text-sm">
						Already have an account?{" "}
						<Link
							className="font-medium text-purple-800 text-sm underline-offset-4 hover:underline"
							href={AUTH_ROUTES.login}
						>
							Log In
						</Link>
					</p>
				</AuthActions>
			</form>
		</>
	);
}
