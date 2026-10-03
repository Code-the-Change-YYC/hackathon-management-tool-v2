import type { Metadata } from "next";
import { AuthHeading } from "@/app/components/auth/AuthShell";
import { MlhPoliciesForm } from "@/app/components/onboarding/MlhPoliciesForm";
import { OnboardingSteps } from "@/app/components/onboarding/OnboardingSteps";
import { requireOnboardingStep } from "@/server/better-auth/auth-helpers/helpers";

export const metadata: Metadata = {
	title: "MLH policies"
};

export default async function MlhPoliciesPage() {
	const user = await requireOnboardingStep("mlhPolicies");

	return (
		<>
			<AuthHeading
				description="Hack the Change is an official Major League Hacking (MLH) Member Event."
				title="Review the MLH policies"
			>
				<OnboardingSteps current="mlhPolicies" />
			</AuthHeading>
			<MlhPoliciesForm
				defaultValues={{
					codeOfConduct: user.mlhCodeOfConductAcceptedAt != null,
					dataSharing: user.mlhDataSharingAcceptedAt != null,
					emailOptIn: user.mlhEmailOptIn ?? false
				}}
			/>
		</>
	);
}
