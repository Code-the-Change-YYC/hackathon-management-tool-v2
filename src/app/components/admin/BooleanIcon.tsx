import { CheckLine, CloseLine } from "@mingcute/react";

export function BooleanIcon({ value }: { value: boolean }) {
	return value ? (
		<CheckLine
			aria-label="Yes"
			className="size-5"
			color="var(--color-green-700)"
			role="img"
		/>
	) : (
		<CloseLine
			aria-label="No"
			className="size-5"
			color="var(--color-red-600)"
			role="img"
		/>
	);
}
