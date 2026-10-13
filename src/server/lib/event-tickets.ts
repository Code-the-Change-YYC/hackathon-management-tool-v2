import { createHash, randomBytes } from "node:crypto";

export function createEventTicketToken() {
	return `evt1_${randomBytes(32).toString("base64url")}`;
}

export function hashEventTicketToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}
