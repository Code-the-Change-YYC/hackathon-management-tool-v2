import { describe, expect, it } from "vitest";
import {
	formatDateKey,
	formatDateTime,
	formatTime,
	fromDateInputValue,
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

	it("uses Calgary's offset on the parsed date, not today's", () => {
		// January 2026 is still MST (UTC-7).
		expect(fromDateTimeLocalValue("2026-01-15T18:30")).toEqual(
			new Date("2026-01-16T01:30:00Z")
		);
	});

	it("changes the day of a date input while keeping its time of day", () => {
		expect(toDateInputValue(instant)).toBe("2026-10-17");
		expect(fromDateInputValue("2026-10-20", instant)).toEqual(
			new Date("2026-10-21T00:30:00Z")
		);
		expect(fromDateInputValue("2026-10-20")).toEqual(
			new Date("2026-10-20T06:00:00Z")
		);
		expect(fromDateInputValue("")).toBeNull();
	});
});
