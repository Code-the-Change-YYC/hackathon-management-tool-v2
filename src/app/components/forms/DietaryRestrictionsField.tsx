"use client";

import { Badge } from "@/app/components/ui/badge";
import { FieldLegend, FieldSet } from "@/app/components/ui/field";
import { cn } from "@/lib/utils";
import {
	DIETARY_RESTRICTION_LABELS,
	DIETARY_RESTRICTIONS,
	type DietaryRestriction
} from "@/lib/validation/signup";

export function DietaryRestrictionsField({
	value,
	onChange,
	disabled
}: {
	value: DietaryRestriction[];
	onChange: (value: DietaryRestriction[]) => void;
	disabled?: boolean;
}) {
	// Keeps the selection in display order, so equal selections compare equal.
	function toggle(restriction: DietaryRestriction) {
		onChange(
			DIETARY_RESTRICTIONS.filter((option) =>
				option === restriction
					? !value.includes(option)
					: value.includes(option)
			)
		);
	}

	return (
		<FieldSet className="gap-2" disabled={disabled}>
			<FieldLegend variant="label">Your dietary restrictions</FieldLegend>
			<div className="mt-2 flex flex-wrap gap-2">
				{DIETARY_RESTRICTIONS.map((restriction) => {
					const isSelected = value.includes(restriction);

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
