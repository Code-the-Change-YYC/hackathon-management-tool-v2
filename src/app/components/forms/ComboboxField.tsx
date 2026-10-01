"use client";

import { useId, useMemo, useState } from "react";
import {
	type Control,
	type FieldPath,
	type FieldValues,
	useController
} from "react-hook-form";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList
} from "@/app/components/ui/combobox";
import { Field, FieldError, FieldLabel } from "@/app/components/ui/field";
import { Spinner } from "@/app/components/ui/spinner";

/** Lowercase, without accents or punctuation, so "quebec" finds "Québec". */
function toSearchText(text: string) {
	return text
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^\p{L}\p{N}\s]/gu, "")
		.toLowerCase();
}

const toLabel = (item: string) => item;

type ComboboxFieldProps<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues
> = {
	control: Control<TFieldValues, unknown, TTransformedValues>;
	name: TName;
	label: string;
	items: readonly string[];
	suggestedItems?: readonly string[];
	fallbackItem?: string;
	limit?: number;
	itemToLabel?: (item: string) => string;
	placeholder?: string;
	emptyMessage?: string;
	loading?: boolean;
	disabled?: boolean;
};

/** A searchable select for lists too long to scroll, like countries. */
export function ComboboxField<
	TFieldValues extends FieldValues,
	TName extends FieldPath<TFieldValues>,
	TTransformedValues = TFieldValues
>({
	control,
	name,
	label,
	items,
	suggestedItems = items,
	fallbackItem,
	limit,
	itemToLabel = toLabel,
	placeholder,
	emptyMessage = "No results found",
	loading,
	disabled
}: ComboboxFieldProps<TFieldValues, TName, TTransformedValues>) {
	const { field, fieldState } = useController({ control, name });
	const id = useId();
	const [query, setQuery] = useState("");

	const searchIndex = useMemo(
		() =>
			items.map((item) => ({ item, text: toSearchText(itemToLabel(item)) })),
		[items, itemToLabel]
	);

	const suggestions = useMemo(
		() =>
			fallbackItem === undefined
				? suggestedItems
				: [...suggestedItems, fallbackItem],
		[suggestedItems, fallbackItem]
	);

	// Filtering here rather than in Base UI keeps typing quick on long lists
	// and lets the fallback item stay at the end.
	const results = useMemo(() => {
		const words = toSearchText(query).split(/\s+/).filter(Boolean);
		if (words.length === 0) return suggestions;

		const matches = searchIndex
			.filter(({ text }) => words.every((word) => text.includes(word)))
			.map(({ item }) => item)
			.slice(0, limit);
		return fallbackItem === undefined ? matches : [...matches, fallbackItem];
	}, [query, suggestions, searchIndex, limit, fallbackItem]);

	return (
		<Field data-disabled={disabled} data-invalid={fieldState.invalid}>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<Combobox
				autoHighlight
				disabled={disabled}
				filteredItems={results}
				items={suggestions}
				itemToStringLabel={itemToLabel}
				onInputValueChange={setQuery}
				onValueChange={field.onChange}
				value={field.value ?? null}
			>
				<ComboboxInput
					aria-invalid={fieldState.invalid}
					disabled={disabled}
					id={id}
					onBlur={field.onBlur}
					placeholder={placeholder}
					ref={field.ref}
				/>
				<ComboboxContent>
					{loading && (
						<div className="flex items-center gap-2 px-3 pt-2 text-muted-foreground text-sm">
							<Spinner />
							Loading the full list
						</div>
					)}
					<ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
					<ComboboxList>
						{(item: string) => (
							<ComboboxItem key={item} value={item}>
								{itemToLabel(item)}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
			<FieldError errors={[fieldState.error]} />
		</Field>
	);
}
