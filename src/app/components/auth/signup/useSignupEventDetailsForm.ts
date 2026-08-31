"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "better-auth";
import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
	type SignupEventDetails,
	type SignupEventDetailsInput,
	signupEventDetailsSchema
} from "@/lib/validation/signup";
import { useSignupMutations } from "../useAuthMutations";
import { createRegistrationStrategies } from "./registration-strategies";
import { getFullName, resetSignupWizard, updateSignupWizard } from "./wizard";

export function useSignupEventDetailsForm({ user }: { user?: User }) {
	const router = useRouter();
	const { actions, state } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const { emailSignUp, error, socialRegistrationCompletion } =
		useSignupMutations();
	const isSubmitting =
		emailSignUp.isPending || socialRegistrationCompletion.isPending;
	const form = useForm<SignupEventDetailsInput, undefined, SignupEventDetails>({
		defaultValues: state.signupWizard,
		resolver: zodResolver(signupEventDetailsSchema)
	});
	const registrationStrategies = createRegistrationStrategies({
		email: state.signupWizard.email,
		emailSignUp,
		password: state.signupWizard.password,
		socialRegistrationCompletion,
		userName: user?.name
	});

	const onSubmit = (values: SignupEventDetails) => {
		const name = getFullName(
			state.signupWizard.firstName,
			state.signupWizard.lastName
		);
		const strategy =
			state.signupWizard.method === "email"
				? registrationStrategies.email
				: registrationStrategies.social;
		const onSuccess = () => {
			actions.resetSignupWizard();
			router.push("/");
		};
		strategy.submit(values, name, onSuccess);
	};

	const handleDietaryRestrictionChange = (
		restriction: SignupEventDetailsInput["dietaryRestrictions"][number],
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
	useEffect(() => {
		if (!user && !state.signupWizard.email) router.push("/signup/identity");
	}, [state, router.push, user]);
	return {
		error,
		form,
		handleDietaryRestrictionChange,
		isSubmitting,
		onSubmit
	};
}
