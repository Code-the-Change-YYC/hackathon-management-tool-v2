"use client";

import { AddLine, CloseLine } from "@mingcute/react";
import type { User } from "better-auth";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet
} from "@/app/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction
} from "@/lib/validation/signup";
import { useSignupEventDetailsForm } from "./useSignupEventDetailsForm";

const restrictionLabel = (restriction: DietaryRestriction) => {
	switch (restriction) {
		case "gluten_free":
			return "Gluten-free";
		default:
			return restriction.charAt(0).toUpperCase() + restriction.slice(1);
	}
};

export default function SignupEventDetailsForm({ user }: { user?: User }) {
	const {
		error,
		form,
		handleDietaryRestrictionChange,
		isSubmitting,
		onSubmit
	} = useSignupEventDetailsForm({ user });
	const selectedRestrictions = form.watch("dietaryRestrictions");
	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<h1 className="font-semibold text-[28px] leading-9">
				Fill out your food preferences
			</h1>

			<FieldGroup className="gap-2">
				<Controller
					control={form.control}
					name="wantsFood"
					render={({ field, fieldState }) => (
						<Field data-invalid={fieldState.invalid}>
							<FieldLabel
								className="pl-4 font-normal text-auth-text text-sm"
								htmlFor="food"
							>
								Do you want to be provided free meals at the hackathon?*
							</FieldLabel>
							<Select
								disabled={isSubmitting}
								onValueChange={(value) => field.onChange(value ?? "")}
								value={field.value}
							>
								<SelectTrigger
									aria-invalid={fieldState.invalid}
									className="h-12 w-full rounded-xl border-auth-border bg-transparent px-4 text-base focus-visible:border-auth-focus focus-visible:ring-auth-focus/30"
									id="food"
								>
									<SelectValue placeholder="Please select an option" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="yes">Yes</SelectItem>
										<SelectItem value="no">No</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							<FieldError errors={[fieldState.error]} />
						</Field>
					)}
				/>

				<FieldSet>
					<FieldLegend>Your dietary restrictions:</FieldLegend>
					<div className="flex flex-col gap-2">
						<div className="flex flex-wrap gap-2">
							{selectedRestrictions.map((restriction) => (
								<Button
									aria-pressed="true"
									className="h-auto rounded-lg bg-auth-primary/10 px-4 py-1.5 text-auth-link hover:bg-auth-primary/20"
									key={restriction}
									onClick={() =>
										handleDietaryRestrictionChange(restriction, false)
									}
									type="button"
									variant="ghost"
								>
									{restrictionLabel(restriction)}
									<CloseLine aria-hidden="true" data-icon="inline-end" />
								</Button>
							))}
						</div>
					</div>

					<div className="flex flex-col gap-2">
						<p className="font-medium text-auth-text text-sm">
							Add a restriction:
						</p>
						<div className="flex flex-wrap gap-2">
							{DIETARY_RESTRICTIONS.filter(
								(restriction) => !selectedRestrictions.includes(restriction)
							).map((restriction) => (
								<Button
									aria-pressed="false"
									className="h-auto rounded-lg border-auth-divider px-4 py-1.5 text-auth-text hover:bg-muted"
									key={restriction}
									onClick={() =>
										handleDietaryRestrictionChange(restriction, true)
									}
									type="button"
									variant="outline"
								>
									{restrictionLabel(restriction)}
									<AddLine aria-hidden="true" data-icon="inline-end" />
								</Button>
							))}
						</div>
					</div>
				</FieldSet>
			</FieldGroup>

			{error && (
				<p className="text-destructive text-sm" role="alert">
					{error.message}
				</p>
			)}

			<div className="flex flex-col gap-4">
				<Button
					className="h-auto min-h-11 w-full rounded-xl bg-auth-primary px-4 py-2 text-base text-white hover:bg-auth-focus disabled:bg-auth-primary/50"
					disabled={isSubmitting}
					type="submit"
				>
					{isSubmitting ? "Saving…" : "Continue"}
				</Button>
				<Button
					className="h-auto min-h-11 rounded-xl border-auth-border bg-transparent px-4 py-2 text-auth-text hover:bg-muted"
					type="button"
					variant="outline"
				>
					<Link href="/signup/identity">Back</Link>
				</Button>
			</div>
		</form>
	);
}
