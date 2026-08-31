import { inArray } from "drizzle-orm";
import { db } from "@/server/db";
import { event } from "@/server/db/event-schema";
import { assertE2EDatabaseSafety } from "../e2e/db";

export type EventFixtureInput = Pick<
	typeof event.$inferInsert,
	"endTime" | "startTime" | "title"
>;

export type EventFixture = typeof event.$inferSelect;

export class EventFixtureTracker {
	private readonly eventIds = new Set<string>();

	async create(input: EventFixtureInput): Promise<EventFixture> {
		assertE2EDatabaseSafety();

		const [createdEvent] = await db
			.insert(event)
			.values({
				...input,
				title: `test-event-${crypto.randomUUID()} ${input.title}`
			})
			.returning();

		if (!createdEvent) {
			throw new Error("Failed to create a event fixture");
		}

		this.eventIds.add(createdEvent.id);
		return createdEvent;
	}

	async cleanup() {
		if (this.eventIds.size === 0) {
			return;
		}

		assertE2EDatabaseSafety();
		await db.delete(event).where(inArray(event.id, [...this.eventIds]));
		this.eventIds.clear();
	}
}
