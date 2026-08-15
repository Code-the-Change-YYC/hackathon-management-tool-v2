export const createSignupData = (suffix: string) =>
	({
		dietaryRestrictions: ["vegetarian"],
		email: `e2e-signup-${suffix}@example.com`,
		firstName: "E2E",
		lastName: "Participant",
		password: "Password123!",
		program: "computer_science",
		school: "University of Calgary",
		wantsFood: "yes"
	}) as const;
