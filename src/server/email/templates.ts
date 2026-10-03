import type { Email } from ".";

type EmailContent = Omit<Email, "to">;

function layout(body: string) {
	return `<div style="font-family: Helvetica, Arial, sans-serif; color: #292929; font-size: 16px; line-height: 24px; max-width: 480px;">${body}<p style="color: #575757; font-size: 14px;">— The Code the Change YYC team</p></div>`;
}

export function verificationCodeEmail({
	code,
	expiresInMinutes
}: {
	code: string;
	expiresInMinutes: number;
}): EmailContent {
	return {
		subject: `${code} is your Hack the Change verification code`,
		text: `Your Hack the Change verification code is ${code}. It expires in ${expiresInMinutes} minutes.\n\nIf you didn't create an account, you can ignore this email.`,
		html: layout(
			`<p>Enter this code to verify your email and finish creating your Hack the Change account:</p><p style="font-size: 32px; line-height: 40px; font-weight: 600; letter-spacing: 8px;">${code}</p><p>It expires in ${expiresInMinutes} minutes. If you didn't create an account, you can ignore this email.</p>`
		)
	};
}

export function passwordResetCodeEmail({
	code,
	expiresInMinutes
}: {
	code: string;
	expiresInMinutes: number;
}): EmailContent {
	return {
		subject: `${code} is your Hack the Change password reset code`,
		text: `Your Hack the Change password reset code is ${code}. It expires in ${expiresInMinutes} minutes.\n\nIf you didn't ask to reset your password, you can ignore this email. Your password won't change.`,
		html: layout(
			`<p>Enter this code to choose a new password for your Hack the Change account:</p><p style="font-size: 32px; line-height: 40px; font-weight: 600; letter-spacing: 8px;">${code}</p><p>It expires in ${expiresInMinutes} minutes. If you didn't ask to reset your password, you can ignore this email. Your password won't change.</p>`
		)
	};
}

export function passwordChangedEmail({
	forgotPasswordUrl
}: {
	forgotPasswordUrl: string;
}): EmailContent {
	return {
		subject: "Your Hack the Change password was changed",
		text: `The password for your Hack the Change account was just changed, and you were logged out everywhere else.\n\nIf this wasn't you, reset your password right away: ${forgotPasswordUrl}`,
		html: layout(
			`<p>The password for your Hack the Change account was just changed, and you were logged out everywhere else.</p><p>If this wasn't you, <a href="${forgotPasswordUrl}" style="color: #2911a7;">reset your password</a> right away.</p>`
		)
	};
}

export function existingAccountEmail({
	loginUrl
}: {
	loginUrl: string;
}): EmailContent {
	return {
		subject: "You already have a Hack the Change account",
		text: `Someone tried to sign up for Hack the Change with this email, but it already has an account. If that was you, log in instead (with Google, if that's how you signed up): ${loginUrl}\n\nIf it wasn't you, you can ignore this email.`,
		html: layout(
			`<p>Someone tried to sign up for Hack the Change with this email, but it already has an account.</p><p>If that was you, <a href="${loginUrl}" style="color: #2911a7;">log in instead</a> (with Google, if that's how you signed up). If it wasn't you, you can ignore this email.</p>`
		)
	};
}
