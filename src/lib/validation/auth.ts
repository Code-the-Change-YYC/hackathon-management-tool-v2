import { z } from "zod";

// Mirrors better-auth's default maximum password length.
const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIREMENTS = [
	{
		label: "Minimum 8 characters",
		isMet: (password: string) => password.length >= 8
	},
	{
		label: "At least one number",
		isMet: (password: string) => /\d/.test(password)
	},
	{
		label: "At least one special character",
		isMet: (password: string) => /[^A-Za-z0-9]/.test(password)
	}
] as const;

export const VERIFICATION_CODE_LENGTH = 6;

const emailSchema = z
	.string()
	.trim()
	.min(1, "Enter your email")
	.email("Enter a valid email address");

export const loginSchema = z.object({
	email: emailSchema,
	password: z.string().min(1, "Enter your password")
});

const newPasswordSchema = z
	.string()
	// The requirements list only shows once something is typed.
	.min(1, "Enter a password")
	.max(PASSWORD_MAX_LENGTH, `Use ${PASSWORD_MAX_LENGTH} characters or fewer`)
	.refine(
		(password) =>
			PASSWORD_REQUIREMENTS.every((requirement) => requirement.isMet(password)),
		"Your password doesn't meet the requirements below"
	);

const verificationCodeSchema = z
	.string()
	.regex(
		new RegExp(`^\\d{${VERIFICATION_CODE_LENGTH}}$`),
		`Enter the ${VERIFICATION_CODE_LENGTH}-digit code from your email`
	);

export const signupSchema = z.object({
	email: emailSchema,
	password: newPasswordSchema
});

export const verifyEmailSchema = z.object({
	code: verificationCodeSchema
});

export const forgotPasswordSchema = z.object({
	email: emailSchema
});

export const resetPasswordSchema = z.object({
	code: verificationCodeSchema,
	password: newPasswordSchema
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
export type VerifyEmailValues = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
