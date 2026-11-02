import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ParticipantError from "@/app/participant/error";
import JudgingPage from "@/app/participant/judging/page";

const { progress, status } = vi.hoisted(() => ({
	progress: {
		startDate: null,
		submissionDeadline: null,
		prescreenComplete: false,
		rounds: [],
		scoresReleased: false
	},
	status: { team: null, rounds: [], finalPublished: false }
}));
const mocks = vi.hoisted(() => ({
	requireRole: vi.fn(),
	judgingView: vi.fn()
}));
vi.mock("@/server/better-auth/auth-helpers/helpers", () => ({
	requireRole: mocks.requireRole
}));
vi.mock("@/trpc/server", () => ({
	api: {
		judgingProgress: {
			get: async () => progress,
			getMine: async () => status
		},
		criteria: { getPublic: async () => [] },
		scores: { getMineReleased: async () => ({ released: false, rounds: [] }) }
	}
}));
vi.mock("@/app/components/AutoRefresh", () => ({
	AutoRefresh: () => null
}));
vi.mock("@/app/components/participant/judging/JudgingView", () => ({
	JudgingView: (props: unknown) => {
		mocks.judgingView(props);
		return <div>Participant judging information</div>;
	}
}));

describe("participant judging route", () => {
	it("requires participant access and passes the fetched data to the view", async () => {
		render(await JudgingPage());
		expect(mocks.requireRole).toHaveBeenCalledWith(["participant", "admin"]);
		expect(screen.getByText("Participant judging information")).toBeVisible();
		expect(mocks.judgingView).toHaveBeenCalledWith({
			criteria: [],
			progress,
			results: { released: false, rounds: [] },
			status
		});
	});
	it("lets participants retry a failed page", () => {
		const retry = vi.fn();
		render(<ParticipantError retry={retry} />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(retry).toHaveBeenCalledOnce();
	});
});
