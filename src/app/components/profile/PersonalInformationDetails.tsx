"use client";

import { EditIcon } from "@/app/components/layout/icons";
import { Button } from "@/app/components/ui/button";
import { getNameParts } from "@/lib/names";
import { cn } from "@/lib/utils";
import { asksForMajor, PROGRAM_LABELS } from "@/lib/validation/profile";
import { PersonalInformationCard } from "./PersonalInformationCard";
import type { Profile } from "./types";

type Detail = { label: string; value: string | null };

function getDetails(profile: Profile): Detail[] {
	const { firstName, lastName } = getNameParts(profile.name);
	const details: Detail[] = [
		{ label: "First name", value: firstName },
		{ label: "Last name", value: lastName },
		{ label: "Institution", value: profile.school }
	];

	if (asksForMajor(profile.school)) {
		details.push({
			label: "Major",
			value: profile.program && PROGRAM_LABELS[profile.program]
		});
	}

	return details;
}

export function PersonalInformationDetails({
	profile,
	onEdit
}: {
	profile: Profile;
	onEdit: () => void;
}) {
	return (
		<PersonalInformationCard
			actions={
				<Button onClick={onEdit} size="sm" variant="ghost">
					<EditIcon data-icon="inline-start" />
					Edit Info
				</Button>
			}
		>
			<dl className="grid gap-6 sm:grid-cols-2 sm:gap-x-12">
				{getDetails(profile).map(({ label, value }) => (
					<div className="flex min-w-0 flex-col gap-2" key={label}>
						<dt className="font-medium text-sm">{label}</dt>
						<dd
							className={cn(
								"wrap-break-word text-base",
								!value && "text-muted-foreground"
							)}
						>
							{value || "Not provided"}
						</dd>
					</div>
				))}
			</dl>
		</PersonalInformationCard>
	);
}
