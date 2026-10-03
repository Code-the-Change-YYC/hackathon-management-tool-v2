"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/app/components/ui/button";
import {
	Field,
	FieldContent,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle
} from "@/app/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Spinner } from "@/app/components/ui/spinner";
import { ONBOARDING_ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";

const SITUATIONS = ["registered", "unregistered", "no-team"] as const;

type Situation = (typeof SITUATIONS)[number];

const SITUATION_DETAILS: Record<Situation, { label: string; href: string }> = {
	registered: {
		label:
			"I have a team of 2-5 members already, and our team is already registered in the system.",
		href: ONBOARDING_ROUTES.joinTeam
	},
	unregistered: {
		label:
			"I have a team of 2-5 members already, but our team is not registered yet.",
		href: ONBOARDING_ROUTES.registerTeam
	},
	"no-team": {
		label: "I don’t have a team yet.",
		href: ONBOARDING_ROUTES.findTeam
	}
};

const teamSituationSchema = z.object({
	situation: z.enum(SITUATIONS, {
		errorMap: () => ({ message: "Choose the statement that fits you best" })
	})
});

type TeamSituationValues = z.infer<typeof teamSituationSchema>;

export function TeamSituationForm() {
	const router = useRouter();
	const [isNavigating, startNavigation] = useTransition();
	const form = useForm<TeamSituationValues>({
		resolver: zodResolver(teamSituationSchema)
	});

	function goToSituation({ situation }: TeamSituationValues) {
		startNavigation(() => router.push(SITUATION_DETAILS[situation].href));
	}

	return (
		<form
			className="flex flex-col gap-6"
			noValidate
			onSubmit={form.handleSubmit(goToSituation)}
		>
			<Controller
				control={form.control}
				name="situation"
				render={({ field, fieldState }) => (
					<FieldSet data-invalid={fieldState.invalid}>
						<FieldLegend className="sr-only">Your team situation</FieldLegend>
						<RadioGroup
							aria-invalid={fieldState.invalid}
							className="gap-4"
							name={field.name}
							onValueChange={field.onChange}
							value={field.value ?? null}
						>
							{SITUATIONS.map((situation) => (
								<FieldLabel
									className="bg-card *:data-[slot=field]:px-4 *:data-[slot=field]:py-3"
									htmlFor={`situation-${situation}`}
									key={situation}
								>
									<Field
										className="has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-1"
										orientation="horizontal"
									>
										<RadioGroupItem
											aria-invalid={fieldState.invalid}
											id={`situation-${situation}`}
											value={situation}
										/>
										<FieldContent>
											<FieldTitle className="text-base">
												{SITUATION_DETAILS[situation].label}
											</FieldTitle>
										</FieldContent>
									</Field>
								</FieldLabel>
							))}
						</RadioGroup>
						<FieldError errors={[fieldState.error]} />
					</FieldSet>
				)}
			/>
			<div className="flex flex-col gap-4">
				<Button className="w-full" disabled={isNavigating} type="submit">
					{isNavigating && <Spinner data-icon="inline-start" />}
					Continue
				</Button>
				<Link
					className={cn(buttonVariants({ variant: "outline" }), "w-full")}
					href={ONBOARDING_ROUTES.discord}
				>
					Go back
				</Link>
			</div>
		</form>
	);
}
