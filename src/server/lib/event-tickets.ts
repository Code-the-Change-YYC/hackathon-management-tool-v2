import {
	createHash,
	createHmac,
	randomBytes,
	timingSafeEqual
} from "node:crypto";
import { env } from "@/env";

const SCANNER_GRACE_MS = 2 * 60 * 60 * 1000;

function scannerSignature(payload: string) {
	if (!env.BETTER_AUTH_SECRET)
		throw new Error("Scanner signing secret is not configured.");
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
	return `${payload}.${scannerSignature(payload).toString("base64url")}`;
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
	const expected = scannerSignature(payload);
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

export function createEventTicketToken() {
	return `evt1_${randomBytes(32).toString("base64url")}`;
}

export function hashEventTicketToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
