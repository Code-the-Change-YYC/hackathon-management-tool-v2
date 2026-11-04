import { describe, expect, it } from "vitest";
import { mealAvailabilityEnd } from "@/server/lib/event-tickets";

const endTime = new Date("2026-11-07T19:00:00Z");

describe("meal availability", () => {
	it("defaults last call to the meal end time", () => {
		expect(mealAvailabilityEnd({ endTime, lastCallEndsAt: null })).toEqual(
			endTime
		);
	});

	it("uses the admin's configured last call end time", () => {
		const lastCallEndsAt = new Date("2026-11-07T19:30:00Z");
		expect(mealAvailabilityEnd({ endTime, lastCallEndsAt })).toEqual(
			lastCallEndsAt
		);
	});
});
