import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { JudgingView } from "@/app/components/participant/ParticipantJudging";
import { criterionAppliesToRound } from "@/lib/judging";
import { judgingStages } from "@/lib/participant-judging";

const rounds = ["Round 1", "Round 2"].map((name, index) => ({
	id: `round-${index}`,
	name,
	startTime: new Date(`2026-11-09T${index + 12}:00:00Z`),
	endTime: new Date(`2026-11-09T${index + 13}:00:00Z`)
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
	timeZone: "America/Edmonton",
	judgingPhase: "judging",
	currentRoundId: "round-0",
	submissionDeadline: new Date("2026-11-09T19:00:00Z")
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
	it("disables unavailable rounds and filters published criteria", () => {
		render(view());
		const filter = screen.getByRole("group", { name: "Rubric round" });
		expect(
			within(filter).getByRole("button", { name: "Round 2" })
		).toBeDisabled();
		expect(screen.queryByText("Technical execution")).not.toBeInTheDocument();
	});
	it("unlocks completed rounds and changes rubric criteria", () => {
		render(view({ settings: { ...settings, currentRoundId: "round-1" } }));
		fireEvent.click(
			within(screen.getByRole("group", { name: "Rubric round" })).getByRole(
				"button",
				{ name: "Round 2" }
			)
		);
		expect(screen.getByText("Technical execution")).toBeVisible();
	});
	it("shows released averages without fabricated judge comments", () => {
		render(
			view({ settings: { ...settings, judgingPhase: "winners_announced" } })
		);
		const section = screen.getByRole("region", { name: "Team Scores" });
		expect(within(section).getByText("7.5 / 10")).toBeVisible();
		expect(
			within(section).getByRole("button", { name: "Round 2" })
		).toBeDisabled();
		expect(
			screen.queryByText(/Judge A|Judge comments/)
		).not.toBeInTheDocument();
	});
	it("shows assigned time and safe meeting navigation without claiming an ongoing event", () => {
		const assignment = {
			id: "assigned",
			timeSlot: new Date("2026-11-09T20:00:00Z"),
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
	it("keeps round controls available when a round has no criteria", () => {
		render(
			view({
				criteria: [
					{
						...criteria[0],
						id: "only-second",
						name: "Only second round",
						description: "",
						displayOrder: 0,
						maxScore: 10,
						isSidepot: false,
						roundIds: ["round-1"]
					}
				],
				settings: { ...settings, currentRoundId: "round-1" }
			})
		);
		fireEvent.click(
			within(screen.getByRole("group", { name: "Rubric round" })).getByRole(
				"button",
				{ name: "Round 2" }
			)
		);
		expect(screen.getByText("Only second round")).toBeVisible();
	});
	it("does not advance rounds using their timestamps or a missing active round", () => {
		expect(
			judgingStages("judging", rounds, null)
				.filter((stage) => rounds.some((round) => round.id === stage.id))
				.every((stage) => stage.state === "upcoming")
		).toBe(true);
		expect(criterionAppliesToRound({}, "any")).toBe(true);
		expect(criterionAppliesToRound({ roundIds: ["round-0"] }, "round-1")).toBe(
			false
		);
	});
	it("provides an empty state after release without scores", () => {
		render(
			view({
				settings: { ...settings, judgingPhase: "winners_announced" },
				results: { released: true, rounds: [] }
			})
		);
		expect(
			screen.getByText("No scores have been published for your team yet.")
		).toBeVisible();
	});
});
