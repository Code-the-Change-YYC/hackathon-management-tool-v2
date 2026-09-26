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
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { SCHOOLS } from "@/lib/validation/signup";
import { useSignupIdentityForm } from "./useSignupIdentityForm";

export default function SignupIdentityForm({ user }: { user?: User }) {
	const { form, onSubmit } = useSignupIdentityForm({ user });
	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<h1 className="font-semibold text-[28px] leading-9">
				Fill out your personal profile
			</h1>

			<FieldGroup className="gap-2">
				<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<Field data-invalid={Boolean(form.formState.errors.firstName)}>
						<FieldLabel
							className="pl-4 font-normal text-auth-text text-sm"
							htmlFor="firstName"
						>
							First name*
						</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.firstName)}
							autoComplete="given-name"
							className="h-12 rounded-xl border-auth-border bg-transparent px-4 text-base focus-visible:border-auth-focus focus-visible:ring-auth-focus/30"
							disabled={form.formState.isSubmitting}
							id="firstName"
							{...form.register("firstName")}
						/>
						<FieldError errors={[form.formState.errors.firstName]} />
					</Field>

					<Field data-invalid={Boolean(form.formState.errors.lastName)}>
						<FieldLabel
							className="pl-4 font-normal text-auth-text text-sm"
							htmlFor="lastName"
						>
							Last name*
						</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.lastName)}
							autoComplete="family-name"
							className="h-12 rounded-xl border-auth-border bg-transparent px-4 text-base focus-visible:border-auth-focus focus-visible:ring-auth-focus/30"
							disabled={form.formState.isSubmitting}
							id="lastName"
							{...form.register("lastName")}
						/>
						<FieldError errors={[form.formState.errors.lastName]} />
					</Field>
				</div>

				<Field data-invalid={Boolean(form.formState.errors.school)}>
					<FieldLabel
						className="pl-4 font-normal text-auth-text text-sm"
						htmlFor="school"
					>
						Which institution are you attending?*
					</FieldLabel>
					<Select
						disabled={form.formState.isSubmitting}
						onValueChange={(value) =>
							form.setValue("school", value ?? "", {
								shouldDirty: true,
								shouldValidate: true
							})
						}
						value={form.watch("school")}
					>
						<SelectTrigger
							aria-invalid={Boolean(form.formState.errors.school)}
							className="h-12 w-full rounded-xl border-2 border-auth-focus bg-transparent px-4 text-base focus-visible:ring-auth-focus/30"
							id="school"
						>
							<SelectValue placeholder="Select an institution" />
						</SelectTrigger>
						<SelectContent>
							<SelectGroup>
								{SCHOOLS.map((school) => (
									<SelectItem key={school} value={school}>
										{school}
									</SelectItem>
								))}
							</SelectGroup>
						</SelectContent>
					</Select>
					<FieldError errors={[form.formState.errors.school]} />
				</Field>
			</FieldGroup>

			<div className="flex flex-col gap-4">
				<Button
					className="h-auto min-h-11 w-full rounded-xl bg-auth-primary px-4 py-2 text-base text-white hover:bg-auth-focus disabled:bg-auth-primary/50"
					disabled={!form.formState.isValid || form.formState.isSubmitting}
					type="submit"
				>
					Continue
				</Button>
				<Button
					className="h-auto min-h-11 rounded-xl border-auth-border bg-transparent px-4 py-2 text-auth-text hover:bg-muted"
					type="button"
					variant="outline"
				>
					<Link href="/signup">Back</Link>
				</Button>
			</div>
		</form>
	);
}
