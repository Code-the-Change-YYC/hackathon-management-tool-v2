"use client";

import { AddLine, CloseLine } from "@mingcute/react";
import { type Control, useController } from "react-hook-form";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { FieldLegend, FieldSet } from "@/app/components/ui/field";
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
	const available = DIETARY_RESTRICTIONS.filter(
		(restriction) => !selected.includes(restriction)
	);

	function add(restriction: DietaryRestriction) {
		field.onChange([...selected, restriction]);
	}

	function remove(restriction: DietaryRestriction) {
		field.onChange(selected.filter((value) => value !== restriction));
	}

	return (
		<FieldSet className="gap-4" disabled={disabled}>
			<FieldLegend
				className="mb-0 font-normal text-muted-foreground text-xs"
				variant="label"
			>
				Please indicate any dietary restrictions you may have:
			</FieldLegend>
			<FieldSet className="gap-2">
				<FieldLegend className="mb-0" variant="label">
					Your dietary restrictions:
				</FieldLegend>
				<div className="flex flex-wrap gap-2">
					{selected.length > 0 ? (
						selected.map((restriction) => (
							<Badge
								aria-label={`Remove ${DIETARY_RESTRICTION_LABELS[restriction]}`}
								className="h-8 cursor-pointer px-3"
								key={restriction}
								onClick={() => remove(restriction)}
								render={<button type="button" />}
								variant="accent"
							>
								{DIETARY_RESTRICTION_LABELS[restriction]}
								<CloseLine data-icon="inline-end" />
							</Badge>
						))
					) : (
						<p className="text-muted-foreground text-sm">None selected</p>
					)}
				</div>
			</FieldSet>
			{available.length > 0 && (
				<FieldSet className="gap-2">
					<FieldLegend className="mb-0" variant="label">
						Add a restriction:
					</FieldLegend>
					<div className="flex flex-wrap gap-2">
						{available.map((restriction) => (
							<Button
								aria-label={`Add ${DIETARY_RESTRICTION_LABELS[restriction]}`}
								key={restriction}
								onClick={() => add(restriction)}
								size="sm"
								type="button"
								variant="outline"
							>
								{DIETARY_RESTRICTION_LABELS[restriction]}
								<AddLine data-icon="inline-end" />
							</Button>
						))}
					</div>
				</FieldSet>
			)}
		</FieldSet>
	);
}
