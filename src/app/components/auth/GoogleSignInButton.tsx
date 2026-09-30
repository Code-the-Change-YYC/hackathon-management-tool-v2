"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { FieldError } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { authClient } from "@/server/better-auth/client";
import { getAuthErrorMessage, unwrapAuthResponse } from "./auth-errors";
import { GoogleLogo } from "./GoogleLogo";

export function GoogleSignInButton({
	children,
	errorCallbackURL,
	failed = false
}: {
	children: React.ReactNode;
	errorCallbackURL: string;
	failed?: boolean;
}) {
	const signIn = useMutation({
		mutationFn: async () =>
			unwrapAuthResponse(
				await authClient.signIn.social({
					provider: "google",
					// Onboarding sends each user on: to their next step, or their dashboard.
					callbackURL: ONBOARDING_ROUTES.start,
					errorCallbackURL
				})
			),
		onError: (error) => toast.error(getAuthErrorMessage(error))
	});
	// The browser navigates to Google once the request succeeds, so stay busy.
	const isRedirecting = signIn.isPending || signIn.isSuccess;

	// Coming back from Google with the back button restores this page as it was.
	const { reset } = signIn;
	useEffect(() => {
		function handlePageShow(event: PageTransitionEvent) {
			if (event.persisted) reset();
		}
		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, [reset]);

	return (
		<div className="flex flex-col gap-2">
			<Button
				className="w-full"
				disabled={isRedirecting}
				onClick={() => signIn.mutate()}
				type="button"
				variant="outline"
			>
				{isRedirecting ? (
					<Spinner data-icon="inline-start" />
				) : (
					<GoogleLogo data-icon="inline-start" />
				)}
				{children}
			</Button>
			{failed && (
				<FieldError className="text-center">
					We couldn't sign you in with Google. Please try again.
				</FieldError>
			)}
		</div>
	);
}
