export function formatTime(value: Date | string | number) {
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		hour12: true,
		minute: "2-digit"
	}).format(new Date(value));
}

export function formatDateTime(value: Date | string | number) {
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		hour: "numeric",
		hour12: true,
		minute: "2-digit",
		month: "short",
		year: "numeric"
	}).format(new Date(value));
}

export function toDateTimeLocalValue(value: Date | string | number) {
	const date = new Date(value);
	const localDate = new Date(
		date.getTime() - date.getTimezoneOffset() * 60_000
	);
	return localDate.toISOString().slice(0, 16);
}
