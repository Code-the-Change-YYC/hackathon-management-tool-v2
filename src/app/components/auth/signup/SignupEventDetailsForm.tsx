"use client";

import type { User } from "better-auth";
import Link from "next/link";
import { Controller } from "react-hook-form";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
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
	PROGRAMS,
	SCHOOLS
} from "@/lib/validation/signup";
import { useSignupEventDetailsForm } from "./useSignupEventDetailsForm";

export default function SignupEventDetailsForm({ user }: { user?: User }) {
	const {
		error,
		form,
		handleDietaryRestrictionChange,
		isSubmitting,
		onSubmit
	} = useSignupEventDetailsForm({ user });

	return (
		<form
			className="flex flex-col gap-6"
			onSubmit={form.handleSubmit(onSubmit)}
		>
			<div className="flex flex-col gap-1">
				<p className="font-medium text-muted-foreground text-sm">Step 3 of 3</p>
				<h3 className="font-semibold text-xl">Event details</h3>
			</div>

			<FieldGroup>
				<Controller
					control={form.control}
					name="school"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="school">
								Which institution do you go to?
							</FieldLabel>
							<Select
								disabled={isSubmitting}
								onValueChange={(value) => field.onChange(value ?? "")}
								value={field.value}
							>
								<SelectTrigger className="w-full" id="school">
									<SelectValue placeholder="Select institution" />
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
						</Field>
					)}
				/>

				<Controller
					control={form.control}
					name="program"
					render={({ field }) => (
						<Field>
							<FieldLabel htmlFor="program">
								Which program are you in?
							</FieldLabel>
							<Select
								disabled={isSubmitting}
								onValueChange={(value) => field.onChange(value ?? "")}
								value={field.value}
							>
								<SelectTrigger className="w-full" id="program">
									<SelectValue placeholder="Select program" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{PROGRAMS.map((program) => (
											<SelectItem
												className="capitalize"
												key={program}
												value={program}
											>
												{program.split("_").join(" ")}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
						</Field>
					)}
				/>

				<Controller
					control={form.control}
					name="wantsFood"
					render={({ field }) => (
						<Field data-invalid={Boolean(form.formState.errors.wantsFood)}>
							<FieldLabel htmlFor="food">
								Do you want provided food at the hackathon?
							</FieldLabel>
							<Select
								disabled={isSubmitting}
								onValueChange={(value) => field.onChange(value ?? "")}
								value={field.value}
							>
								<SelectTrigger
									aria-invalid={Boolean(form.formState.errors.wantsFood)}
									className="w-full"
									id="food"
								>
									<SelectValue placeholder="Select an option" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										<SelectItem value="yes">Yes</SelectItem>
										<SelectItem value="no">No</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
							<FieldError errors={[form.formState.errors.wantsFood]} />
						</Field>
					)}
					rules={{ required: "Select whether you want provided food" }}
				/>

				<FieldSet>
					<FieldLegend variant="label">Dietary restrictions</FieldLegend>
					{DIETARY_RESTRICTIONS.map((restriction) => {
						const id = `dietary-${restriction}`;

						return (
							<Field key={restriction} orientation="horizontal">
								<Checkbox
									checked={form
										.watch("dietaryRestrictions")
										.includes(restriction)}
									disabled={isSubmitting}
									id={id}
									onCheckedChange={(checked) =>
										handleDietaryRestrictionChange(restriction, checked)
									}
								/>
								<FieldLabel htmlFor={id}>
									{restriction.replace("_", " ")}
								</FieldLabel>
							</Field>
						);
					})}
				</FieldSet>
			</FieldGroup>

			{error && <FieldError>{error.message}</FieldError>}

			<div className="flex justify-between gap-3">
				<Button disabled={isSubmitting} type="button" variant="outline">
					<Link href={"/signup/identity"}>Back</Link>
				</Button>
				<Button disabled={isSubmitting} type="submit">
					{isSubmitting ? "Saving…" : "Complete registration"}
				</Button>
			</div>
		</form>
	);
}
