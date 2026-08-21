"use client";

import { useStateMachine } from "little-state-machine";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/app/components/ui/button";
import { FieldError } from "@/app/components/ui/field";
import { authClient } from "@/server/better-auth/client";
import {
	ENABLED_SOCIAL_PROVIDERS,
	type SocialProviderId
} from "../social-providers";
import { useSignupMutations } from "../useAuthMutations";
import { resetSignupWizard, updateSignupWizard } from "./wizard";

export default function SignupForm() {
	const router = useRouter();
	const { actions } = useStateMachine({
		actions: { resetSignupWizard, updateSignupWizard }
	});
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const { error, socialSignIn } = useSignupMutations();

	useEffect(() => {
		if (!isSessionPending && session?.user.completedRegistration) {
			router.replace("/");
		}
	}, [isSessionPending, router, session?.user.completedRegistration]);

	const startEmailRegistration = () => {
		socialSignIn.reset();
		actions.updateSignupWizard({ method: "email" });
		router.push("/signup/identity");
	};

	const startSocialRegistration = (provider: SocialProviderId) => {
		actions.updateSignupWizard({ method: provider, password: "" });
		socialSignIn.mutate({ provider });
	};

	if (isSessionPending || session?.user.completedRegistration) {
		return (
			<p className="py-8 text-center text-muted-foreground">
				Loading registration…
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col gap-1">
				<p className="font-medium text-muted-foreground text-sm">Step 1 of 3</p>
				<h3 className="font-semibold text-xl">Choose how to sign up</h3>
			</div>

			<div className="flex flex-col gap-3">
				<Button
					onClick={startEmailRegistration}
					type="button"
					variant="outline"
				>
					Continue with email and password
				</Button>
				{ENABLED_SOCIAL_PROVIDERS.map(({ icon: Icon, id, label }) => (
					<Button
						disabled={socialSignIn.isPending}
						key={id}
						onClick={() => startSocialRegistration(id)}
						type="button"
						variant="outline"
					>
						<Icon aria-hidden="true" data-icon="inline-start" />
						{socialSignIn.isPending ? "Redirecting…" : `Continue with ${label}`}
					</Button>
				))}
			</div>

			{error && <FieldError>{error.message}</FieldError>}
		</div>
	);
}
