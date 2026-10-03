"use client";

import { type Control, useController } from "react-hook-form";
import { Badge } from "@/app/components/ui/badge";
import { FieldLegend, FieldSet } from "@/app/components/ui/field";
import { cn } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	DIETARY_RESTRICTIONS,
	type DietaryRestriction,
	type FoodPreferences
} from "@/lib/validation/signup";

export function DietaryRestrictionsField({
	control,
	disabled
}: {
	control: Control<FoodPreferences>;
	disabled?: boolean;
}) {
	const { field } = useController({ control, name: "dietaryRestrictions" });
	const selected = field.value;

	function toggle(restriction: DietaryRestriction) {
		field.onChange(
			selected.includes(restriction)
				? selected.filter((value) => value !== restriction)
				: [...selected, restriction]
		);
	}

	return (
		<FieldSet className="gap-2" disabled={disabled}>
			<FieldLegend variant="label">Your dietary restrictions</FieldLegend>
			<div className="mt-2 flex flex-wrap gap-2">
				{DIETARY_RESTRICTIONS.map((restriction) => {
					const isSelected = selected.includes(restriction);

					return (
						<Badge
							aria-pressed={isSelected}
							className={cn(
								"h-8 cursor-pointer px-3",
								!isSelected && "border-muted bg-muted text-muted-foreground"
							)}
							key={restriction}
							render={
								<button onClick={() => toggle(restriction)} type="button" />
							}
							variant={isSelected ? "default" : "outline"}
						>
							{DIETARY_RESTRICTION_LABELS[restriction]}
						</Badge>
					);
				})}
			</div>
		</FieldSet>
	);
}
