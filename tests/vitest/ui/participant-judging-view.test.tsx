import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JudgingView } from "@/app/components/participant/judging/JudgingView";
import {
	type JudgingProgress,
	judgingStages,
	type TeamJudgingStatus
} from "@/lib/participant-judging";

const now = new Date("2026-11-08T18:00:00Z");
vi.mock("@/hooks/use-current-time", () => ({
	useCurrentTime: () => new Date("2026-11-08T18:00:00Z")
}));

const progress: JudgingProgress = {
	startDate: new Date("2026-11-07T15:00:00Z"),
	submissionDeadline: new Date("2026-11-08T15:00:00Z"),
	prescreenComplete: true,
	rounds: [
		{
			id: "round-0",
			name: "Panel Round",
			kind: "panel",
			startTime: new Date("2026-11-08T17:00:00Z"),
			endTime: new Date("2026-11-08T20:00:00Z"),
			scoringComplete: false
		},
		{
			id: "round-1",
			name: "Final Round",
			kind: "final",
			startTime: new Date("2026-11-08T22:00:00Z"),
			endTime: new Date("2026-11-08T23:00:00Z"),
			scoringComplete: false
		}
	],
	scoresReleased: false
};
const criteria = ["Innovation", "Technical execution"].map((name, index) => ({
	id: `criterion-${index}`,
	name,
	description: `Published ${name} description.`,
	displayOrder: index,
	maxScore: 5,
	isSidepot: false,
	roundIds: index ? ["round-1"] : []
}));
const results = {
	released: false,
	rounds: [{ roundId: "round-0", criterionId: "criterion-0", value: 3.5 }]
};
const team = {
	name: "Team Rocket",
	prescreen: "passed" as const,
	feedback: null
};

function teamRound(
	kind: "panel" | "final",
	firstStart: string,
	tables: number[],
	scored = false
) {
	const roundId = kind === "panel" ? "round-0" : "round-1";
	return {
		round: {
			id: roundId,
			name: kind === "panel" ? "Panel Round" : "Final Round",
			kind,
			startTime: new Date(firstStart),
			presentationMinutes: 6,
			publishedAt: new Date("2026-11-08T12:00:00Z")
		},
		assignments: tables.map((tableNumber, index) => ({
			id: `${roundId}-${index}`,
			tableNumber,
			startsAt: new Date(new Date(firstStart).getTime() + index * 8 * 60_000)
		})),
		scored
	};
}

function view({
	status,
	...overrides
}: Partial<Omit<Parameters<typeof JudgingView>[0], "status">> & {
	status?: Partial<TeamJudgingStatus>;
} = {}) {
	return (
		<JudgingView
			criteria={criteria}
			progress={progress}
			results={results}
			status={{ team, rounds: [], finalPublished: false, ...status }}
			{...overrides}
		/>
	);
}

function stageStates(overrides: Partial<JudgingProgress>, at = now) {
	return Object.fromEntries(
		judgingStages({ ...progress, ...overrides }, at).map((stage) => [
			stage.id,
			stage.state
		])
	);
}

describe("participant judging stages", () => {
	it("follows the clock for submissions and starts pre-screening once they close", () => {
		expect(stageStates({}, new Date("2026-11-07T12:00:00Z"))).toMatchObject({
			submissions: "upcoming",
			prescreen: "upcoming"
		});
		expect(stageStates({}, new Date("2026-11-08T14:59:00Z"))).toMatchObject({
			submissions: "current",
			prescreen: "upcoming"
		});
		expect(stageStates({ prescreenComplete: false })).toMatchObject({
			submissions: "completed",
			prescreen: "current"
		});
	});
	it("completes pre-screening once every team has passed or failed", () => {
		expect(stageStates({ prescreenComplete: true }).prescreen).toBe(
			"completed"
		);
	});
	it("starts each round at its start time and completes it once every team is scored", () => {
		expect(stageStates({})).toMatchObject({
			"round-0": "current",
			"round-1": "upcoming",
			winners: "upcoming"
		});
		expect(
			stageStates({
				rounds: progress.rounds.map((round) => ({
					...round,
					scoringComplete: true
				}))
			})
		).toMatchObject({ "round-0": "completed", "round-1": "upcoming" });
	});
	it("waits for the release after the last round, then completes the winners stage", () => {
		const scored = progress.rounds.map((round) => ({
			...round,
			scoringComplete: true
		}));
		const afterFinal = new Date("2026-11-09T00:00:00Z");
		expect(stageStates({ rounds: scored }, afterFinal).winners).toBe("current");
		expect(
			stageStates({ rounds: scored, scoresReleased: true }, afterFinal).winners
		).toBe("completed");
	});
});

describe("participant judging information", () => {
	it("keeps results hidden until scores are released", () => {
		render(view());
		expect(
			screen.queryByRole("heading", { name: "Your Scores" })
		).not.toBeInTheDocument();
		expect(screen.queryByText(/3.5/)).not.toBeInTheDocument();
	});
	it("shows every published criterion without a round picker", () => {
		render(view());
		const rubric = screen.getByRole("region", { name: "Judging Rubric" });
		expect(within(rubric).getByText("Innovation")).toBeVisible();
		expect(within(rubric).getByText("Technical execution")).toBeVisible();
		expect(within(rubric).queryByRole("group")).not.toBeInTheDocument();
	});
	it("replaces the rubric with released averages, without fabricated judge comments", () => {
		render(view({ results: { ...results, released: true } }));
		expect(
			screen.queryByRole("region", { name: "Judging Rubric" })
		).not.toBeInTheDocument();
		const section = screen.getByRole("region", { name: "Your Scores" });
		expect(within(section).getByText("3.5 / 5")).toBeVisible();
		expect(
			screen.queryByText(/Judge A|Judge comments/)
		).not.toBeInTheDocument();
	});
	it("provides an empty state after release without scores", () => {
		render(view({ results: { released: true, rounds: [] } }));
		expect(screen.getByText("No team scores")).toBeVisible();
	});
	it("shows panel-round team scores and leaves out finals scores", () => {
		render(
			view({
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
		const section = screen.getByRole("region", { name: "Your Scores" });
		expect(within(section).getByText("3.5 / 5")).toBeVisible();
		expect(within(section).queryByText("4.5 / 5")).not.toBeInTheDocument();
		expect(
			within(section).queryByText("Technical execution")
		).not.toBeInTheDocument();
	});
});

describe("participant team judging card", () => {
	it("asks participants without a team to join one", () => {
		render(view({ status: { team: null } }));
		expect(screen.getByText("You’re not on a team yet")).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Go to your team" })
		).toHaveAttribute("href", "/participant/team");
	});
	it("explains pending pre-screening before and after submissions close", () => {
		const pending = { team: { ...team, prescreen: "pending" as const } };
		const { rerender } = render(
			view({
				status: pending,
				progress: {
					...progress,
					submissionDeadline: new Date("2026-11-08T20:00:00Z")
				}
			})
		);
		expect(
			screen.getByText("Your project is pre-screened once submissions close.")
		).toBeVisible();
		rerender(view({ status: pending }));
		expect(screen.getByText("Pre-screening in progress")).toBeVisible();
	});
	it("shows the organizers’ feedback when the team fails pre-screening", () => {
		render(
			view({
				status: {
					team: {
						...team,
						prescreen: "failed",
						feedback: "The demo video is missing."
					},
					rounds: [teamRound("panel", "2026-11-08T19:00:00Z", [3])]
				}
			})
		);
		expect(screen.getByText("Didn’t pass pre-screening")).toBeVisible();
		expect(screen.getByText("The demo video is missing.")).toBeVisible();
		expect(screen.queryByText(/your presentations/)).not.toBeInTheDocument();
	});
	it("shows the team’s tables, times and when to arrive", () => {
		render(
			view({
				status: { rounds: [teamRound("panel", "2026-11-08T19:00:00Z", [3, 5])] }
			})
		);
		expect(screen.getByText("Passed pre-screening")).toBeVisible();
		expect(screen.getByText("Panel Round: your presentations")).toBeVisible();
		expect(
			screen.getByText(
				"Arrive by 12:50 PM. Present at Table 3 at 1:00 PM, then Table 5 at 1:08 PM. You have 6 minutes per presentation, including Q&A."
			)
		).toBeVisible();
	});
	it("tells the team whether it has been scored after presenting", () => {
		const { rerender } = render(
			view({
				status: { rounds: [teamRound("panel", "2026-11-08T17:00:00Z", [3, 5])] }
			})
		);
		expect(screen.getByText("Panel Round: scoring in progress")).toBeVisible();
		rerender(
			view({
				status: {
					rounds: [teamRound("panel", "2026-11-08T17:00:00Z", [3, 5], true)]
				}
			})
		);
		expect(screen.getByText("Scored in Panel Round")).toBeVisible();
		expect(screen.getByText("Finalists coming soon")).toBeVisible();
	});
	it("tells finalists when they present to every judge", () => {
		render(
			view({
				status: {
					rounds: [
						teamRound("panel", "2026-11-08T17:00:00Z", [3], true),
						teamRound("final", "2026-11-08T22:00:00Z", [1])
					],
					finalPublished: true
				}
			})
		);
		expect(screen.getByText("You’re a finalist!")).toBeVisible();
		expect(
			screen.getByText(
				"Arrive by 3:50 PM. Present to every judge at 4:00 PM. You have 6 minutes, including Q&A."
			)
		).toBeVisible();
	});
	it("tells teams they weren’t selected once the final round is published", () => {
		render(
			view({
				status: {
					rounds: [teamRound("panel", "2026-11-08T17:00:00Z", [3], true)],
					finalPublished: true
				}
			})
		);
		expect(screen.getByText("Not selected for the final round")).toBeVisible();
	});
	it("stops saying judging is underway once scores are released", () => {
		const released = {
			progress: { ...progress, scoresReleased: true },
			results: { ...results, released: true }
		};
		const { rerender } = render(
			view({
				...released,
				status: {
					rounds: [
						teamRound("panel", "2026-11-08T17:00:00Z", [3], true),
						teamRound("final", "2026-11-08T17:30:00Z", [1], true)
					],
					finalPublished: true
				}
			})
		);
		expect(
			screen.getByText("Winners have been announced. Your scores are below.")
		).toBeVisible();
		expect(
			screen.getByText("Winners were announced at the closing ceremony.")
		).toBeVisible();
		expect(
			screen.queryByText(/Scores are shared once/)
		).not.toBeInTheDocument();
		expect(
			screen.queryByText("The judges are ranking the finalists.")
		).not.toBeInTheDocument();

		rerender(
			view({
				...released,
				status: {
					rounds: [teamRound("panel", "2026-11-08T17:00:00Z", [3], true)]
				}
			})
		);
		expect(screen.getByText("Not selected for the final round")).toBeVisible();
		expect(screen.queryByText("Finalists coming soon")).not.toBeInTheDocument();
	});
});
