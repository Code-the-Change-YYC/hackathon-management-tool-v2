/**
 * Users store a single `name`. The first word is treated as the first name
 * and everything after it as the last name, so these two helpers round-trip.
 */
export function getNameParts(name: string) {
	const [firstName = "", ...lastName] = name.trim().split(/\s+/);

	return {
		firstName,
		lastName: lastName.join(" ")
	};
}

export function getFullName(firstName: string, lastName: string) {
	return `${firstName.trim()} ${lastName.trim()}`.trim();
}

/** Up to two initials, e.g. "Jane Doe" -> "JD", for avatar fallbacks. */
export function getInitials(name: string) {
	const { firstName, lastName } = getNameParts(name);
	return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
