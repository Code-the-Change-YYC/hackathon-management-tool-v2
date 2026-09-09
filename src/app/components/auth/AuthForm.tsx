"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircleLine, CloseCircleLine } from "@mingcute/react";
import { useStateMachine } from "little-state-machine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode, SubmitEventHandler } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { signupCredentialsSchema } from "@/lib/validation/signup";
import { updateSignupWizard } from "./signup/wizard";
import {
	ENABLED_SOCIAL_PROVIDERS,
	type SocialProviderId
} from "./social-providers";
import { useAuthMutations } from "./useAuthMutations";

type SocialButtonsProps = {
	disabled: boolean;
	isPending: boolean;
	onProvider: (provider: SocialProviderId) => void;
};

type AuthCredentials = z.input<typeof signupCredentialsSchema>;

type AuthVariants = "login" | "signup";

function SocialButtons({
	disabled,
	isPending,
	onProvider
}: SocialButtonsProps) {
	return (
		<div className="flex flex-col gap-2">
			{ENABLED_SOCIAL_PROVIDERS.map(({ id, label, icon: Icon }) => (
				<Button
					className="h-auto min-h-11 w-full rounded-xl border-auth-border bg-transparent px-4 py-2 text-auth-text text-base hover:bg-muted"
					disabled={disabled}
					key={id}
					onClick={() => onProvider(id)}
					type="button"
					variant="outline"
				>
					<Icon aria-hidden="true" data-icon="inline-start" />
					{isPending ? "Redirecting…" : `Continue with ${label}`}
				</Button>
			))}
		</div>
	);
}

function AuthDivider() {
	return (
		<div aria-hidden="true" className="flex items-center gap-4">
			<div className="h-0.5 flex-1 rounded-full bg-auth-divider" />
			<span className="font-medium text-auth-divider text-sm">OR</span>
			<div className="h-0.5 flex-1 rounded-full bg-auth-divider" />
		</div>
	);
}

function AuthLayout({
	children,
	variant,
	form
}: {
	children: ReactNode;
	variant: AuthVariants;
	form: ReturnType<typeof useForm<AuthCredentials>>;
}) {
	const router = useRouter();
	const { actions } = useStateMachine({ actions: { updateSignupWizard } });
	const { emailSignIn, error, socialSignIn } = useAuthMutations({ variant });
	const onSubmit = (values: AuthCredentials) => {
		if (variant === "signup") {
			actions.updateSignupWizard({ method: "email", ...values });
			router.push("/signup/identity");
		} else {
			socialSignIn.reset();
			emailSignIn.mutate(values);
		}
	};
	const formSubmit: SubmitEventHandler<HTMLFormElement> = (e) => {
		e.preventDefault();
		void form.handleSubmit(onSubmit)(e);
	};

	const onSocialProvider = (provider: SocialProviderId) =>
		variant === "signup"
			? actions.updateSignupWizard({ method: provider, password: "" })
			: emailSignIn.reset();

	const isSocialPending = socialSignIn.isPending;
	const isPending = emailSignIn.isPending || isSocialPending;
	const disabled = form.formState.isSubmitting || isPending;
	const onProvider = (provider: SocialProviderId) => {
		onSocialProvider(provider);
		socialSignIn.mutate({ provider });
	};
	return (
		<form className="flex flex-col gap-6" onSubmit={formSubmit}>
			<h1 className="font-semibold text-3xl leading-9">
				Welcome to Hack the Change 2026!
			</h1>
			<SocialButtons
				disabled={disabled}
				isPending={isSocialPending}
				onProvider={onProvider}
			/>
			<AuthDivider />
			{children}
			{error && (
				<p className="text-destructive text-sm" role="alert">
					{error.message}
				</p>
			)}
		</form>
	);
}

function EmailField({
	form
}: {
	form: ReturnType<typeof useForm<AuthCredentials>>;
}) {
	return (
		<Field data-invalid={Boolean(form.formState.errors.email)}>
			<FieldLabel
				className="pl-4 font-normal text-auth-text text-sm"
				htmlFor="signup-email"
			>
				Email
			</FieldLabel>
			<Input
				aria-invalid={Boolean(form.formState.errors.email)}
				autoComplete="email"
				className="h-12 rounded-xl border-auth-border bg-transparent px-4 text-base focus-visible:border-auth-focus focus-visible:ring-auth-focus/30"
				disabled={form.formState.isSubmitting}
				id="signup-email"
				placeholder="Email"
				{...form.register("email")}
			/>
			<FieldError errors={[form.formState.errors.email]} />
		</Field>
	);
}

function PasswordField({
	form,
	variant
}: {
	form: ReturnType<typeof useForm<AuthCredentials>>;
	variant: AuthVariants;
}) {
	const password = form.watch("password");
	const isInvalid =
		variant !== "login" && Boolean(form.formState.errors.password);
	return (
		<Field data-invalid={isInvalid}>
			<FieldLabel
				className="pl-4 font-normal text-auth-focus text-sm"
				htmlFor="signup-password"
			>
				Password
			</FieldLabel>
			<Input
				aria-invalid={isInvalid}
				autoComplete="new-password"
				className="h-12 rounded-xl border-2 border-auth-focus bg-transparent px-4 text-base focus-visible:border-auth-focus focus-visible:ring-auth-focus/30"
				disabled={form.formState.isSubmitting}
				id="signup-password"
				placeholder="Password"
				type="password"
				{...form.register("password")}
			/>
			{variant === "signup" && (
				<>
					<div aria-live="polite" className="flex flex-col gap-1">
						{requirementItems.map(({ label, matches }) => {
							const matched = matches(password);
							const RequirementIcon = matched
								? CheckCircleLine
								: CloseCircleLine;
							return (
								<div
									className={`flex items-center gap-1 font-medium text-[11px] leading-4 ${matched ? "text-auth-success" : "text-auth-muted"}`}
									key={label}
								>
									<RequirementIcon aria-hidden="true" className="size-3" />
									<span>{label}</span>
								</div>
							);
						})}
					</div>
					<FieldError errors={[form.formState.errors.password]} />
				</>
			)}
		</Field>
	);
}

function ToggleAuth({ variant }: { variant: AuthVariants }) {
	const isLogin = variant === "login";
	return (
		<p className="text-center text-auth-text text-sm">
			{isLogin ? "Don't" : "Already"} have an account?{" "}
			<Link
				className="font-medium text-auth-link underline-offset-4 hover:underline"
				href={isLogin ? "/signup" : "/login"}
			>
				{isLogin ? "Sign Up" : "Log In"}
			</Link>
		</p>
	);
}

function LoginOptions() {
	return (
		<div className="flex items-center justify-between gap-3 text-auth-muted text-sm">
			<label className="flex items-center gap-2">
				<input className="accent-auth-primary" type="checkbox" />
				<span>Remember me?</span>
			</label>
			<button
				className="underline-offset-4 hover:text-auth-link hover:underline"
				type="button"
			>
				Forgot password?
			</button>
		</div>
	);
}

const requirementItems = [
	{
		label: "Minimum 8 characters",
		matches: (password: string) => password.length >= 8
	},
	{
		label: "At least one number",
		matches: (password: string) => /[0-9]/.test(password)
	},
	{
		label: "At least one special character",
		matches: (password: string) => /[^A-Za-z0-9]/.test(password)
	}
] as const;

export default function AuthForm({ variant }: { variant: AuthVariants }) {
	const form = useForm<AuthCredentials>({
		defaultValues: { email: "", password: "" },
		mode: "onChange",
		resolver: zodResolver(signupCredentialsSchema)
	});
	return (
		<AuthLayout form={form} variant={variant}>
			<FieldGroup className="gap-2">
				<EmailField form={form} />
				<PasswordField form={form} variant={variant} />
			</FieldGroup>
			{variant === "login" && <LoginOptions />}
			<Button
				className="h-auto min-h-11 w-full rounded-xl bg-auth-primary px-4 py-2 text-base text-white hover:bg-auth-focus disabled:bg-auth-primary/50"
				disabled={!form.formState.isValid || form.formState.isSubmitting}
				type="submit"
			>
				{variant === "signup" ? "Sign Up" : "Sign in"}
			</Button>
			<ToggleAuth variant={variant} />
		</AuthLayout>
	);
}
