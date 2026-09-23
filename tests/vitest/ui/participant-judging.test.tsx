import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JudgingAssignmentCard } from "@/app/participant/judging/components/JudgingAssignmentCard";
import JudgingError from "@/app/participant/judging/error";
import ParticipantJudgingPage from "@/app/participant/judging/page";

const mocks = vi.hoisted(() => ({
	requireRole: vi.fn(),
	getAssignment: vi.fn()
}));
vi.mock("@/server/better-auth/auth-helpers/helpers", () => ({
	requireRole: mocks.requireRole
}));
vi.mock("@/trpc/server", () => ({
	api: { judgingAssignments: { getMineForActiveRound: mocks.getAssignment } }
}));
type Assignment = Parameters<typeof JudgingAssignmentCard>[0]["assignment"];
function assignment(
	timeSlot: Date | null = new Date("2026-09-22T17:30:00Z"),
	roomLink: string | null = "https://example.com/meeting"
) {
	return {
		timeSlot,
		team: { name: "Team Example" },
		room: { name: "Room 2", roomLink, round: { name: "Preliminary Round" } }
	} as Assignment;
}
beforeEach(() => {
	vi.resetAllMocks();
	mocks.requireRole.mockResolvedValue({ user: { name: "Participant" } });
});
describe("participant judging", () => {
	it("shows assignment details and a real meeting link", () => {
		const { container } = render(
			<JudgingAssignmentCard assignment={assignment()} />
		);
		expect(screen.getByText("Team Example")).toBeVisible();
		expect(screen.getByText("Preliminary Round")).toBeVisible();
		expect(screen.getByText("Room 2")).toBeVisible();
		expect(container.querySelector("time")).toHaveAttribute(
			"datetime",
			"2026-09-22T17:30:00.000Z"
		);
		const link = screen.getByRole("link", { name: /Join judging meeting/ });
		expect(link).toHaveAttribute("href", "https://example.com/meeting");
		expect(link).toHaveAttribute("rel", "noopener noreferrer");
	});
	it("keeps assigned but unscheduled teams distinct from unassigned teams", () => {
		render(<JudgingAssignmentCard assignment={assignment(null, null)} />);
		expect(screen.getByText("Time to be announced")).toBeVisible();
		expect(
			screen.getByText("Your meeting link is not available yet.")
		).toBeVisible();
		expect(screen.getByText("Room 2")).toBeVisible();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
	it.each([
		"javascript:alert(1)",
		"not a URL"
	])("does not expose invalid meeting URL %s", (roomLink) => {
		render(<JudgingAssignmentCard assignment={assignment(null, roomLink)} />);
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
	});
	it("renders a genuine missing assignment as an empty state", async () => {
		mocks.getAssignment.mockResolvedValue(null);
		render(await ParticipantJudgingPage());
		expect(mocks.requireRole).toHaveBeenCalled();
		expect(
			screen.getByRole("heading", { name: "No judging assignment yet" })
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "View your team" })
		).toHaveAttribute("href", "/participant/team");
	});
	it("passes fetch failures to the error boundary instead of pretending there is no assignment", async () => {
		mocks.getAssignment.mockRejectedValue(new Error("Database unavailable"));
		await expect(ParticipantJudgingPage()).rejects.toThrow(
			"Database unavailable"
		);
	});
	it("lets participants retry a failed request", () => {
		const reset = vi.fn();
		render(<JudgingError reset={reset} />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(reset).toHaveBeenCalledOnce();
	});
});
