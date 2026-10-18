"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { FieldError } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import { AUTH_ROUTES, ONBOARDING_ROUTES } from "@/lib/routes";
import { authClient } from "@/server/better-auth/client";
import { getAuthErrorMessage, unwrapAuthResponse } from "./auth-errors";
import { GoogleLogo } from "./GoogleLogo";

function GoogleErrorMessage({
	error,
	onLoginPage
}: {
	error: string;
	onLoginPage: boolean;
}) {
	if (error === "access_denied") {
		return <>Google sign-in was cancelled.</>;
	}
	// `account_not_linked` means the email already has a password account that
	// was never verified, so Google can't be added to it until it is.
	if (error === "account_not_linked") {
		return (
			<>
				This email already has an account that isn’t verified yet.{" "}
				{onLoginPage ? (
					"Log in below with your email and password"
				) : (
					<Link className="link" href={AUTH_ROUTES.login}>
						Log in with your email and password
					</Link>
				)}{" "}
				or{" "}
				<Link className="link" href={AUTH_ROUTES.forgotPassword}>
					reset your password
				</Link>
				, then you can use Google.
			</>
		);
	}
	return <>We couldn’t sign you in with Google. Please try again.</>;
}

export function GoogleSignInButton({
	errorCallbackURL,
	error: initialError
}: {
	errorCallbackURL: string;
	error?: string;
}) {
	const [error, setError] = useState(initialError);

	// Drop the code from the URL, so reloading or sharing the page doesn't
	// show the message again. It stays on screen until Google is tried again.
	useEffect(() => {
		if (!initialError) return;
		const url = new URL(window.location.href);
		url.searchParams.delete("error");
		url.searchParams.delete("error_description");
		window.history.replaceState(null, "", url);
	}, [initialError]);

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
				onClick={() => {
					setError(undefined);
					signIn.mutate();
				}}
				type="button"
				variant="outline"
			>
				{isRedirecting ? (
					<Spinner data-icon="inline-start" />
				) : (
					<GoogleLogo data-icon="inline-start" />
				)}
				Continue with Google
			</Button>
			{error && (
				<FieldError className="text-center">
					<GoogleErrorMessage
						error={error}
						onLoginPage={errorCallbackURL === AUTH_ROUTES.login}
					/>
				</FieldError>
			)}
		</div>
	);
}
