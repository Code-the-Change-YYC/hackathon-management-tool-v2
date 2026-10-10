import { env } from "@/env";

export type Email = {
	to: string;
	subject: string;
	text: string;
	html: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Sends an email through Resend. Without an API key (local development and
 * tests), the email is printed to the server console instead so codes can
 * still be copied from the terminal.
 */
export async function sendEmail(email: Email) {
	if (!env.RESEND_API_KEY) {
		console.info(
			`[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}`
		);
		return;
	}

	const response = await fetch(RESEND_API_URL, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			from: env.EMAIL_FROM,
			to: email.to,
			subject: email.subject,
			text: email.text,
			html: email.html
		})
	});

	if (!response.ok) {
		throw new Error(
			`Resend rejected the email (${response.status}): ${await response.text()}`
		);
	}
}
