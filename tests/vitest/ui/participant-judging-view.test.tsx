import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JudgingView } from "@/app/components/participant/judging/JudgingView";
import { judgingStages } from "@/lib/participant-judging";

vi.mock("@/hooks/use-current-time", () => ({
	useCurrentTime: () => new Date("2026-11-08T12:00:00Z")
}));

const rounds = ["Round 1", "Round 2"].map((name, index) => ({
	id: `round-${index}`,
	name,
	kind: index ? ("final" as const) : ("panel" as const),
	startTime: new Date(`2026-11-08T${index + 12}:00:00Z`),
	endTime: new Date(`2026-11-08T${index + 13}:00:00Z`)
}));
const criteria = ["Innovation", "Technical execution"].map((name, index) => ({
	id: `criterion-${index}`,
	name,
	description: `Published ${name} description.`,
	displayOrder: index,
	maxScore: 5,
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
	rounds: [{ roundId: "round-0", criterionId: "criterion-0", value: 3.5 }]
};
function judging(kind: "panel" | "final", tables: number[]) {
	return [
		{
			round: {
				id: `${kind}-round`,
				name: kind === "panel" ? "Panel Round" : "Final Round",
				kind,
				startTime: new Date("2026-11-08T19:00:00Z"),
				presentationMinutes: 6,
				publishedAt: new Date("2026-11-08T12:00:00Z")
			},
			assignments: tables.map((tableNumber, index) => ({
				id: `assignment-${index}`,
				tableNumber,
				startsAt: new Date(Date.UTC(2026, 10, 8, 19, index * 8))
			}))
		}
	];
}
function view(overrides: Partial<Parameters<typeof JudgingView>[0]> = {}) {
	return (
		<JudgingView
			criteria={criteria}
			events={[]}
			judging={[]}
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
		expect(screen.queryByText(/3.5/)).not.toBeInTheDocument();
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
		expect(within(section).getByText("3.5 / 5")).toBeVisible();
		expect(
			screen.queryByText(/Judge A|Judge comments/)
		).not.toBeInTheDocument();
	});
	it("shows the team's tables, times and when to arrive", () => {
		render(view({ judging: judging("panel", [3, 5]) }));
		expect(
			screen.getByRole("heading", { name: "Panel Round: your team’s judging" })
		).toBeVisible();
		expect(screen.getByText("Table 3 → Table 5")).toBeVisible();
		expect(
			screen.getByText(
				"Arrive by 12:50 PM. Present at Table 3 at 1:00 PM, then Table 5 at 1:08 PM. You have 6 minutes per presentation, including Q&A."
			)
		).toBeVisible();
		expect(screen.queryByRole("link")).not.toBeInTheDocument();
		expect(screen.queryByText(/ongoing now/)).not.toBeInTheDocument();
	});
	it("tells finalists when they present to every judge", () => {
		render(view({ judging: judging("final", [1]) }));
		expect(
			screen.getByRole("heading", { name: "You’re a finalist!" })
		).toBeVisible();
		expect(
			screen.getByText(
				"Arrive by 12:50 PM. Present to every judge at 1:00 PM. You have 6 minutes, including Q&A."
			)
		).toBeVisible();
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
	it("shows panel-round team scores and leaves out finals scores", () => {
		render(
			view({
				settings: { ...settings, judgingPhase: "winners_announced" },
				results: {
					released: true,
					rounds: [
						{ roundId: "round-0", criterionId: "criterion-0", value: 3.5 },
						{ roundId: "round-1", criterionId: "criterion-0", value: 4.5 },
						{ roundId: "round-1", criterionId: "criterion-1", value: 4 }
					]
				}
			})
		);
		const section = screen.getByRole("region", { name: "Team Scores" });
		expect(within(section).getByText("3.5 / 5")).toBeVisible();
		expect(within(section).queryByText("4.5 / 5")).not.toBeInTheDocument();
		expect(
			within(section).queryByText("Technical execution")
		).not.toBeInTheDocument();
	});
});
