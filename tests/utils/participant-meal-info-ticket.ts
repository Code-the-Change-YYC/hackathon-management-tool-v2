import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { and, eq } from "drizzle-orm";
import { expect, type Page } from "playwright/test";
import { db } from "@/server/db";
import { eventTicket } from "@/server/db/event-schema";
import { EVENT_TICKET_TOKEN_PATTERN } from "@/types/types";

// Resolve the scanner's existing decoder through its dependency chain rather than
// relying on pnpm hoisting or downloading a WASM binary from a CDN.
const require = createRequire(import.meta.url);
const scannerRequire = createRequire(
	require.resolve("@yudiel/react-qr-scanner")
);
const detectorRequire = createRequire(
	scannerRequire.resolve("barcode-detector")
);
const decoder = detectorRequire("zxing-wasm/reader") as {
	setZXingModuleOverrides: (options: { wasmBinary: Uint8Array }) => void;
	readBarcodes: (
		image: Uint8Array,
		options: { formats: string[]; tryHarder: boolean }
	) => Promise<{ isValid: boolean; text: string }[]>;
};
decoder.setZXingModuleOverrides({
	wasmBinary: readFileSync(
		detectorRequire.resolve("zxing-wasm/reader/zxing_reader.wasm")
	)
});

export const ticketSection = (page: Page) =>
	page.locator("section").filter({
		has: page.getByRole("heading", { name: "Your Meal Ticket", exact: true })
	});
export const qrCode = (page: Page) =>
	ticketSection(page).getByRole("img", {
		name: "Meal ticket QR code",
		exact: true
	});

export async function readTicketToken(page: Page) {
	const qr = qrCode(page);
	await expect(qr).toBeVisible();
	await expect(qr.locator("svg")).toBeVisible();
	let token = "";
	await expect(async () => {
		const results = await decoder.readBarcodes(await qr.screenshot(), {
			formats: ["QRCode"],
			tryHarder: true
		});
		const valid = results.filter((result) => result.isValid);
		expect(valid).toHaveLength(1);
		token = valid[0]?.text ?? "";
		expect(token).toMatch(EVENT_TICKET_TOKEN_PATTERN);
	}).toPass({ timeout: 10_000 });
	return token;
}

export async function expectStoredTicket(
	token: string,
	userId: string,
	meal: {
		id: string;
		endTime: Date;
	}
) {
	const tickets = await db.query.eventTicket.findMany({
		where: and(eq(eventTicket.userId, userId), eq(eventTicket.eventId, meal.id))
	});
	expect(tickets).toHaveLength(1);
	expect(tickets[0]).toMatchObject({
		userId,
		eventId: meal.id,
		tokenHash: createHash("sha256").update(token).digest("hex"),
		expiresAt: meal.endTime
	});
}

// Match the browser's formatter, including its timezone, rather than the worker's.
export const browserTime = (page: Page, date: Date) =>
	page.evaluate(
		(value) =>
			new Intl.DateTimeFormat("en-US", {
				hour: "numeric",
				minute: "2-digit"
			}).format(new Date(value)),
		date.toISOString()
	);
