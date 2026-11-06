import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/env";

const SCANNER_GRACE_MS = 2 * 60 * 60 * 1000;

function sign(payload: string) {
	if (!env.BETTER_AUTH_SECRET)
		throw new Error("Ticket signing secret is not configured.");
	return createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest();
}

export function createMealScannerLease(
	eventId: string,
	adminId: string,
	endTime: Date
) {
	const payload = Buffer.from(
		JSON.stringify({
			eventId,
			adminId,
			expiresAt: endTime.getTime() + SCANNER_GRACE_MS
		})
	).toString("base64url");
	return `${payload}.${sign(payload).toString("base64url")}`;
}

export function isValidMealScannerLease(
	lease: string | undefined,
	eventId: string,
	adminId: string,
	now: Date,
	currentEndTime: Date
) {
	if (!lease || now.getTime() >= currentEndTime.getTime() + SCANNER_GRACE_MS)
		return false;
	const [payload, signature, extra] = lease.split(".");
	if (!payload || !signature || extra) return false;
	const received = Buffer.from(signature, "base64url");
	const expected = sign(payload);
	if (
		received.length !== expected.length ||
		!timingSafeEqual(received, expected)
	)
		return false;
	try {
		const claims: unknown = JSON.parse(
			Buffer.from(payload, "base64url").toString()
		);
		return (
			typeof claims === "object" &&
			claims !== null &&
			"eventId" in claims &&
			claims.eventId === eventId &&
			"adminId" in claims &&
			claims.adminId === adminId &&
			"expiresAt" in claims &&
			typeof claims.expiresAt === "number" &&
			claims.expiresAt > now.getTime()
		);
	} catch {
		return false;
	}
}

// Derived rather than random so every tab and device shows the same code.
export function createEventTicketToken(eventId: string, userId: string) {
	const signature = sign(`event-ticket:${eventId}:${userId}`);
	return `evt1_${signature.toString("base64url")}`;
}

export function hashEventTicketToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
