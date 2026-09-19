import { env } from "@/env";

type SendEmailInput = {
	to: string;
	subject: string;
	html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailInput) {
	if (!env.RESEND_API_KEY) {
		console.info(`[email] (no RESEND_API_KEY) would send to ${to}: ${subject}`);
		return;
	}

	const res = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			Authorization: `Bearer ${env.RESEND_API_KEY}`,
			"Content-Type": "application/json"
		},
		body: JSON.stringify({ from: env.EMAIL_FROM, to, subject, html })
	});

	if (!res.ok) {
		throw new Error(`Resend failed (${res.status}): ${await res.text()}`);
	}
}
