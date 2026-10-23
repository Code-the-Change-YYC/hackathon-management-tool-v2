import {
	act,
	fireEvent,
	render,
	renderHook,
	screen
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminScheduleGrid } from "@/app/components/admin/judging/AdminScheduleGrid";
import { useAdminJudgingSchedule } from "@/app/components/admin/judging/useAdminJudgingSchedule";

const mocks = vi.hoisted(() => ({
	confirm: vi.fn(),
	mutate: vi.fn()
}));
vi.mock("@/app/components/ConfirmAlertDialog", () => ({
	useConfirmDialog: () => ({ confirm: mocks.confirm, dialogProps: {} })
}));
vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		judgingRooms: {
			generateSchedule: {
				useMutation: () => ({ mutate: mocks.mutate, isPending: false })
			}
		}
	}
}));
const start = new Date("2026-09-22T09:00:00Z");
const end = new Date("2026-09-22T11:00:00Z");
type ScheduleData = Parameters<typeof useAdminJudgingSchedule>[0];
let data: ScheduleData;
beforeEach(() => {
	vi.resetAllMocks();
	mocks.confirm.mockResolvedValue(true);
	data = {
		rounds: [{ id: "round", name: "Round 1", startTime: start, endTime: end }],
		activeRoundId: "round",
		layouts: { round: [] },
		assignments: [],
		judges: [{ id: "judge", name: "Judge", role: "judge" }],
		teams: [
			{ id: "passed", name: "Passed", prescreenStatus: "passed" },
			{ id: "pending", name: "Pending", prescreenStatus: "pending" }
		]
	} as unknown as ScheduleData;
});
const renderSchedule = () => renderHook(() => useAdminJudgingSchedule(data));
describe("admin schedule refactor", () => {
	it("only includes passed teams and preserves the generation request", async () => {
		const { result } = renderSchedule();
		expect(result.current.eligibleTeams.map((team) => team.id)).toEqual([
			"passed"
		]);
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.mutate).toHaveBeenCalledExactlyOnceWith({
			roundId: "round",
			roomCount: 1,
			judgesPerRoom: 1,
			slotDurationMinutes: 30,
			totalJudgingMinutes: 120
		});
	});
	it("blocks schedule replacement if any assignment already has scores", async () => {
		data.assignments = [
			{
				id: "assignment",
				timeSlot: start,
				room: { id: "room", round: { id: "round" } },
				scores: [{ value: 0 }]
			}
		] as unknown as ScheduleData["assignments"];
		const { result } = renderSchedule();
		expect(result.current.readiness.canAssign).toBe(false);
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.mutate).not.toHaveBeenCalled();
		expect(mocks.confirm).not.toHaveBeenCalled();
		expect(result.current.assignmentMessage).toContain("scored assignments");
	});
	it("keeps an existing unscored schedule when replacement is cancelled", async () => {
		data.layouts = {
			round: [{ id: "room", name: "Room 1" }]
		} as unknown as ScheduleData["layouts"];
		mocks.confirm.mockResolvedValue(false);
		const { result } = renderSchedule();
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.confirm).toHaveBeenCalled();
		expect(mocks.mutate).not.toHaveBeenCalled();
		expect(result.current.assignmentMessage).toBe("Assignment cancelled.");
	});
	it("blocks room configurations requiring more judges than are available", async () => {
		const { result } = renderSchedule();
		act(() => result.current.setRoomCount(2));
		expect(result.current.readiness.canAssign).toBe(false);
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.mutate).not.toHaveBeenCalled();
	});
	it("paginates long rounds without dropping the final slot", () => {
		const rooms = [
			{
				id: "room",
				name: "Room 1",
				roomLink: "",
				staffIds: [],
				teamIds: [],
				teamTimeSlots: {}
			}
		];
		render(
			<AdminScheduleGrid
				assignments={[]}
				rooms={rooms}
				roundEnd={new Date(start.getTime() + 49 * 30 * 60000)}
				roundStart={start}
				slotMinutes={30}
			/>
		);
		expect(screen.getByText("Showing slots 1-48 of 49")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Next" }));
		expect(screen.getByText("Showing slots 49-49 of 49")).toBeVisible();
		expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
		fireEvent.click(screen.getByRole("button", { name: "Previous" }));
		expect(screen.getByText("Showing slots 1-48 of 49")).toBeVisible();
	});
});
