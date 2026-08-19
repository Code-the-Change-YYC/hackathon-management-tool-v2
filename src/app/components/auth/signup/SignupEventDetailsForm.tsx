"use client";

import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

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
import { authClient } from "@/server/better-auth/client";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction,
	PROGRAMS
} from "@/server/db/auth-schema";
import { useSignupMutations } from "../useAuthMutations";
import {
	getFullName,
	type MealOption,
	type ProgramValue,
	resetSignupWizard,
	updateSignupWizard
} from "./wizard";

type EventDetailsFormValues = {
	school: string;
	program: ProgramValue;
	dietaryRestrictions: DietaryRestriction[];
	wantsFood: MealOption;
};

export default function SignupEventDetailsForm() {
	const router = useRouter();
	const { actions, state } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const { emailSignUp, error, socialRegistrationCompletion } =
		useSignupMutations();
	const method = state.signupWizard.method;
	const isCompletingRegistration = useRef(false);
	const isSubmitting =
		emailSignUp.isPending || socialRegistrationCompletion.isPending;
	const form = useForm<EventDetailsFormValues>({
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

		if (!method && !isCompletingRegistration.current) {
			router.replace(session?.user ? "/signup/identity" : "/signup");
		}
	}, [isSessionPending, method, router, session?.user]);

	if (isSessionPending || !method) {
		return (
			<p className="py-8 text-center text-muted-foreground">
				Loading registration…
			</p>
		);
	}

	const onSubmit = (values: EventDetailsFormValues) => {
		if (values.wantsFood === "") {
			form.setError("wantsFood", {
				message: "Select whether you want provided food"
			});
			return;
		}

		const details = {
			dietaryRestrictions: values.dietaryRestrictions,
			program: values.program || undefined,
			school: values.school,
			wantsFood: values.wantsFood
		};
		isCompletingRegistration.current = true;

		if (method === "email") {
			emailSignUp.mutate(
				{
					details,
					email: state.signupWizard.email,
					name: getFullName(
						state.signupWizard.firstName,
						state.signupWizard.lastName
					),
					password: state.signupWizard.password
				},
				{
					onSuccess: () => {
						actions.resetSignupWizard();
						router.push("/login");
					},
					onError: () => {
						isCompletingRegistration.current = false;
					}
				}
			);
			return;
		}

		const name = getFullName(
			state.signupWizard.firstName,
			state.signupWizard.lastName
		);
		socialRegistrationCompletion.mutate(
			{
				details,
				name: name === session?.user.name ? undefined : name
			},
			{
				onSuccess: () => {
					actions.resetSignupWizard();
					router.push("/");
				},
				onError: () => {
					isCompletingRegistration.current = false;
				}
			}
		);
	};

	const handleBack = () => {
		actions.updateSignupWizard(form.getValues());
		router.push("/signup/identity");
	};

	const handleDietaryRestrictionChange = (
		restriction: DietaryRestriction,
		checked: boolean
	) => {
		const current = form.getValues("dietaryRestrictions");
		form.setValue(
			"dietaryRestrictions",
			checked
				? [...new Set([...current, restriction])]
				: current.filter((value) => value !== restriction),
			{ shouldDirty: true }
		);
	};

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
				<Field>
					<FieldLabel htmlFor="school">
						Which institution do you go to?
					</FieldLabel>
					<select
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isSubmitting}
						id="school"
						{...form.register("school")}
					>
						<option value="">Select institution</option>
						<option value="University of Calgary">University of Calgary</option>
						<option value="Mount Royal University">
							Mount Royal University
						</option>
						<option value="SAIT">SAIT</option>
						<option value="Other">Other</option>
					</select>
				</Field>

				<Field>
					<FieldLabel htmlFor="program">Which program are you in?</FieldLabel>
					<select
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isSubmitting}
						id="program"
						{...form.register("program")}
					>
						<option value="">Select program</option>
						{PROGRAMS.map((program) => (
							<option key={program} value={program}>
								{program
									.split("_")
									.map((word) => word[0]?.toUpperCase() + word.slice(1))
									.join(" ")}
							</option>
						))}
					</select>
				</Field>

				<Field data-invalid={Boolean(form.formState.errors.wantsFood)}>
					<FieldLabel htmlFor="food">
						Do you want provided food at the hackathon?
					</FieldLabel>
					<select
						aria-invalid={Boolean(form.formState.errors.wantsFood)}
						className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
						disabled={isSubmitting}
						id="food"
						{...form.register("wantsFood", {
							required: "Select whether you want provided food"
						})}
					>
						<option value="">Select an option</option>
						<option value="yes">Yes</option>
						<option value="no">No</option>
					</select>
					<FieldError errors={[form.formState.errors.wantsFood]} />
				</Field>

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
				<Button
					disabled={isSubmitting}
					onClick={handleBack}
					type="button"
					variant="outline"
				>
					Back
				</Button>
				<Button disabled={isSubmitting} type="submit">
					{isSubmitting ? "Saving…" : "Complete registration"}
				</Button>
			</div>
		</form>
	);
}
