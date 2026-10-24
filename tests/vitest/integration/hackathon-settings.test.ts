import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaller } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

const mocks = vi.hoisted(() => ({
	eventStarts: vi.fn(),
	insertValues: vi.fn(),
	session: vi.fn()
}));

vi.mock("@/server/better-auth", () => ({
	auth: { api: { getSession: mocks.session } }
}));

vi.mock("@/server/db", () => ({
	db: {
		select: () => ({ from: mocks.eventStarts }),
		insert: () => ({ values: mocks.insertValues })
	}
}));

async function caller(role = "admin") {
	mocks.session.mockResolvedValue({
		user: { id: "current-user", role },
		session: { id: "test-session" }
	});
	return createCaller(await createTRPCContext({ headers: new Headers() }));
}

const dates = {
	startDate: new Date("2026-11-07T09:00:00-06:00"),
	endDate: new Date("2026-11-08T17:00:00-06:00"),
	submissionDeadline: new Date("2026-11-08T12:00:00-06:00")
};

beforeEach(() => {
	vi.resetAllMocks();
	mocks.eventStarts.mockResolvedValue([]);
	mocks.insertValues.mockReturnValue({
		onConflictDoUpdate: () => ({
			returning: async () => [{ id: 1, ...dates }]
		})
	});
});

describe("hackathonSettings.updateDates", () => {
	it("rejects callers without an admin session", async () => {
		const api = await caller("participant");

		await expect(
			api.hackathonSettings.updateDates(dates)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(mocks.insertValues).not.toHaveBeenCalled();
	});

	it.each([
		["the end is not after the start", { endDate: dates.startDate }],
		[
			"the deadline is not after the start",
			{ submissionDeadline: dates.startDate }
		],
		[
			"the deadline is after the end",
			{ submissionDeadline: new Date("2026-11-08T17:01:00-06:00") }
		]
	])("rejects dates where %s", async (_case, change) => {
		const api = await caller();

		await expect(
			api.hackathonSettings.updateDates({ ...dates, ...change })
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
		expect(mocks.insertValues).not.toHaveBeenCalled();
	});

	it("rejects dates that leave events outside the hackathon", async () => {
		mocks.eventStarts.mockResolvedValue([
			{ startTime: new Date("2026-11-06T23:00:00-06:00") },
			{ startTime: new Date("2026-11-07T08:00:00-06:00") },
			{ startTime: new Date("2026-11-09T00:00:00-06:00") }
		]);
		const api = await caller();

		await expect(
			api.hackathonSettings.updateDates(dates)
		).rejects.toMatchObject({
			code: "BAD_REQUEST",
			message:
				"2 events are scheduled outside these dates. Move or delete them first."
		});
		expect(mocks.insertValues).not.toHaveBeenCalled();
	});

	it("saves the dates, with or without a deadline", async () => {
		mocks.eventStarts.mockResolvedValue([
			{ startTime: new Date("2026-11-07T08:00:00-06:00") }
		]);
		const api = await caller();

		await api.hackathonSettings.updateDates({
			...dates,
			submissionDeadline: null
		});

		expect(mocks.insertValues).toHaveBeenCalledWith({
			id: 1,
			...dates,
			submissionDeadline: null
		});
	});
});

describe("hackathonSettings.update", () => {
	it("leaves the hackathon dates to updateDates", async () => {
		const api = await caller();

		await api.hackathonSettings.update({
			currentRoundId: null,
			...dates
		} as Parameters<typeof api.hackathonSettings.update>[0]);

		expect(mocks.insertValues).toHaveBeenCalledWith({
			id: 1,
			currentRoundId: null
		});
	});
});
