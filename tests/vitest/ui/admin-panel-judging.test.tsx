import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FinalRoundManagement } from "@/app/components/admin/judging/FinalRoundManagement";
import type {
	Layout,
	PanelRanking,
	Team
} from "@/app/components/admin/judging/judgingShared";
import { PanelScheduleManagement } from "@/app/components/admin/judging/PanelScheduleManagement";
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
		judgingRounds: {
			publish: mutation(vi.fn()),
			unpublish: mutation(vi.fn())
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

function renderSchedule(
	layoutForRound: Layout | null = layout,
	roundToShow = round
) {
	return render(
		<PanelScheduleManagement
			activeRoundId={round.id}
			judges={[]}
			layouts={layoutForRound ? { [round.id]: layoutForRound } : {}}
			rounds={[roundToShow]}
			teams={[{ id: "late", name: "Late", prescreenStatus: "passed" } as Team]}
		/>
	);
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
		}
	});
});

describe("panel schedule", () => {
	it("previews the computed schedule and generates with the entered settings", () => {
		renderSchedule(null);
		expect(
			screen.getByText(
				"5 tables (4, 4, 4, 4, 4 judges) · 5-minute presentations · 10 waves"
			)
		).toBeVisible();
		fireEvent.change(screen.getByLabelText("Judges per table (minimum)"), {
			target: { value: "3" }
		});
		expect(mocks.preview).toHaveBeenLastCalledWith(
			expect.objectContaining({ roundId: round.id, panelSize: 3 }),
			expect.objectContaining({ enabled: true })
		);
		fireEvent.click(screen.getByRole("button", { name: "Generate schedule" }));
		expect(mocks.generate).toHaveBeenCalledWith({
			roundId: round.id,
			panelSize: 3,
			changeoverMinutes: 2,
			breakMinutes: 10,
			maxBlockMinutes: 50,
			confirm: false
		});
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
			}
		});
		renderSchedule(null);
		expect(screen.getByText("Doesn’t fit")).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Generate schedule" })
		).toBeDisabled();
	});

	it("disables generating while a setting isn't a whole number", () => {
		renderSchedule(null);
		fireEvent.change(screen.getByLabelText("Break length (minutes)"), {
			target: { value: "" }
		});
		expect(
			screen.getByText("Enter a whole number for each setting.")
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Generate schedule" })
		).toBeDisabled();
	});

	it("shows tables with their judges, free time as a break, and confirms regenerating a published round", async () => {
		renderSchedule(layout, { ...round, publishedAt: now });
		expect(
			screen.getByRole("columnheader", { name: /Table 1\s*Ada, Bo/ })
		).toBeVisible();
		expect(screen.getByText(/Break · 4:18 AM–4:30 AM/)).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));
		const dialog = await screen.findByRole("alertdialog");
		fireEvent.click(within(dialog).getByRole("button", { name: "Regenerate" }));
		await vi.waitFor(() =>
			expect(mocks.generate).toHaveBeenCalledWith(
				expect.objectContaining({ confirm: true })
			)
		);
	});

	it("removes a team only after confirmation", async () => {
		renderSchedule();
		fireEvent.click(
			screen.getAllByRole("button", {
				name: "Remove Team 10 from the schedule"
			})[0] as HTMLElement
		);
		const dialog = await screen.findByRole("alertdialog");
		fireEvent.click(within(dialog).getByRole("button", { name: "Remove" }));
		await vi.waitFor(() =>
			expect(mocks.removeTeam).toHaveBeenCalledWith({
				roundId: round.id,
				teamId: "10"
			})
		);
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

function renderResults() {
	return render(
		<FinalRoundManagement
			finalResults={null}
			layouts={{}}
			rankings={{ [round.id]: ranking }}
			rounds={[round]}
		/>
	);
}

describe("finalist picker", () => {
	it("pre-selects the top teams and follows the finalist count", () => {
		renderResults();
		expect(screen.getByText("3 finalists selected")).toBeVisible();
		fireEvent.change(screen.getByLabelText("Number of finalists"), {
			target: { value: "2" }
		});
		expect(
			screen.getByRole("checkbox", { name: "Select Team C as a finalist" })
		).not.toBeChecked();
		expect(screen.getByText("2 finalists selected")).toBeVisible();
	});

	it("requires a start time, then creates the final round in rank order", () => {
		renderResults();
		fireEvent.click(
			screen.getByRole("checkbox", { name: "Select Team B as a finalist" })
		);
		fireEvent.click(screen.getByRole("button", { name: "Create final round" }));
		expect(screen.getByText("Choose a valid start time.")).toBeVisible();
		expect(mocks.setFinalists).not.toHaveBeenCalled();
		fireEvent.change(screen.getByLabelText("Final round starts"), {
			target: { value: "2026-11-08T16:00" }
		});
		fireEvent.click(screen.getByRole("button", { name: "Create final round" }));
		expect(mocks.setFinalists).toHaveBeenCalledWith({
			teamIds: ["a", "c"],
			startTime: new Date("2026-11-08T16:00:00-06:00"),
			presentationMinutes: 10,
			changeoverMinutes: 2
		});
	});
});
