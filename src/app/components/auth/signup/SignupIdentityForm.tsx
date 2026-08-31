"use client";

import type { User } from "better-auth";
import { useStateMachine } from "little-state-machine";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { getNameParts, resetSignupWizard, updateSignupWizard } from "./wizard";

type IdentityFormValues = {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
};

export default function SignupIdentityForm({ user }: { user?: User }) {
	const router = useRouter();
	const hasPrefilledSocialDetails = useRef(false);
	const { actions, state } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const isSocialRegistration =
		!!user?.email && state.signupWizard.method !== "email";
	const form = useForm<IdentityFormValues>({
		defaultValues: state.signupWizard
	});
	const onSubmit = (values: IdentityFormValues) => {
		actions.updateSignupWizard(values);
		router.push("/signup/event-details");
	};
	useEffect(() => {
		if (!isSocialRegistration || hasPrefilledSocialDetails.current) return;
		hasPrefilledSocialDetails.current = true;
		const name = getNameParts(user.name);
		const formState = {
			...name,
			email: user.email,
			password: ""
		};
		actions.updateSignupWizard(formState);
		form.reset(formState);
	}, [actions, form, user, isSocialRegistration]);
	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-muted-foreground text-sm">Step 2 of 3</p>
				<h3 className="font-semibold text-xl">Your details</h3>
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
				<Link href="/signup">
					<Button variant="outline">Back</Button>
				</Link>
				<Button type="submit">Continue to event details</Button>
			</div>
		</form>
	);
}
