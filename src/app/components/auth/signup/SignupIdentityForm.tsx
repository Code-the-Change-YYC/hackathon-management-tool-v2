"use client";

import { useStateMachine } from "little-state-machine";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";

import { AuthHeading, AuthShell } from "@/app/components/auth/AuthShell";
import { Button } from "@/app/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import { authClient } from "@/server/better-auth/client";
import {
	enabledSocialProviders,
	type SocialProviderId
} from "../social-providers";
import { getNameParts, updateSignupWizard } from "./wizard";

const institutions = [
	"University of Calgary",
	"Mount Royal University",
	"SAIT",
	"Other"
] as const;

type PersonalProfileFormValues = {
	firstName: string;
	lastName: string;
	school: string;
};

export default function SignupIdentityForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { actions, state } = useStateMachine({
		actions: { updateSignupWizard }
	});
	const hasInitializedSocialProfile = useRef(false);
	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const requestedProvider = searchParams.get("provider");
	const socialProvider = enabledSocialProviders.find(
		({ id }) => id === requestedProvider
	);
	const isSocialRegistration =
		Boolean(session?.user) &&
		!session?.user.completedRegistration &&
		Boolean(socialProvider);
	const form = useForm<PersonalProfileFormValues>({
		defaultValues: {
			firstName: state.signupWizard.firstName,
			lastName: state.signupWizard.lastName,
			school: state.signupWizard.school
		}
	});

	useEffect(() => {
		if (isSessionPending) {
			return;
		}

		if (session?.user.completedRegistration) {
			router.replace("/");
			return;
		}

		const socialUser = isSocialRegistration ? session?.user : null;
		if (socialUser && socialProvider) {
			if (!hasInitializedSocialProfile.current) {
				hasInitializedSocialProfile.current = true;
				const name = getNameParts(socialUser.name);
				actions.updateSignupWizard({
					method: socialProvider.id as SocialProviderId,
					...name,
					email: socialUser.email,
					password: ""
				});
				form.reset({
					...name,
					school: state.signupWizard.school
				});
			}
			return;
		}

		if (session?.user) {
			router.replace("/signup/event-details");
			return;
		}

		if (state.signupWizard.method !== "email") {
			router.replace("/signup");
		}
	}, [
		actions,
		form,
		isSessionPending,
		isSocialRegistration,
		router,
		session?.user,
		socialProvider,
		state.signupWizard.method,
		state.signupWizard.school
	]);

	if (
		isSessionPending ||
		(!isSocialRegistration &&
			!session?.user &&
			state.signupWizard.method !== "email")
	) {
		return (
			<AuthShell background="profile">
				<p className="my-auto text-center text-grey-purple">
					Loading registration…
				</p>
			</AuthShell>
		);
	}

	if (session?.user.completedRegistration) {
		return (
			<AuthShell background="profile">
				<p className="my-auto text-center text-grey-purple">Taking you home…</p>
			</AuthShell>
		);
	}

	const onSubmit = (values: PersonalProfileFormValues) => {
		if (!values.school) {
			form.setError("school", { message: "Select an institution" });
			return;
		}

		actions.updateSignupWizard(values);
		router.push("/signup/event-details");
	};

	return (
		<AuthShell background="profile">
			<form
				className="my-auto flex w-full flex-col gap-6"
				onSubmit={form.handleSubmit(onSubmit)}
			>
				<AuthHeading>Fill out your personal profile</AuthHeading>
				<FieldGroup className="gap-4">
					<Field data-invalid={Boolean(form.formState.errors.firstName)}>
						<FieldLabel className="pl-4 text-sm" htmlFor="firstName">
							First name*
						</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.firstName)}
							className="h-12 rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
							disabled={form.formState.isSubmitting}
							id="firstName"
							{...form.register("firstName", {
								required: "First name is required"
							})}
						/>
						<FieldError errors={[form.formState.errors.firstName]} />
					</Field>
					<Field data-invalid={Boolean(form.formState.errors.lastName)}>
						<FieldLabel className="pl-4 text-sm" htmlFor="lastName">
							Last name*
						</FieldLabel>
						<Input
							aria-invalid={Boolean(form.formState.errors.lastName)}
							className="h-12 rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
							disabled={form.formState.isSubmitting}
							id="lastName"
							{...form.register("lastName", {
								required: "Last name is required"
							})}
						/>
						<FieldError errors={[form.formState.errors.lastName]} />
					</Field>
					<Field data-invalid={Boolean(form.formState.errors.school)}>
						<FieldLabel className="pl-4 text-sm" htmlFor="school">
							Which institution are you attending?*
						</FieldLabel>
						<Select
							name="school"
							onValueChange={(value) => {
								form.setValue("school", value ?? "", {
									shouldDirty: true,
									shouldValidate: true
								});
							}}
							value={form.watch("school") || null}
						>
							<SelectTrigger
								aria-invalid={Boolean(form.formState.errors.school)}
								className="h-12 w-full rounded-xl border-ehhh-grey bg-pale-grey px-4 text-base"
								id="school"
							>
								<SelectValue placeholder="Select an institution" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{institutions.map((institution) => (
										<SelectItem key={institution} value={institution}>
											{institution}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
						<FieldError errors={[form.formState.errors.school]} />
					</Field>
				</FieldGroup>
				<Button
					className="h-11 w-full rounded-xl"
					disabled={form.formState.isSubmitting}
					type="submit"
				>
					Continue
				</Button>
			</form>
		</AuthShell>
	);
}
