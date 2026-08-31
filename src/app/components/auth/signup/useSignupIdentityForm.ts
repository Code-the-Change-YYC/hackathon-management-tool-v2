"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "better-auth";
import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { createSignupIdentitySchema } from "@/lib/validation/signup";
import { getNameParts, resetSignupWizard, updateSignupWizard } from "./wizard";

type IdentityFormValues = z.input<
	ReturnType<typeof createSignupIdentitySchema>
>;

export function useSignupIdentityForm({ user }: { user?: User }) {
	const router = useRouter();
	const hasPrefilledSocialDetails = useRef(false);
	const { actions, state } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const isSocialRegistration =
		Boolean(user?.email) && state.signupWizard.method !== "email";
	const schema = createSignupIdentitySchema(!isSocialRegistration);
	const form = useForm<IdentityFormValues>({
		defaultValues: state.signupWizard,
		resolver: zodResolver(schema)
	});

	const onSubmit = (values: IdentityFormValues) => {
		actions.updateSignupWizard(values);
		router.push("/signup/event-details");
	};

	useEffect(() => {
		if (!isSocialRegistration || hasPrefilledSocialDetails.current || !user)
			return;
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

	return { form, isSocialRegistration, onSubmit };
}
