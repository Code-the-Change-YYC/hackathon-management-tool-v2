import type { User } from "better-auth";

import type { SignupEventDetails } from "@/lib/validation/signup";
import type { useSignupMutations } from "../useAuthMutations";

type SignupMutations = ReturnType<typeof useSignupMutations>;

export type RegistrationStrategy = {
	submit: (
		details: SignupEventDetails,
		name: string,
		onSuccess: () => void
	) => void;
};

export class EmailRegistrationStrategy implements RegistrationStrategy {
	constructor(
		private readonly mutation: SignupMutations["emailSignUp"],
		private readonly email: string,
		private readonly password: string
	) {}

	submit(details: SignupEventDetails, name: string, onSuccess: () => void) {
		this.mutation.mutate(
			{
				details,
				email: this.email,
				name,
				password: this.password
			},
			{ onSuccess }
		);
	}
}

export class SocialRegistrationStrategy implements RegistrationStrategy {
	constructor(
		private readonly mutation: SignupMutations["socialRegistrationCompletion"],
		private readonly userName?: User["name"]
	) {}

	submit(details: SignupEventDetails, name: string, onSuccess: () => void) {
		this.mutation.mutate(
			{
				details,
				name: name === this.userName ? undefined : name
			},
			{ onSuccess }
		);
	}
}

export function createRegistrationStrategies({
	email,
	emailSignUp,
	password,
	socialRegistrationCompletion,
	userName
}: {
	email: User["email"];
	emailSignUp: SignupMutations["emailSignUp"];
	password: string;
	socialRegistrationCompletion: SignupMutations["socialRegistrationCompletion"];
	userName?: User["name"];
}) {
	return {
		email: new EmailRegistrationStrategy(emailSignUp, email, password),
		social: new SocialRegistrationStrategy(
			socialRegistrationCompletion,
			userName
		)
	};
}
