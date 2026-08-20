"use client";

import { useState } from "react";

import {
	AuthDivider,
	AuthFooterLink,
	AuthHeading,
	AuthShell,
	GoogleAuthButton,
	PasswordInput
} from "@/app/components/auth/AuthShell";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useLoginMutations } from "../useAuthMutations";

export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { emailSignIn, error, isPending, socialSignIn } = useLoginMutations();

	const handleSubmit = (event: React.SubmitEvent) => {
		event.preventDefault();
		socialSignIn.reset();
		emailSignIn.mutate({ email, password });
	};

	return (
		<AuthShell>
			<div className="flex flex-1 flex-col justify-center gap-6">
				<AuthHeading>Welcome back to Hack the Change!</AuthHeading>
				<GoogleAuthButton
					disabled={isPending}
					label={
						socialSignIn.isPending ? "Redirecting…" : "Sign in with Google"
					}
					onClick={() => {
						emailSignIn.reset();
						socialSignIn.mutate({ provider: "google" });
					}}
				/>
				<AuthDivider />
				<form className="flex flex-col gap-6" onSubmit={handleSubmit}>
					<FieldGroup className="gap-4">
						<Field>
							<FieldLabel className="pl-4 text-sm" htmlFor="email">
								Email
							</FieldLabel>
							<Input
								className="h-12 rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
								disabled={isPending}
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
								disabled={isPending}
								id="password"
								onChange={(event) => setPassword(event.target.value)}
								value={password}
							/>
						</Field>
					</FieldGroup>
					<FieldError>{error?.message}</FieldError>
					<Button
						className="h-11 w-full rounded-xl"
						disabled={isPending}
						type="submit"
					>
						{emailSignIn.isPending ? "Signing in…" : "Sign in"}
					</Button>
				</form>
				<AuthFooterLink
					href="/signup"
					label="Create an account"
					prefix="Don't have an account?"
				/>
			</div>
		</AuthShell>
	);
}
