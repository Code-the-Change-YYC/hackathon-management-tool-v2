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
	mutate: vi.fn(),
	rounds: vi.fn(),
	settings: vi.fn(),
	layout: vi.fn(),
	assignments: vi.fn(),
	users: vi.fn(),
	teams: vi.fn(),
	invalidate: vi.fn()
}));
vi.mock("@/app/components/ConfirmAlertDialog", () => ({
	useConfirmDialog: () => ({ confirm: mocks.confirm, dialogProps: {} })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		useUtils: () => ({
			judgingRooms: { getLayoutByRound: { invalidate: mocks.invalidate } },
			judgingAssignments: {
				getByRound: { invalidate: mocks.invalidate },
				getAll: { invalidate: mocks.invalidate }
			}
		}),
		judgingRounds: { getAll: { useQuery: mocks.rounds } },
		hackathonSettings: { get: { useQuery: mocks.settings } },
		judgingRooms: {
			getLayoutByRound: { useQuery: mocks.layout },
			generateSchedule: {
				useMutation: () => ({ mutate: mocks.mutate, isPending: false })
			}
		},
		judgingAssignments: { getByRound: { useQuery: mocks.assignments } },
		users: { getAll: { useQuery: mocks.users } },
		teams: { getAll: { useQuery: mocks.teams } }
	}
}));
const start = new Date("2026-09-22T09:00:00Z");
const end = new Date("2026-09-22T11:00:00Z");
const query = (data: unknown) => ({ data, isLoading: false, error: null });
beforeEach(() => {
	vi.resetAllMocks();
	mocks.confirm.mockResolvedValue(true);
	mocks.rounds.mockReturnValue(
		query([{ id: "round", name: "Round 1", startTime: start, endTime: end }])
	);
	mocks.settings.mockReturnValue(query({ currentRoundId: "round" }));
	mocks.layout.mockReturnValue(query({ rooms: [] }));
	mocks.assignments.mockReturnValue(query([]));
	mocks.users.mockReturnValue(
		query([{ id: "judge", name: "Judge", role: "judge" }])
	);
	mocks.teams.mockReturnValue(
		query([
			{ id: "passed", name: "Passed", prescreenStatus: "passed" },
			{ id: "pending", name: "Pending", prescreenStatus: "pending" }
		])
	);
});
describe("admin schedule refactor", () => {
	it("only includes passed teams and preserves the generation request", async () => {
		const { result } = renderHook(useAdminJudgingSchedule);
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
		mocks.assignments.mockReturnValue(
			query([
				{
					id: "assignment",
					timeSlot: start,
					room: { id: "room" },
					scores: [{ value: 0 }]
				}
			])
		);
		const { result } = renderHook(useAdminJudgingSchedule);
		expect(result.current.readiness.canAssign).toBe(false);
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.mutate).not.toHaveBeenCalled();
		expect(mocks.confirm).not.toHaveBeenCalled();
		expect(result.current.assignmentMessage).toContain("scored assignments");
	});
	it("keeps an existing unscored schedule when replacement is cancelled", async () => {
		mocks.layout.mockReturnValue(
			query({ rooms: [{ id: "room", name: "Room 1" }] })
		);
		mocks.confirm.mockResolvedValue(false);
		const { result } = renderHook(useAdminJudgingSchedule);
		await act(async () => result.current.handleAutoAssign());
		expect(mocks.confirm).toHaveBeenCalled();
		expect(mocks.mutate).not.toHaveBeenCalled();
		expect(result.current.assignmentMessage).toBe("Assignment cancelled.");
	});
	it("blocks room configurations requiring more judges than are available", async () => {
		const { result } = renderHook(useAdminJudgingSchedule);
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
				isLoading={false}
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
