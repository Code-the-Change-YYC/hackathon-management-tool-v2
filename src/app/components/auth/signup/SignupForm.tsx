"use client";

import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
	AuthDivider,
	AuthFooterLink,
	AuthHeading,
	AuthShell,
	GoogleAuthButton,
	PasswordInput,
	PasswordRequirements
} from "@/app/components/auth/AuthShell";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { authClient } from "@/server/better-auth/client";
import { useSignupMutations } from "../useAuthMutations";
import { resetSignupWizard, updateSignupWizard } from "./wizard";

const emailPattern = /^\S+@\S+\.\S+$/;

export default function SignupForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { actions } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const { error, socialSignIn } = useSignupMutations();

	useEffect(() => {
		if (!isSessionPending && session?.user.completedRegistration) {
			router.replace("/");
		}
	}, [isSessionPending, router, session?.user.completedRegistration]);

	const passwordRequirements = useMemo(
		() => [
			{ label: "Minimum 8 characters", met: password.length >= 8 },
			{ label: "At least one number", met: /\d/.test(password) },
			{
				label: "At least one special character",
				met: /[^A-Za-z0-9]/.test(password)
			}
		],
		[password]
	);
	const canSubmit =
		emailPattern.test(email) && passwordRequirements.every(({ met }) => met);

	const startEmailRegistration = (event: React.SubmitEvent) => {
		event.preventDefault();
		if (!canSubmit) {
			return;
		}

		socialSignIn.reset();
		actions.updateSignupWizard({ email, method: "email", password });
		router.push("/signup/identity");
	};

	const startSocialRegistration = () => {
		actions.updateSignupWizard({ method: "google", password: "" });
		socialSignIn.mutate({ provider: "google" });
	};

	if (isSessionPending || session?.user.completedRegistration) {
		return (
			<AuthShell>
				<p className="my-auto text-center text-grey-purple">
					Loading registration…
				</p>
			</AuthShell>
		);
	}

	return (
		<AuthShell>
			<div className="flex flex-1 flex-col justify-center gap-6">
				<AuthHeading>Welcome to Hack the Change 2026!</AuthHeading>
				<GoogleAuthButton
					disabled={socialSignIn.isPending}
					label={
						socialSignIn.isPending ? "Redirecting…" : "Sign up with Google"
					}
					onClick={startSocialRegistration}
				/>
				<AuthDivider />
				<form className="flex flex-col gap-6" onSubmit={startEmailRegistration}>
					<FieldGroup className="gap-4">
						<Field data-invalid={email.length > 0 && !emailPattern.test(email)}>
							<FieldLabel className="pl-4 text-sm" htmlFor="email">
								Email
							</FieldLabel>
							<Input
								aria-invalid={email.length > 0 && !emailPattern.test(email)}
								className="h-12 rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
								disabled={socialSignIn.isPending}
								id="email"
								onChange={(event) => setEmail(event.target.value)}
								placeholder="Email"
								required
								type="email"
								value={email}
							/>
						</Field>
						<Field>
							<FieldLabel className="pl-4 text-sm" htmlFor="password">
								Password
							</FieldLabel>
							<PasswordInput
								disabled={socialSignIn.isPending}
								id="password"
								onChange={(event) => setPassword(event.target.value)}
								value={password}
							/>
							<PasswordRequirements requirements={passwordRequirements} />
						</Field>
					</FieldGroup>
					<FieldError>{error?.message}</FieldError>
					<Button
						className="h-11 w-full rounded-xl"
						disabled={!canSubmit || socialSignIn.isPending}
						type="submit"
					>
						Sign Up
					</Button>
				</form>
				<AuthFooterLink
					href="/login"
					label="Log In"
					prefix="Already have an account?"
				/>
			</div>
		</AuthShell>
	);
}
