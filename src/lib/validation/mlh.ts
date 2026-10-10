import { z } from "zod";

/**
 * The checkboxes MLH member events must show. Participants have to agree to
 * the Code of Conduct and to sharing their details with MLH; the emails are
 * optional.
 */
export const mlhPoliciesSchema = z.object({
	codeOfConduct: z
		.boolean()
		.refine(Boolean, "Agree to the MLH Code of Conduct to continue"),
	dataSharing: z
		.boolean()
		.refine(Boolean, "Agree to share your information with MLH to continue"),
	emailOptIn: z.boolean()
});

export type MlhPolicies = z.infer<typeof mlhPoliciesSchema>;
