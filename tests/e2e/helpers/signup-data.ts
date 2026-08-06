export type SignupFormData = {
	dietaryRestrictions: string[];
	email: string;
	firstName: string;
	lastName: string;
	password: string;
	program: string;
	school: string;
	wantsFood: "yes" | "no";
};

export const createSignupData = (suffix: string): SignupFormData => ({
	dietaryRestrictions: ["vegetarian"],
	email: `e2e-signup-${suffix}@example.com`,
	firstName: "E2E",
	lastName: "Participant",
	password: "Password123!",
	program: "computer_science",
	school: "University of Calgary",
	wantsFood: "yes"
});
