import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JudgingView } from "@/app/components/participant/judging/JudgingView";
import { judgingStages } from "@/lib/participant-judging";

const rounds = ["Round 1", "Round 2"].map((name, index) => ({
	id: `round-${index}`,
	name,
	startTime: new Date(`2026-11-08T${index + 12}:00:00Z`),
	endTime: new Date(`2026-11-08T${index + 13}:00:00Z`)
}));
const criteria = ["Innovation", "Technical execution"].map((name, index) => ({
	id: `criterion-${index}`,
	name,
	description: `Published ${name} description.`,
	displayOrder: index,
	maxScore: 10,
	isSidepot: false,
	roundIds: index ? ["round-1"] : []
}));
const settings = {
	judgingPhase: "judging",
	currentRoundId: "round-0",
	submissionDeadline: new Date("2026-11-08T19:00:00Z")
} as NonNullable<Parameters<typeof JudgingView>[0]["settings"]>;
const results = {
	released: true,
	rounds: [{ roundId: "round-0", criterionId: "criterion-0", value: 7.5 }]
};
function view(overrides: Partial<Parameters<typeof JudgingView>[0]> = {}) {
	return (
		<JudgingView
			assignment={null}
			criteria={criteria}
			events={[]}
			results={results}
			rounds={rounds}
			settings={settings}
			{...overrides}
		/>
	);
}

describe("participant judging information", () => {
	it("keeps results hidden before release even if cached results exist", () => {
		render(view());
		expect(
			screen.queryByRole("heading", { name: "Team Scores" })
		).not.toBeInTheDocument();
		expect(screen.queryByText(/7.5/)).not.toBeInTheDocument();
		expect(screen.getByText("Hackathon updates coming soon")).toBeVisible();
	});
	it("shows every published criterion without a round picker", () => {
		render(view());
		const rubric = screen.getByRole("region", { name: "Judging Rubric" });
		expect(within(rubric).getByText("Innovation")).toBeVisible();
		expect(within(rubric).getByText("Technical execution")).toBeVisible();
		expect(within(rubric).queryByRole("group")).not.toBeInTheDocument();
	});
	it("shows released averages without fabricated judge comments", () => {
		render(
			view({ settings: { ...settings, judgingPhase: "winners_announced" } })
		);
		const section = screen.getByRole("region", { name: "Team Scores" });
		expect(within(section).getByText("7.5 / 10")).toBeVisible();
		expect(
			screen.queryByText(/Judge A|Judge comments/)
		).not.toBeInTheDocument();
	});
	it("shows assigned time and safe meeting navigation without claiming an ongoing event", () => {
		const assignment = {
			id: "assigned",
			timeSlot: new Date("2026-11-08T19:00:00Z"),
			room: {
				name: "Room 2",
				roomLink: "https://example.com/meeting",
				round: rounds[0]
			}
		} as NonNullable<Parameters<typeof JudgingView>[0]["assignment"]>;
		render(view({ assignment }));
		expect(screen.getByRole("link", { name: "Join meeting" })).toHaveAttribute(
			"href",
			"https://example.com/meeting"
		);
		expect(screen.getByText("Room 2")).toBeVisible();
		expect(screen.getByText("1:00 PM")).toBeVisible();
		expect(screen.queryByText(/ongoing now/)).not.toBeInTheDocument();
	});
	it("does not advance rounds using their timestamps or a missing active round", () => {
		expect(
			judgingStages("judging", rounds, null)
				.filter((stage) => rounds.some((round) => round.id === stage.id))
				.every((stage) => stage.state === "upcoming")
		).toBe(true);
	});
	it("provides an empty state after release without scores", () => {
		render(
			view({
				settings: { ...settings, judgingPhase: "winners_announced" },
				results: { released: true, rounds: [] }
			})
		);
		expect(screen.getByText("No team scores yet")).toBeVisible();
	});
	it("shows first-round team scores and leaves out finals scores", () => {
		render(
			view({
				settings: { ...settings, judgingPhase: "winners_announced" },
				results: {
					released: true,
					rounds: [
						{ roundId: "round-0", criterionId: "criterion-0", value: 7.5 },
						{ roundId: "round-1", criterionId: "criterion-0", value: 9 },
						{ roundId: "round-1", criterionId: "criterion-1", value: 8 }
					]
				}
			})
		);
		const section = screen.getByRole("region", { name: "Team Scores" });
		expect(within(section).getByText("7.5 / 10")).toBeVisible();
		expect(within(section).queryByText("9 / 10")).not.toBeInTheDocument();
		expect(
			within(section).queryByText("Technical execution")
		).not.toBeInTheDocument();
	});
});
