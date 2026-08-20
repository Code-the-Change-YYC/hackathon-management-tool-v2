"use client";

import { createStore } from "little-state-machine";
import type { DietaryRestriction } from "@/server/db/auth-schema";
import type { SocialProviderId } from "../social-providers";

type SignupMethod = "email" | SocialProviderId | null;
export type MealOption = "yes" | "no" | "";

type SignupWizardState = {
	method: SignupMethod;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	school: string;
	dietaryRestrictions: DietaryRestriction[];
	wantsFood: MealOption;
};

const initialSignupWizardState: SignupWizardState = {
	method: null,
	firstName: "",
	lastName: "",
	email: "",
	password: "",
	school: "",
	dietaryRestrictions: [],
	wantsFood: ""
};

declare module "little-state-machine" {
	interface GlobalState {
		signupWizard: SignupWizardState;
	}
}

export function updateSignupWizard(
	state: { signupWizard: SignupWizardState },
	payload: Partial<SignupWizardState>
) {
	return {
		...state,
		signupWizard: {
			...state.signupWizard,
			...payload
		}
	};
}

export function resetSignupWizard(state: { signupWizard: SignupWizardState }) {
	return {
		...state,
		signupWizard: initialSignupWizardState
	};
}

export function getNameParts(name: string) {
	const [firstName = "", ...lastName] = name.trim().split(/\s+/);

	return {
		firstName,
		lastName: lastName.join(" ")
	};
}

export function getFullName(firstName: string, lastName: string) {
	return `${firstName.trim()} ${lastName.trim()}`.trim();
}

createStore(
	{ signupWizard: initialSignupWizardState },
	{
		name: "signup-wizard",
		persist: "none"
	}
);
