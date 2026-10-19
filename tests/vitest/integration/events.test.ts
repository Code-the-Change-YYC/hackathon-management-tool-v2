import { eq, inArray } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import { EventStatus, EventType, Role } from "@/types/types";
import { assertE2EDatabaseSafety } from "../../e2e/db";
import { createAuthenticatedCaller } from "../helpers/auth";

const hour = 60 * 60 * 1000;
const start = new Date(Date.now() + 24 * hour);
const input = {
	title: "Test trivia",
	description: "Bring a friend.",
	location: "ENG 224",
	navigationUrl: "https://example.com/map",
	type: EventType.ACTIVITY,
	status: EventStatus.ACTIVE,
	startTime: start,
	endTime: new Date(start.getTime() + hour)
};

type Session = Awaited<ReturnType<typeof createAuthenticatedCaller>>;
let admin: Session;
let participant: Session;
const createdIds: string[] = [];

async function addEvent(overrides: Partial<typeof input> = {}) {
	const created = await admin.caller.events.addEvent({
		...input,
		...overrides
	});
	if (!created) throw new Error("Event was not created");
	createdIds.push(created.id);
	return created;
}

beforeAll(async () => {
	assertE2EDatabaseSafety();
	admin = await createAuthenticatedCaller({ role: Role.ADMIN });
	participant = await createAuthenticatedCaller({ role: Role.PARTICIPANT });
});

afterAll(async () => {
	if (createdIds.length) {
		await db.delete(event).where(inArray(event.id, createdIds));
	}
	await admin?.cleanup();
	await participant?.cleanup();
});

describe("events admin mutations", () => {
	it("rejects participants", async () => {
		const created = await addEvent();
		const api = participant.caller.events;
		await expect(api.addEvent(input)).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
		await expect(
			api.updateEvent({ id: created.id, ...input })
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		await expect(api.deleteEvent({ id: created.id })).rejects.toMatchObject({
			code: "FORBIDDEN"
		});
	});

	it("adds an event with every field", async () => {
		const created = await addEvent({ title: "  Padded  " });
		expect(created).toMatchObject({ ...input, title: "Padded" });
	});

	it.each([
		["an end before the start", { endTime: start }],
		["an unsafe link", { navigationUrl: "javascript:alert(1)" }],
		["a blank title", { title: "   " }],
		["a long title", { title: "x".repeat(121) }],
		["an unknown type", { type: "party" as EventType }]
	])("rejects %s", async (_, overrides) => {
		await expect(
			admin.caller.events.addEvent({ ...input, ...overrides })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("updates an event and moves ticket expiry to the new end", async () => {
		const created = await addEvent({ type: EventType.FOOD });
		await db.insert(eventTicket).values({
			userId: participant.user.id,
			eventId: created.id,
			tokenHash: crypto.randomUUID(),
			expiresAt: created.endTime
		});
		const endTime = new Date(created.endTime.getTime() + hour);

		const updated = await admin.caller.events.updateEvent({
			...input,
			id: created.id,
			title: "Late lunch",
			location: null,
			navigationUrl: null,
			status: EventStatus.DRAFT,
			type: EventType.FOOD,
			endTime
		});

		expect(updated).toMatchObject({
			title: "Late lunch",
			location: null,
			navigationUrl: null,
			status: EventStatus.DRAFT,
			endTime
		});
		const [ticket] = await db
			.select({ expiresAt: eventTicket.expiresAt })
			.from(eventTicket)
			.where(eq(eventTicket.eventId, created.id));
		expect(ticket?.expiresAt).toEqual(endTime);
	});

	it("deletes an event with its check-ins", async () => {
		const created = await addEvent();
		await db
			.insert(eventAttendance)
			.values({ userId: participant.user.id, eventId: created.id });

		await expect(
			admin.caller.events.deleteEvent({ id: created.id })
		).resolves.toEqual({ id: created.id });

		expect(
			await db.query.event.findFirst({ where: eq(event.id, created.id) })
		).toBeUndefined();
		expect(
			await db.query.eventAttendance.findFirst({
				where: eq(eventAttendance.eventId, created.id)
			})
		).toBeUndefined();
	});

	it("reports a missing event", async () => {
		const id = crypto.randomUUID();
		await expect(
			admin.caller.events.updateEvent({ id, ...input })
		).rejects.toMatchObject({ code: "NOT_FOUND" });
		await expect(admin.caller.events.deleteEvent({ id })).rejects.toMatchObject(
			{ code: "NOT_FOUND" }
		);
	});
});
