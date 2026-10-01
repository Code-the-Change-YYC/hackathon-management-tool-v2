"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckboxField } from "@/app/components/forms/CheckboxField";
import { Button } from "@/app/components/ui/button";
import { FieldGroup } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";
import {
	DEV_URL,
	MLH_CODE_OF_CONDUCT_URL,
	MLH_CONTEST_TERMS_URL,
	MLH_PRIVACY_POLICY_URL
} from "@/lib/constants";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { type MlhPolicies, mlhPoliciesSchema } from "@/lib/validation/mlh";
import { api } from "@/trpc/react";

// Opens in a new tab so the form isn't lost.
function PolicyLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			className="font-medium text-purple-800 underline underline-offset-4"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
			<span className="sr-only"> (opens in a new tab)</span>
		</a>
	);
}

/** The checkboxes MLH requires, worded as MLH asks. */
export function MlhPoliciesForm({
	defaultValues
}: {
	defaultValues: MlhPolicies;
}) {
	const router = useRouter();
	const form = useForm<MlhPolicies>({
		defaultValues,
		resolver: zodResolver(mlhPoliciesSchema)
	});

	const acceptPolicies = api.users.acceptMlhPolicies.useMutation({
		onSuccess: () => router.push(ONBOARDING_ROUTES.discord),
		onError: () =>
			toast.error("We couldn't save your answers. Please try again.")
	});
	// Stay busy after success while the next step loads.
	const isBusy = acceptPolicies.isPending || acceptPolicies.isSuccess;

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit((values) => acceptPolicies.mutate(values))}
		>
			<FieldGroup className="gap-6">
				<CheckboxField
					control={form.control}
					disabled={isBusy}
					name="codeOfConduct"
				>
					I have read and agree to the{" "}
					<PolicyLink href={MLH_CODE_OF_CONDUCT_URL}>
						MLH Code of Conduct
					</PolicyLink>
					.
				</CheckboxField>
				<CheckboxField
					control={form.control}
					disabled={isBusy}
					name="dataSharing"
				>
					I authorize you to share my application/registration information with
					Major League Hacking for event administration, ranking, and
					administration (including the creation of linked accounts on MLH and
					DEV (<PolicyLink href={DEV_URL}>dev.to</PolicyLink>)) in line with the{" "}
					<PolicyLink href={MLH_PRIVACY_POLICY_URL}>
						MLH Privacy Policy
					</PolicyLink>
					. I further agree to the terms of both the{" "}
					<PolicyLink href={MLH_CONTEST_TERMS_URL}>
						MLH Contest Terms and Conditions
					</PolicyLink>{" "}
					and the{" "}
					<PolicyLink href={MLH_PRIVACY_POLICY_URL}>
						MLH Privacy Policy
					</PolicyLink>
					.
				</CheckboxField>
				<CheckboxField
					control={form.control}
					disabled={isBusy}
					name="emailOptIn"
				>
					I authorize MLH + DEV to send me occasional emails about relevant
					events, career opportunities, and community announcements.
				</CheckboxField>
			</FieldGroup>
			<Button className="w-full" disabled={isBusy} type="submit">
				{isBusy && <Spinner data-icon="inline-start" />}
				Continue
			</Button>
		</form>
	);
}
