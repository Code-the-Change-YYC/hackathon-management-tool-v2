export const createSignupData = (suffix: string) =>
	({
		email: `e2e-signup-${suffix}@example.com`,
		password: "Password123!"
	}) as const;
