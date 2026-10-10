"use client";

import { useQuery } from "@tanstack/react-query";
import { type Control, useWatch } from "react-hook-form";
import { ComboboxField } from "@/app/components/forms/ComboboxField";
import { TextField } from "@/app/components/forms/TextField";
import {
	loadSchools,
	PINNED_SCHOOLS,
	SCHOOL_NAME_MAX_LENGTH,
	SCHOOL_NOT_LISTED
} from "@/lib/schools";
import type { ProfileInput, ProfileValues } from "@/lib/validation/profile";

const SEARCH_RESULT_LIMIT = 50;

function getSchoolLabel(school: string) {
	return school === SCHOOL_NOT_LISTED ? "My school isn’t listed" : school;
}

/**
 * Searches MLH's list of schools. A school that isn't on it can be typed in
 * after picking "My school isn't listed".
 */
export function SchoolField({
	control,
	label,
	disabled
}: {
	control: Control<ProfileInput, unknown, ProfileValues>;
	label: string;
	disabled?: boolean;
}) {
	// The list is large, so it loads while the rest of the form is filled in.
	const schools = useQuery({
		queryKey: ["mlh-schools"],
		queryFn: loadSchools,
		staleTime: Number.POSITIVE_INFINITY
	});
	const school = useWatch({ control, name: "school" });

	return (
		<>
			<ComboboxField
				control={control}
				disabled={disabled}
				fallbackItem={SCHOOL_NOT_LISTED}
				items={schools.data ?? PINNED_SCHOOLS}
				itemToLabel={getSchoolLabel}
				label={label}
				limit={SEARCH_RESULT_LIMIT}
				loading={schools.isPending}
				name="school"
				placeholder="Search for your school"
				suggestedItems={PINNED_SCHOOLS}
			/>
			{school === SCHOOL_NOT_LISTED && (
				<TextField
					control={control}
					disabled={disabled}
					label="Institution name"
					maxLength={SCHOOL_NAME_MAX_LENGTH}
					name="otherSchool"
				/>
			)}
		</>
	);
}
