import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import JudgingError from "@/app/participant/judging/error";
import ParticipantJudgingPage from "@/app/participant/judging/page";

const mocks = vi.hoisted(() => ({ requireRole: vi.fn() }));
vi.mock("@/server/better-auth/auth-helpers/helpers", () => ({
	requireRole: mocks.requireRole
}));
vi.mock("@/app/components/participant/ParticipantJudging", () => ({
	ParticipantJudging: () => <div>Participant judging information</div>
}));
describe("participant judging route", () => {
	it("requires participant access before rendering judging information", async () => {
		render(await ParticipantJudgingPage());
		expect(mocks.requireRole).toHaveBeenCalledWith(["participant", "admin"]);
		expect(screen.getByText("Participant judging information")).toBeVisible();
	});
	it("lets participants retry a failed request", () => {
		const reset = vi.fn();
		render(<JudgingError reset={reset} />);
		fireEvent.click(screen.getByRole("button", { name: "Try again" }));
		expect(reset).toHaveBeenCalledOnce();
	});
});
