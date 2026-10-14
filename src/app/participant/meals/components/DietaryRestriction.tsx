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
	DIETARY_RESTRICTION_LABELS,
	toDietaryRestrictions
} from "@/lib/validation/signup";
import { DietaryRestrictionDialogue } from "./DietaryRestrictionDialogue";

type DietaryRestrictionProps = {
	dietaryRestrictions: string[];
};

export function DietaryRestriction({
	dietaryRestrictions: initialDietaryRestrictions
}: DietaryRestrictionProps) {
	const [dietaryRestrictions, setDietaryRestrictions] = useState(() =>
		toDietaryRestrictions(initialDietaryRestrictions)
	);
	const [isDialogueOpen, setIsDialogueOpen] = useState(false);

	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-lg">
				Dietary Restrictions
			</h2>

			<Card>
				<CardHeader>
					<CardTitle>Your registered dietary restrictions</CardTitle>
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
								<Badge className="h-8 px-3" key={restriction}>
									{DIETARY_RESTRICTION_LABELS[restriction]}
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
