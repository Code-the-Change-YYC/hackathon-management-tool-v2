"use client";

import { Edit2Line } from "@mingcute/react";
import { useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardAction, CardContent } from "@/app/components/ui/card";
import {
	DIETARY_RESTRICTION_LABELS,
	toDietaryRestrictions
} from "@/lib/validation/signup";
import { DietaryRestrictionDialogue } from "./DietaryRestrictionDialogue";

type DietaryRestrictionProps = {
	dietaryRestrictions: string[];
};

export function DietaryRestriction({
	dietaryRestrictions
}: DietaryRestrictionProps) {
	const restrictions = toDietaryRestrictions(dietaryRestrictions);
	const [isDialogueOpen, setIsDialogueOpen] = useState(false);

	return (
		<section className="flex flex-col gap-4">
			<h2 className="font-medium text-dark-grey text-xl">
				Dietary Restrictions
			</h2>

			<Card>
				<CardContent className="flex items-center justify-between">
					{restrictions.length > 0 ? (
						<div className="flex flex-wrap gap-2">
							{restrictions.map((restriction) => (
								<Badge className="h-8 px-3" key={restriction}>
									{DIETARY_RESTRICTION_LABELS[restriction]}
								</Badge>
							))}
						</div>
					) : (
						<p className="font-medium text-muted-foreground text-sm">
							No dietary restrictions registered.
						</p>
					)}
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
				</CardContent>
			</Card>

			{isDialogueOpen ? (
				<DietaryRestrictionDialogue
					currentRestrictions={restrictions}
					onCloseAction={() => setIsDialogueOpen(false)}
				/>
			) : null}
		</section>
	);
}
