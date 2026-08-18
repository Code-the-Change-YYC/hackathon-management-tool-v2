"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { authClient } from "@/server/better-auth/client";
import type { DietaryRestriction, PROGRAMS } from "@/server/db/auth-schema";
import { api } from "@/trpc/react";

export type RegistrationDetails = {
	school: string;
	program?: (typeof PROGRAMS)[number];
	dietaryRestrictions: DietaryRestriction[];
	wantsFood: "yes" | "no";
};

function useGoogleSignIn(errorCallbackURL: string) {
	return useMutation({
		mutationFn: async () => {
			const result = await authClient.signIn.social({
				provider: "google",
				callbackURL: "/",
				newUserCallbackURL: "/signup",
				errorCallbackURL
			});

			if (result.error) {
				throw new Error(
					result.error.message || "Failed to start Google sign in"
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
				throw new Error(result.error.message || "Failed to sign in");
			}
		},
		onSuccess: () => router.push("/")
	});
	const googleSignIn = useGoogleSignIn("/login");

	return {
		emailSignIn,
		googleSignIn,
		isPending: emailSignIn.isPending || googleSignIn.isPending,
		error: emailSignIn.error ?? googleSignIn.error
	};
}

export function useSignupMutations() {
	const router = useRouter();
	const completeRegistration = api.users.completeRegistration.useMutation();
	const emailSignUp = useMutation({
		mutationFn: async ({
			details,
			email,
			name,
			password
		}: {
			details: RegistrationDetails;
			email: string;
			name: string;
			password: string;
		}) => {
			const result = await authClient.signUp.email({ email, name, password });

			if (result.error) {
				throw new Error(result.error.message || "Failed to sign up");
			}

			await completeRegistration.mutateAsync(details);
		},
		onSuccess: () => router.push("/login")
	});
	const googleRegistrationCompletion = useMutation({
		mutationFn: (details: RegistrationDetails) =>
			completeRegistration.mutateAsync(details),
		onSuccess: () => router.push("/")
	});
	const googleSignIn = useGoogleSignIn("/signup");

	return {
		emailSignUp,
		googleRegistrationCompletion,
		googleSignIn,
		isPending:
			emailSignUp.isPending ||
			googleRegistrationCompletion.isPending ||
			googleSignIn.isPending,
		error:
			emailSignUp.error ??
			googleRegistrationCompletion.error ??
			googleSignIn.error
	};
}
