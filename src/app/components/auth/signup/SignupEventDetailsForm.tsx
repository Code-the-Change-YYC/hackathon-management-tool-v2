"use client";

import { AddLine, CloseLine } from "@mingcute/react";
import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading, AuthShell } from "@/app/components/auth/AuthShell";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { cn } from "@/lib/utils";
import { authClient } from "@/server/better-auth/client";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction
} from "@/server/db/auth-schema";
import { useSignupMutations } from "../useAuthMutations";
import {
	getFullName,
	type MealOption,
	resetSignupWizard,
	updateSignupWizard
} from "./wizard";

const dietaryLabels: Record<DietaryRestriction, string> = {
	dairy_free: "Dairy-free",
	gluten_free: "Gluten-free",
	halal: "Halal",
	nut_allergy: "Nut allergy",
	other: "Other",
	vegetarian: "Vegetarian",
	vegan: "Vegan"
};

type EventDetailsFormValues = {
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
	const isAuthenticatedIncomplete =
		Boolean(session?.user) && !session?.user.completedRegistration;
	const isCompletingRegistration = useRef(false);
	const isSubmitting =
		emailSignUp.isPending || socialRegistrationCompletion.isPending;
	const form = useForm<EventDetailsFormValues>({
		defaultValues: {
			dietaryRestrictions: state.signupWizard.dietaryRestrictions,
			wantsFood: state.signupWizard.wantsFood
		}
	});
	const dietaryRestrictions = form.watch("dietaryRestrictions");
	const wantsFood = form.watch("wantsFood");

	useEffect(() => {
		if (isSessionPending) {
			return;
		}

		if (session?.user.completedRegistration) {
			router.replace("/");
			return;
		}

		if (
			!method &&
			!isAuthenticatedIncomplete &&
			!isCompletingRegistration.current
		) {
			router.replace(session?.user ? "/signup/identity" : "/signup");
		}
	}, [
		isAuthenticatedIncomplete,
		isSessionPending,
		method,
		router,
		session?.user
	]);

	if (isSessionPending || (!method && !isAuthenticatedIncomplete)) {
		return (
			<AuthShell background="food">
				<p className="my-auto text-center text-grey-purple">
					Loading registration…
				</p>
			</AuthShell>
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
			school: state.signupWizard.school,
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
					onError: () => {
						isCompletingRegistration.current = false;
					},
					onSuccess: () => {
						actions.resetSignupWizard();
						router.push("/login");
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
				onError: () => {
					isCompletingRegistration.current = false;
				},
				onSuccess: () => {
					actions.resetSignupWizard();
					router.push("/");
				}
			}
		);
	};

	const setDietaryRestrictions = (nextRestrictions: DietaryRestriction[]) => {
		form.setValue("dietaryRestrictions", nextRestrictions, {
			shouldDirty: true
		});
		actions.updateSignupWizard({ dietaryRestrictions: nextRestrictions });
	};

	return (
		<AuthShell background="food">
			<form
				className="my-auto flex w-full flex-col gap-6"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<AuthHeading>Fill out your food preferences</AuthHeading>
				<FieldGroup className="gap-4">
					<Field data-invalid={Boolean(form.formState.errors.wantsFood)}>
						<FieldLabel className="pl-4 text-sm" htmlFor="food">
							Do you want to be provided free meals at the hackathon?*
						</FieldLabel>
						<Select
							name="food"
							onValueChange={(value) => {
								const wantsFood = (value ?? "") as MealOption;
								form.setValue("wantsFood", wantsFood, {
									shouldDirty: true,
									shouldValidate: true
								});
								actions.updateSignupWizard({ wantsFood });
							}}
							value={wantsFood || null}
						>
							<SelectTrigger
								aria-invalid={Boolean(form.formState.errors.wantsFood)}
								className="h-12 w-full rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
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
						<FieldError errors={[form.formState.errors.wantsFood]} />
					</Field>
					<Field>
						<FieldLabel className="pl-4 text-grey-purple text-xs">
							Please indicate any dietary restrictions you may have:
						</FieldLabel>
						<div className="flex flex-col gap-5 rounded-2xl bg-background p-4 shadow-sm">
							<div className="flex flex-col gap-2">
								<p className="font-medium text-base">
									Your dietary restrictions:
								</p>
								<div className="flex flex-wrap gap-2">
									{dietaryRestrictions.length === 0 ? (
										<p className="text-grey-purple text-sm">None selected</p>
									) : (
										dietaryRestrictions.map((restriction) => (
											<button
												aria-label={`Remove ${dietaryLabels[restriction]}`}
												className="flex items-center gap-2 rounded-lg bg-lilac-purple px-4 py-1.5 font-medium text-awesomer-purple text-sm outline-none focus-visible:ring-3 focus-visible:ring-awesome-purple/30"
												disabled={isSubmitting}
												key={restriction}
												onClick={() =>
													setDietaryRestrictions(
														dietaryRestrictions.filter(
															(value) => value !== restriction
														)
													)
												}
												type="button"
											>
												{dietaryLabels[restriction]}
												<CloseLine aria-hidden="true" className="size-4" />
											</button>
										))
									)}
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<p className="font-medium text-sm">Add a restriction:</p>
								<div className="flex flex-wrap gap-2">
									{DIETARY_RESTRICTIONS.filter(
										(restriction) => !dietaryRestrictions.includes(restriction)
									).map((restriction) => (
										<button
											className={cn(
												"flex items-center gap-2 rounded-lg border border-medium-grey px-4 py-1.5 font-medium text-dark-grey text-sm outline-none focus-visible:ring-3 focus-visible:ring-awesome-purple/30",
												isSubmitting && "cursor-not-allowed opacity-50"
											)}
											disabled={isSubmitting}
											key={restriction}
											onClick={() =>
												setDietaryRestrictions([
													...dietaryRestrictions,
													restriction
												])
											}
											type="button"
										>
											{dietaryLabels[restriction]}
											<AddLine aria-hidden="true" className="size-4" />
										</button>
									))}
								</div>
							</div>
						</div>
					</Field>
				</FieldGroup>
				<FieldError>{error?.message}</FieldError>
				<Button
					className="h-11 w-full rounded-xl"
					disabled={isSubmitting}
					type="submit"
				>
					{isSubmitting ? "Saving…" : "Continue"}
				</Button>
			</form>
		</AuthShell>
	);
}
