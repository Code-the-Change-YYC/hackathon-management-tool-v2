import {
	focusManager,
	QueryClient,
	QueryClientProvider
} from "@tanstack/react-query";
import { act, cleanup, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useJudgePortalData } from "@/app/components/judges/useJudgePortalData";

const mocks = vi.hoisted(() => ({
	settings: vi.fn(),
	rounds: vi.fn(),
	assignments: vi.fn(),
	criteria: vi.fn()
}));
vi.mock("@/app/components/judges/JudgeUserProvider", () => ({
	useJudgeUser: () => ({ userId: "judge" })
}));
// Use real query observers so polling, cached errors and timestamps are exercised.
vi.mock("@/trpc/react", async () => {
	const { useQuery } = await import("@tanstack/react-query");
	const endpoint = (key: string, queryFn: () => Promise<unknown>) => ({
		useQuery: (_input: unknown, options: object) =>
			useQuery({ queryKey: [key], queryFn, retry: false, ...options })
	});
	return {
		api: {
			hackathonSettings: { get: endpoint("settings", mocks.settings) },
			judgingRounds: { getAll: endpoint("rounds", mocks.rounds) },
			judgingAssignments: {
				getByJudge: endpoint("assignments", mocks.assignments)
			},
			criteria: { getAll: endpoint("criteria", mocks.criteria) }
		}
	};
});

let client: QueryClient;
function wrapper({ children }: { children: ReactNode }) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
async function tick(ms = 1) {
	await act(async () => {
		await vi.advanceTimersByTimeAsync(ms);
	});
}
beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date("2026-09-19T16:00:00Z"));
	vi.resetAllMocks();
	focusManager.setFocused(true);
	client = new QueryClient({
		defaultOptions: { queries: { retry: false, staleTime: 30_000 } }
	});
	mocks.settings.mockResolvedValue({ currentRoundId: "round" });
	mocks.rounds.mockResolvedValue([]);
	mocks.assignments.mockResolvedValue([]);
	mocks.criteria.mockResolvedValue([]);
});
afterEach(() => {
	cleanup();
	client.clear();
	focusManager.setFocused(undefined);
	vi.useRealTimers();
});

describe("judge portal refresh", () => {
	it("opts into visible-page polling without enabling it for other callers", async () => {
		const { result, unmount } = renderHook(() => useJudgePortalData(), {
			wrapper
		});
		await tick();
		expect(result.current.hasData).toBe(true);
		await tick(30_000);
		expect(mocks.assignments).toHaveBeenCalledTimes(1);
		unmount();
		client.clear();
		vi.clearAllMocks();
		renderHook(() => useJudgePortalData({ refetchInterval: 30_000 }), {
			wrapper
		});
		await tick();
		await tick(30_000);
		for (const query of Object.values(mocks))
			expect(query).toHaveBeenCalledTimes(2);
		act(() => focusManager.setFocused(false));
		await tick(30_000);
		for (const query of Object.values(mocks))
			expect(query).toHaveBeenCalledTimes(2);
	});

	it("keeps cached data and a conservative timestamp when one query fails, then recovers", async () => {
		const { result } = renderHook(() => useJudgePortalData(), { wrapper });
		await tick();
		const updatedAt = result.current.updatedAt;
		expect(updatedAt).toBeTypeOf("number");
		mocks.criteria.mockRejectedValue(new Error("Offline"));
		await tick(1000);
		await act(async () => {
			await result.current.refresh();
		});
		await tick();
		expect(result.current.error?.message).toBe("Offline");
		expect(result.current.hasData).toBe(true);
		expect(result.current.assignments).toEqual([]);
		expect(result.current.updatedAt).toBe(updatedAt);
		mocks.criteria.mockResolvedValue([]);
		await act(async () => {
			await result.current.refresh();
		});
		await tick();
		expect(result.current.error).toBeNull();
		expect(result.current.updatedAt).toBeGreaterThan(updatedAt ?? 0);
		expect(result.current.isRefreshing).toBe(false);
	});

	it("does not report a complete schedule or freshness on an initial query failure", async () => {
		mocks.assignments.mockRejectedValue(new Error("Unavailable"));
		const { result } = renderHook(() => useJudgePortalData(), { wrapper });
		await tick();
		expect(result.current.hasData).toBe(false);
		expect(result.current.updatedAt).toBeNull();
		expect(result.current.error?.message).toBe("Unavailable");
	});
});
