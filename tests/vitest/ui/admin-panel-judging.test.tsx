import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinalistsDialog } from "@/app/components/admin/judging/FinalistsDialog";
import type {
	Layout,
	PanelRanking,
	Team
} from "@/app/components/admin/judging/judgingShared";
import { PanelResults } from "@/app/components/admin/judging/PanelResults";
import { PanelSchedule } from "@/app/components/admin/judging/PanelSchedule";
import { ScheduleDialog } from "@/app/components/admin/judging/ScheduleDialog";
import { judgingRound, judgingNow as now } from "../helpers/judging";

const { mocks, mutation } = vi.hoisted(() => ({
	mocks: {
		preview: vi.fn(),
		generate: vi.fn(),
		removeTeam: vi.fn(),
		setFinalists: vi.fn()
	},
	mutation: (mutate: () => void) => ({
		useMutation: () => ({ mutate, isPending: false })
	})
}));
vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => ({
	api: {
		judgingTables: {
			previewSchedule: { useQuery: mocks.preview },
			generateSchedule: mutation(mocks.generate),
			removeTeam: mutation(mocks.removeTeam),
			addTeam: mutation(vi.fn()),
			assignJudge: mutation(vi.fn())
		},
		judgingResults: { setFinalists: mutation(mocks.setFinalists) }
	}
}));

const round = judgingRound({
	presentationMinutes: 8,
	changeoverMinutes: 2,
	publishedAt: null
});
const minutes = (count: number) => new Date(now.getTime() + count * 60_000);
const team = (id: string) => ({ id, name: `Team ${id}` });
const judge = (id: string, name: string) => ({
	id: `seat-${id}`,
	tableId: "table",
	judgeId: id,
	createdAt: now,
	judge: { id, name, email: `${id}@example.com` }
});
const layout = {
	round,
	tables: [1, 2].map((tableNumber) => ({
		id: `table-${tableNumber}`,
		roundId: round.id,
		tableNumber,
		createdAt: now,
		updatedAt: now,
		judges:
			tableNumber === 1
				? [judge("a", "Ada"), judge("b", "Bo")]
				: [judge("c", "Cy")],
		assignments: [0, 10, 30].map((start) => ({
			id: `${tableNumber}-${start}`,
			teamId: `${tableNumber}${start}`,
			tableId: `table-${tableNumber}`,
			startsAt: minutes(start),
			createdAt: now,
			team: team(`${tableNumber}${start}`)
		}))
	}))
} as unknown as Layout;
const passedTeam = {
	id: "late",
	name: "Late",
	prescreenStatus: "passed"
} as Team;

function renderSchedule(
	props: Partial<Parameters<typeof PanelSchedule>[0]> = {}
) {
	return render(
		<PanelSchedule
			hasScores={false}
			judges={[]}
			layout={layout}
			round={round}
			teams={[passedTeam]}
			{...props}
		/>
	);
}

function changeNumber(label: string, value: string) {
	const input = within(screen.getByRole("dialog")).getByLabelText(label);
	fireEvent.change(input, { target: { value } });
	fireEvent.blur(input);
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.preview.mockReturnValue({
		data: {
			judgeCount: 20,
			teamCount: 50,
			result: {
				ok: true,
				schedule: {
					presentationMinutes: 5,
					waveCount: 10,
					tables: Array.from({ length: 5 }, () => ({
						judgeIds: ["", "", "", ""]
					})),
					breaks: [{ startsAt: minutes(42) }],
					endsAt: minutes(170)
				}
			}
		},
		error: null,
		isPlaceholderData: false
	});
});

describe("schedule dialog", () => {
	it("previews the computed schedule and generates with the entered settings", async () => {
		render(
			<ScheduleDialog hasSchedule={false} onClose={vi.fn()} round={round} />
		);
		expect(screen.getByText("5 tables · 5-minute presentations")).toBeVisible();
		expect(screen.getByText(/50 teams · 20 judges/)).toBeVisible();
		changeNumber("Judges per table", "3");
		expect(mocks.preview).toHaveBeenLastCalledWith(
			expect.objectContaining({ roundId: round.id, panelSize: 3 }),
			expect.objectContaining({ enabled: true })
		);
		fireEvent.click(screen.getByRole("button", { name: "Generate" }));
		await waitFor(() =>
			expect(mocks.generate).toHaveBeenCalledWith({
				roundId: round.id,
				panelSize: 3,
				changeoverMinutes: 2,
				breakMinutes: 10,
				maxBlockMinutes: 50,
				confirm: false
			})
		);
	});

	it("explains a schedule that doesn't fit and won't generate it", () => {
		mocks.preview.mockReturnValue({
			data: {
				judgeCount: 7,
				teamCount: 50,
				result: {
					ok: false,
					message: "Two tables of 4 need at least 8 judges."
				}
			},
			error: null,
			isPlaceholderData: false
		});
		render(
			<ScheduleDialog hasSchedule={false} onClose={vi.fn()} round={round} />
		);
		expect(
			screen.getByText("Two tables of 4 need at least 8 judges.")
		).toBeVisible();
		expect(screen.getByRole("button", { name: "Generate" })).toBeDisabled();
	});

	it("flags an empty setting on submit instead of generating", async () => {
		render(
			<ScheduleDialog hasSchedule={false} onClose={vi.fn()} round={round} />
		);
		changeNumber("Break length (min)", "");
		fireEvent.click(screen.getByRole("button", { name: "Generate" }));
		expect(await screen.findByText("Enter a number.")).toBeVisible();
		expect(mocks.generate).not.toHaveBeenCalled();
	});

	it("warns before regenerating a published round, then confirms it", async () => {
		render(
			<ScheduleDialog
				hasSchedule
				onClose={vi.fn()}
				round={{ ...round, publishedAt: now }}
			/>
		);
		expect(
			screen.getByText(/teams have already seen their current times/)
		).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
		await waitFor(() =>
			expect(mocks.generate).toHaveBeenCalledWith(
				expect.objectContaining({ confirm: true })
			)
		);
	});
});

describe("panel schedule", () => {
	it("shows tables with their judges and free time as a break", () => {
		renderSchedule();
		expect(screen.getByText("2 tables · 8-minute presentations")).toBeVisible();
		expect(
			screen.getByRole("columnheader", { name: /Table 1\s*Ada, Bo/ })
		).toBeVisible();
		expect(screen.getByText(/Break · 4:18 AM – 4:30 AM/)).toBeVisible();
	});

	it("removes a team only after confirmation", async () => {
		renderSchedule();
		fireEvent.click(
			screen.getAllByRole("button", {
				name: "Remove Team 10 from the schedule"
			})[0] as HTMLElement
		);
		const dialog = await screen.findByRole("alertdialog");
		expect(mocks.removeTeam).not.toHaveBeenCalled();
		fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
		await waitFor(() =>
			expect(mocks.removeTeam).toHaveBeenCalledWith({
				roundId: round.id,
				teamId: "10"
			})
		);
	});

	it("opens the add team and move judge dialogs", async () => {
		renderSchedule();
		fireEvent.click(screen.getByRole("button", { name: "Add team" }));
		expect(
			await screen.findByRole("dialog", { name: "Add a team" })
		).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "Move judge" }));
		expect(
			await screen.findByRole("dialog", { name: "Move a judge" })
		).toBeVisible();
	});

	it("won't regenerate a scored round", () => {
		renderSchedule({ hasScores: true });
		expect(screen.getByRole("button", { name: "Regenerate" })).toBeDisabled();
	});

	it("offers to generate a schedule once teams have passed prescreening", async () => {
		renderSchedule({ layout: undefined });
		expect(screen.getByText("No schedule yet")).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Generate schedule" }));
		expect(
			await screen.findByRole("dialog", { name: "Generate schedule" })
		).toBeVisible();
	});

	it("points to prescreening when no team has passed", () => {
		renderSchedule({ layout: undefined, teams: [] });
		expect(
			screen.getByText("No teams have passed prescreening yet.")
		).toBeVisible();
		expect(
			screen.getByRole("link", { name: "Prescreen teams" })
		).toHaveAttribute("href", "/admin/teams");
	});
});

const ranking: PanelRanking[] = ["A", "B", "C"].map((name, index) => ({
	teamId: name.toLowerCase(),
	teamName: `Team ${name}`,
	normalizedScore: 1 - index,
	rawAverage: 4 - index,
	scorecardCount: 4,
	expectedScorecards: 4
}));

function renderResults(
	props: Partial<Parameters<typeof PanelResults>[0]> = {}
) {
	return render(
		<PanelResults
			finalRoundHasScores={false}
			hackathonDates={null}
			hasFinalRound={false}
			onFinalRoundCreated={vi.fn()}
			ranking={ranking}
			round={round}
			{...props}
		/>
	);
}

describe("panel results", () => {
	it("ranks teams and opens the finalist picker", async () => {
		renderResults();
		const topRow = screen.getByText("Team A").closest("tr") as HTMLElement;
		expect(topRow).toHaveTextContent("1Team A1.004.004/4");
		fireEvent.click(screen.getByRole("button", { name: "Pick finalists" }));
		expect(
			await screen.findByRole("dialog", { name: "Create final round" })
		).toBeVisible();
	});

	it("won't change finalists once the final round is scored", () => {
		renderResults({ hasFinalRound: true, finalRoundHasScores: true });
		expect(
			screen.getByRole("button", { name: "Change finalists" })
		).toBeDisabled();
	});
});

describe("finalists dialog", () => {
	function renderDialog() {
		return render(
			<FinalistsDialog
				hackathonDates={null}
				hasFinalRound={false}
				onClose={vi.fn()}
				onCreated={vi.fn()}
				panelRound={round}
				ranking={ranking}
			/>
		);
	}

	it("pre-selects the top teams", () => {
		renderDialog();
		expect(screen.getByText("Finalists · 3 selected")).toBeVisible();
		fireEvent.click(screen.getByRole("checkbox", { name: /Team C/ }));
		expect(screen.getByText("Finalists · 2 selected")).toBeVisible();
	});

	it("requires a start time, then creates the final round in rank order", async () => {
		renderDialog();
		fireEvent.click(screen.getByRole("checkbox", { name: /Team B/ }));
		fireEvent.click(screen.getByRole("button", { name: "Create final round" }));
		expect(await screen.findByText("Choose a start time.")).toBeVisible();
		expect(mocks.setFinalists).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText("Starts"), {
			target: { value: "16:00" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Create final round" }));
		await waitFor(() =>
			expect(mocks.setFinalists).toHaveBeenCalledWith({
				teamIds: ["a", "c"],
				startTime: new Date("2026-09-19T16:00:00-06:00"),
				presentationMinutes: 10,
				changeoverMinutes: 2
			})
		);
	});
});
