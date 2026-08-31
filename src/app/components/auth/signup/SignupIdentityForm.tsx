"use client";

import type { User } from "better-auth";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { useSignupIdentityForm } from "./useSignupIdentityForm";

export default function SignupIdentityForm({ user }: { user?: User }) {
	const { form, isSocialRegistration, onSubmit } = useSignupIdentityForm({
		user
	});
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
							{...form.register("firstName")}
						/>
						<FieldError errors={[form.formState.errors.firstName]} />
					</Field>

					<Field data-invalid={Boolean(form.formState.errors.lastName)}>
						<FieldLabel htmlFor="lastName">Last name</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.lastName)}
							disabled={form.formState.isSubmitting}
							id="lastName"
							{...form.register("lastName")}
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
						{...form.register("email")}
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
							{...form.register("password")}
						/>
						<FieldError errors={[form.formState.errors.password]} />
					</Field>
				)}
			</FieldGroup>

			<div className="flex justify-between gap-3">
				<Button variant="outline">
					<Link href="/signup">Back</Link>
				</Button>
				<Button type="submit">Continue to event details</Button>
			</div>
		</form>
	);
}
