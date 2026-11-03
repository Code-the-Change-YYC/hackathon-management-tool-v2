import { z } from "zod";
import { NAME_MAX_LENGTH } from "@/lib/validation/profile";

const judgeNameSchema = (name: string) =>
	z
		.string()
		.trim()
		.min(1, `Enter the judge’s ${name}`)
		.max(NAME_MAX_LENGTH, `Use ${NAME_MAX_LENGTH} characters or fewer`);

export const addJudgeSchema = z.object({
	firstName: judgeNameSchema("first name"),
	lastName: judgeNameSchema("last name"),
	email: z
		.string()
		.trim()
		.min(1, "Enter the judge’s email")
		.email("Enter a valid email address")
		.toLowerCase()
});

export type AddJudgeInput = z.input<typeof addJudgeSchema>;
export type AddJudgeValues = z.output<typeof addJudgeSchema>;
