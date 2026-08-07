"use client";

import { Edit2Line } from "@mingcute/react";
import { useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import {
	DIETARY_RESTRICTIONS,
	type DietaryRestriction as DietaryRestrictionValue
} from "@/server/db/auth-schema";
import {
	DietaryRestrictionDialogue,
	restrictionLabels
} from "./DietaryRestrictionDialogue";

type DietaryRestrictionProps = {
	dietaryRestrictions: string[];
};

function getDietaryRestrictions(
	dietaryRestrictions: string[]
): DietaryRestrictionValue[] {
	return DIETARY_RESTRICTIONS.filter((restriction) =>
		dietaryRestrictions.includes(restriction)
	);
}

export function DietaryRestriction({
	dietaryRestrictions: initialDietaryRestrictions
}: DietaryRestrictionProps) {
	const [dietaryRestrictions, setDietaryRestrictions] = useState(() =>
		getDietaryRestrictions(initialDietaryRestrictions)
	);
	const [isDialogueOpen, setIsDialogueOpen] = useState(false);

	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-lg">
				Dietary Restrictions
			</h2>

			<Card size="sm">
				<CardHeader>
					<CardTitle>Your registered dietary restrictions:</CardTitle>
					<CardAction>
						<Button
							onClick={() => setIsDialogueOpen(true)}
							size="sm"
							variant="ghost"
						>
							Edit
							<Edit2Line data-icon="inline-end" />
						</Button>
					</CardAction>
				</CardHeader>
				<CardContent>
					{dietaryRestrictions.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{dietaryRestrictions.map((restriction) => (
								<Badge key={restriction} variant="accent">
									{restrictionLabels[restriction]}
								</Badge>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">None registered</p>
					)}
				</CardContent>
			</Card>

			{isDialogueOpen ? (
				<DietaryRestrictionDialogue
					currentRestrictions={dietaryRestrictions}
					onCloseAction={() => setIsDialogueOpen(false)}
					onSaveAction={setDietaryRestrictions}
				/>
			) : null}
		</section>
	);
}
