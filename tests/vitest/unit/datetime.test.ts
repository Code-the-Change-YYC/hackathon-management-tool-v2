import { describe, expect, it } from "vitest";
import {
	formatDateKey,
	formatDateTime,
	formatTime,
	fromDateTimeLocalValue,
	isSameCalgaryDay,
	toDateInputValue,
	toDateTimeLocalValue
} from "@/lib/datetime";

// Tests run with TZ=UTC, like a production server.
// 6:30 PM on October 17 in Calgary (MDT, UTC-6).
const instant = new Date("2026-10-18T00:30:00Z");

describe("datetime helpers", () => {
	it("formats in Calgary time, not the runtime's time zone", () => {
		expect(formatTime(instant)).toBe("6:30 PM");
		expect(formatDateTime(instant)).toBe("Oct 17, 2026, 6:30 PM");
		expect(formatDateKey(instant)).toBe("2026-10-17");
	});

	it("compares days in Calgary", () => {
		const morning = new Date("2026-10-17T15:00:00Z");
		expect(isSameCalgaryDay(instant, morning)).toBe(true);
	});

	it("round-trips datetime-local values as Calgary wall-clock time", () => {
		expect(toDateTimeLocalValue(instant)).toBe("2026-10-17T18:30");
		expect(fromDateTimeLocalValue("2026-10-17T18:30")).toEqual(instant);
		expect(fromDateTimeLocalValue("")).toBeNull();
		expect(toDateTimeLocalValue(null)).toBe("");
	});

	it("keeps Calgary on UTC-6 after November 1, 2026", () => {
		// Older time-zone data moves Calgary to UTC-7 here, an hour off.
		const hackathonMorning = new Date("2026-11-07T15:00:00Z");
		expect(formatTime(hackathonMorning)).toBe("9:00 AM");
		expect(fromDateTimeLocalValue("2026-11-07T09:00")).toEqual(
			hackathonMorning
		);
		expect(formatDateTime(new Date("2027-01-15T15:00:00Z"))).toBe(
			"Jan 15, 2027, 9:00 AM"
		);
	});

	it("fills a date input with the Calgary day", () => {
		expect(toDateInputValue(instant)).toBe("2026-10-17");
	});
});
