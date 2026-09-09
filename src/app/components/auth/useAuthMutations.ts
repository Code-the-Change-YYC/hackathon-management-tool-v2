"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { SignupEventDetailsInput } from "@/lib/validation/signup";
import { authClient } from "@/server/better-auth/client";
import { api } from "@/trpc/react";
import type { SocialProviderId } from "./social-providers";

type SocialSignInOptions = {
	errorCallbackURL: string;
};

function useSocialSignIn({ errorCallbackURL }: SocialSignInOptions) {
	return useMutation({
		mutationFn: async ({ provider }: { provider: SocialProviderId }) => {
			const result = await authClient.signIn.social({
				provider,
				callbackURL: "/signup/identity",
				newUserCallbackURL: "/signup/identity",
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
export function useAuthMutations({ variant }: { variant: "login" | "signup" }) {
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
			router.push(user?.completedRegistration ? "/" : "/signup/identity")
	});
	const errorCallbackURL = `/${variant}`;
	const socialSignIn = useSocialSignIn({
		errorCallbackURL
	});

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
	return {
		emailSignIn,
		emailSignUp,
		socialRegistrationCompletion,
		socialSignIn,
		isPending:
			emailSignIn.isPending ||
			socialSignIn.isPending ||
			socialRegistrationCompletion.isPending,
		error:
			emailSignIn.error ??
			socialRegistrationCompletion.error ??
			socialSignIn.error
	};
}
