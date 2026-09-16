"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "better-auth";
import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { signupPersonalDetailsSchema } from "@/lib/validation/signup";
import { getNameParts, updateSignupWizard } from "./wizard";

type IdentityFormValues = z.input<typeof signupPersonalDetailsSchema>;

export function useSignupIdentityForm({ user }: { user?: User }) {
	const router = useRouter();
	const hasPrefilledSocialDetails = useRef(false);
	const { actions, state } = useStateMachine({
		actions: { updateSignupWizard }
	});
	const form = useForm<IdentityFormValues>({
		defaultValues: {
			firstName: state.signupWizard.firstName,
			lastName: state.signupWizard.lastName,
			school: state.signupWizard.school
		},
		mode: "onChange",
		resolver: zodResolver(signupPersonalDetailsSchema)
	});

	const onSubmit = (values: IdentityFormValues) => {
		actions.updateSignupWizard(values);
		router.push("/signup/event-details");
	};

	useEffect(() => {
		if (!user || hasPrefilledSocialDetails.current) return;
		hasPrefilledSocialDetails.current = true;
		const name = getNameParts(user.name);
		const formState = {
			...name,
			school: state.signupWizard.school
		};
		actions.updateSignupWizard({ email: user.email, ...formState });
		form.reset(formState);
	}, [actions, form, state.signupWizard.school, user]);
	useEffect(() => {
		if (!user && !state.signupWizard.email) router.push("/signup");
	}, [state, router.push, user]);

	return { form, onSubmit };
}
