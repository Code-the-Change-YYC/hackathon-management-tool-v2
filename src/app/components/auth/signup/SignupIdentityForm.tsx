"use client";

import { useStateMachine } from "little-state-machine";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { authClient } from "@/server/better-auth/client";
import {
	enabledSocialProviders,
	type SocialProviderId
} from "../social-providers";
import { getNameParts, resetSignupWizard, updateSignupWizard } from "./wizard";

type IdentityFormValues = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

export default function SignupIdentityForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { actions, state } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const requestedProvider = searchParams.get("provider");
	const socialProvider = enabledSocialProviders.find(
		({ id }) => id === requestedProvider
	);
	const isSocialRegistration =
		Boolean(session?.user) &&
		!session?.user.completedRegistration &&
		Boolean(socialProvider);
	const form = useForm<IdentityFormValues>({
		defaultValues: state.signupWizard
	});

	useEffect(() => {
		if (isSessionPending) {
			return;
		}

		if (session?.user.completedRegistration) {
			router.replace("/");
			return;
		}

		const socialUser = isSocialRegistration ? session?.user : null;
		if (socialUser && socialProvider) {
			const name = getNameParts(socialUser.name);
			actions.updateSignupWizard({
				method: socialProvider.id as SocialProviderId,
				...name,
				email: socialUser.email,
				password: ""
			});
			form.reset({
				...name,
				email: socialUser.email,
				password: ""
			});
			return;
		}

		if (session?.user) {
			router.replace("/signup/event-details");
			return;
		}

		if (state.signupWizard.method !== "email") {
			router.replace("/signup");
		}
	}, [
		actions,
		form,
		isSocialRegistration,
		isSessionPending,
		router,
		session?.user,
		socialProvider,
		state.signupWizard.method
	]);

	if (
		isSessionPending ||
		(!isSocialRegistration &&
			!session?.user &&
			state.signupWizard.method !== "email")
	) {
		return (
			<p className="py-8 text-center text-muted-foreground">
				Loading registration…
			</p>
		);
	}

	if (session?.user.completedRegistration) {
		return (
			<p className="py-8 text-center text-muted-foreground">Taking you home…</p>
		);
	}

	const onSubmit = (values: IdentityFormValues) => {
		actions.updateSignupWizard(values);
		router.push("/signup/event-details");
	};

	const handleCancel = () => {
		actions.resetSignupWizard();
		router.push("/login");
	};

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-muted-foreground text-sm">Step 2 of 3</p>
				<h3 className="font-semibold text-xl">Your details</h3>
				{isSocialRegistration && (
					<p className="text-muted-foreground text-sm">
						Your {socialProvider?.label} account is connected. Review your
						details before continuing.
					</p>
				)}
			</div>

			<FieldGroup>
				<div className="grid grid-cols-1 gap-5 md:grid-cols-2">
					<Field data-invalid={Boolean(form.formState.errors.firstName)}>
						<FieldLabel htmlFor="firstName">First name</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.firstName)}
							disabled={form.formState.isSubmitting}
							id="firstName"
							{...form.register("firstName", {
								required: "First name is required"
							})}
						/>
						<FieldError errors={[form.formState.errors.firstName]} />
					</Field>

					<Field data-invalid={Boolean(form.formState.errors.lastName)}>
						<FieldLabel htmlFor="lastName">Last name</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.lastName)}
							disabled={form.formState.isSubmitting}
							id="lastName"
							{...form.register("lastName", {
								required: "Last name is required"
							})}
						/>
						<FieldError errors={[form.formState.errors.lastName]} />
					</Field>
				</div>

				<Field data-invalid={Boolean(form.formState.errors.email)}>
					<FieldLabel htmlFor="email">Email</FieldLabel>
					<Input
						aria-invalid={Boolean(form.formState.errors.email)}
						disabled={isSocialRegistration || form.formState.isSubmitting}
						id="email"
						readOnly={isSocialRegistration}
						type="email"
						{...form.register("email", {
							pattern: {
								message: "Enter a valid email address",
								value: /^\S+@\S+\.\S+$/
							},
							required: "Email is required"
						})}
					/>
					<FieldError errors={[form.formState.errors.email]} />
				</Field>

				{!isSocialRegistration && (
					<Field data-invalid={Boolean(form.formState.errors.password)}>
						<FieldLabel htmlFor="password">Password</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.password)}
							disabled={form.formState.isSubmitting}
							id="password"
							type="password"
							{...form.register("password", {
								required: "Password is required"
							})}
						/>
						<FieldError errors={[form.formState.errors.password]} />
					</Field>
				)}
			</FieldGroup>

			<div className="flex justify-between gap-3">
				<Button onClick={handleCancel} type="button" variant="outline">
					Cancel
				</Button>
				<Button type="submit">Continue to event details</Button>
			</div>
		</form>
	);
}
