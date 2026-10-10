"use client";

// Adapted from ReUI's phone input (https://reui.io/docs/components/base/phone-input)
// so it sits in an input group and matches the other inputs.

import { WorldLine as WorldIcon } from "@mingcute/react";
import type { ComponentProps, RefObject } from "react";
import * as BasePhoneInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";
import englishLabels from "react-phone-number-input/locale/en";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxTrigger,
	useComboboxAnchor
} from "@/app/components/ui/combobox";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput
} from "@/app/components/ui/input-group";
import { COUNTRIES } from "@/lib/countries";
import { cn } from "@/lib/utils";

// Same names as the country of residence question; the library's English
// names cover the few calling regions that aren't ISO countries.
const COUNTRY_LABELS: BasePhoneInput.Labels = {
	...englishLabels,
	...Object.fromEntries(COUNTRIES.map(({ code, name }) => [code, name]))
};

/**
 * A country's flag, or a globe when there's no flag for it. Decorative: the
 * country's name is always shown or announced next to it.
 */
function CountryFlag({
	country,
	className
}: {
	country: string | undefined;
	className?: string;
}) {
	const Flag = country ? flags[country as BasePhoneInput.Country] : undefined;

	return (
		<span
			aria-hidden="true"
			className={cn(
				"flex h-3.5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-xs [&_svg]:size-full",
				className
			)}
		>
			{Flag ? (
				<Flag title="" />
			) : (
				<WorldIcon className="text-muted-foreground" />
			)}
		</span>
	);
}

/** Renders a country's flag, for lists of countries. */
function getCountryFlag(country: string) {
	return <CountryFlag country={country} />;
}

type PhoneInputProps = Omit<ComponentProps<"input">, "onChange" | "value"> & {
	value?: string;
	onChange?: (value: string) => void;
	defaultCountry?: BasePhoneInput.Country;
};

/**
 * A phone number with a country picker. The value is in E.164 format, e.g.
 * "+14035550123".
 */
function PhoneInput({
	className,
	value,
	onChange,
	defaultCountry,
	ref,
	...props
}: PhoneInputProps) {
	const anchor = useComboboxAnchor();

	return (
		<BasePhoneInput.default
			addInternationalOption={false}
			className={className}
			containerComponent={InputGroup}
			// The country list lines up with the whole field, not just its button.
			containerComponentProps={{ ref: anchor }}
			countryOptionsOrder={["CA", "US", "..."]}
			countrySelectComponent={CountrySelect}
			countrySelectProps={{ anchor }}
			defaultCountry={defaultCountry}
			inputComponent={InputGroupInput}
			labels={COUNTRY_LABELS}
			onChange={(nextValue) => onChange?.(nextValue ?? "")}
			// Typed as the component, but the library forwards it to the <input>.
			ref={ref as never}
			smartCaret={false}
			value={value || undefined}
			{...props}
		/>
	);
}

type CountryOption = {
	value?: BasePhoneInput.Country;
	label: string;
	divider?: boolean;
};

function getCountryLabel(country: string) {
	return COUNTRY_LABELS[country as BasePhoneInput.Country] ?? country;
}

function CountrySelect({
	value,
	options,
	onChange,
	disabled,
	readOnly,
	anchor
}: {
	value?: BasePhoneInput.Country;
	options: CountryOption[];
	onChange: (country?: BasePhoneInput.Country) => void;
	disabled?: boolean;
	readOnly?: boolean;
	anchor: RefObject<HTMLDivElement | null>;
}) {
	const countries = options.flatMap((option) =>
		option.value && !option.divider ? [option.value] : []
	);

	return (
		<Combobox
			autoHighlight
			disabled={disabled || readOnly}
			items={countries}
			itemToStringLabel={getCountryLabel}
			onValueChange={(country) => {
				if (country) onChange(country as BasePhoneInput.Country);
			}}
			value={value ?? null}
		>
			<InputGroupAddon align="inline-start">
				<ComboboxTrigger
					aria-label={
						value
							? `Country code: ${getCountryLabel(value)} +${BasePhoneInput.getCountryCallingCode(value)}`
							: "Country code"
					}
					render={<InputGroupButton className="gap-1" size="xs" />}
				>
					<CountryFlag country={value} />
				</ComboboxTrigger>
			</InputGroupAddon>
			<ComboboxContent anchor={anchor}>
				<ComboboxInput
					aria-label="Search countries"
					placeholder="Search countries"
					showTrigger={false}
				/>
				<ComboboxEmpty>No countries found</ComboboxEmpty>
				<ComboboxList>
					{(country: BasePhoneInput.Country) => (
						<ComboboxItem key={country} value={country}>
							<CountryFlag country={country} />
							<span className="flex-1 truncate">
								{getCountryLabel(country)}
							</span>
							<span className="text-muted-foreground">
								+{BasePhoneInput.getCountryCallingCode(country)}
							</span>
						</ComboboxItem>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}

export { CountryFlag, getCountryFlag, PhoneInput };
