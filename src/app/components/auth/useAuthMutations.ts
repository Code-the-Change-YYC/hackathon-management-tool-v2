"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { SignupEventDetailsInput } from "@/lib/validation/signup";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import type { SocialProviderId } from "./social-providers";

type SocialSignInOptions = {
	errorCallbackURL: string;
	newUserCallbackURL: string;
};

function useSocialSignIn({
	errorCallbackURL,
	newUserCallbackURL
}: SocialSignInOptions) {
	return useMutation({
		mutationFn: async ({ provider }: { provider: SocialProviderId }) => {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: "/signup/event-details",
				newUserCallbackURL,
				errorCallbackURL
			});

			if (result.error) {
				throw new Error(
					result.error.message || "Failed to start social sign in"
				);
			}
		}
	});
}

export function useLoginMutations() {
	const router = useRouter();
	const emailSignIn = useMutation({
		mutationFn: async (credentials: { email: string; password: string }) => {
			const result = await authClient.signIn.email(credentials);

			if (result.error) {
				if (result.error.code === "INVALID_EMAIL_OR_PASSWORD") {
					throw new Error("Incorrect email or password");
				}

				throw new Error(result.error.message || "Failed to sign in");
			}

			return result.data?.user;
		},
		onSuccess: (user) =>
			router.push(user?.completedRegistration ? "/" : "/signup/event-details")
	});
	const socialSignIn = useSocialSignIn({
		errorCallbackURL: "/login",
		newUserCallbackURL: "/signup/identity"
	});

	return {
		emailSignIn,
		socialSignIn,
		isPending: emailSignIn.isPending || socialSignIn.isPending,
		error: emailSignIn.error ?? socialSignIn.error
	};
}

export function useSignupMutations() {
	const completeRegistration = api.users.completeRegistration.useMutation();
	const emailSignUp = useMutation({
		mutationFn: async ({
			details,
			email,
			name,
			password
		}: {
			details: SignupEventDetailsInput;
			email: string;
			name: string;
			password: string;
		}) => {
			const result = await authClient.signUp.email({ email, name, password });

			if (result.error) {
				throw new Error(result.error.message || "Failed to sign up");
			}

			await completeRegistration.mutateAsync(details);
		}
	});
	const socialRegistrationCompletion = useMutation({
		mutationFn: async ({
			details,
			name
		}: {
			details: SignupEventDetailsInput;
			name?: string;
		}) => {
			if (name) {
				const result = await authClient.updateUser({ name });

				if (result.error) {
					throw new Error(result.error.message || "Failed to update your name");
				}
			}

			await completeRegistration.mutateAsync(details);
		}
	});
	const socialSignIn = useSocialSignIn({
		errorCallbackURL: "/signup",
		newUserCallbackURL: "/signup/identity"
	});

	return {
		emailSignUp,
		socialRegistrationCompletion,
		socialSignIn,
		isPending:
			emailSignUp.isPending ||
			socialRegistrationCompletion.isPending ||
			socialSignIn.isPending,
		error:
			emailSignUp.error ??
			socialRegistrationCompletion.error ??
			socialSignIn.error
	};
}
