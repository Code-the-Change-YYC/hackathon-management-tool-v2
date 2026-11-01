import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamsView } from "@/app/components/admin/teams/TeamsView";
import type { Team, TeamRound } from "@/app/components/admin/teams/types";

const mocks = vi.hoisted(() => ({
	deleteTeam: vi.fn(),
	setPrescreen: vi.fn(),
	refresh: vi.fn(),
	toastSuccess: vi.fn(),
	toastError: vi.fn()
}));

vi.mock("@/trpc/react", () => ({
	api: {
		teams: {
			delete: {
				useMutation: () => ({ mutate: mocks.deleteTeam, isPending: false })
			},
			setPrescreen: {
				useMutation: () => ({ mutate: mocks.setPrescreen, isPending: false })
			}
		}
	}
}));

vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({
		isRefreshing: false,
		refresh: (then?: () => void) => {
			mocks.refresh();
			then?.();
		}
	})
}));

vi.mock("sonner", () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError
	}
}));

const rounds: TeamRound[] = [
	{ id: "round-1", name: "Round 1" },
	{ id: "round-2", name: "Round 2" }
];

const teams: Team[] = [
	{
		id: "team-beta",
		name: "Beta Builders",
		teamCode: "BETA01",
		prescreen: "pending",
		feedback: null,
		members: [{ name: "Bea Smith", email: "beta@example.com" }],
		rounds: { "round-1": false, "round-2": null }
	},
	{
		id: "team-alpha",
		name: "Alpha Labs",
		teamCode: "ALPHA1",
		prescreen: "passed",
		feedback: null,
		members: [
			{ name: "Ada Lovelace", email: "alpha@example.com" },
			{ name: "Alan Turing", email: "teammate@example.com" }
		],
		rounds: { "round-1": true, "round-2": null }
	},
	{
		id: "team-charlie",
		name: "Charlie Crew",
		teamCode: null,
		prescreen: "failed",
		feedback: "Needs work",
		members: [
			{ name: "Cy", email: "cy@example.com" },
			{ name: "Cam", email: "cam@example.com" },
			{ name: "Cal", email: "cal@example.com" }
		],
		rounds: { "round-1": false, "round-2": null }
	},
	{
		id: "team-delta",
		name: "Delta Devs",
		teamCode: "DELTA1",
		prescreen: "pending",
		feedback: null,
		members: [],
		rounds: { "round-1": false, "round-2": null }
	}
];

function openTeamMenu(name: string) {
	fireEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }));
}

function statValue(label: string) {
	return screen.getByText(label).closest("div")?.querySelector("dd")
		?.textContent;
}

function openPrescreening() {
	fireEvent.click(screen.getByRole("button", { name: "Start pre-screening" }));
	return screen.getByRole("dialog", { name: "Pre-screen teams" });
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.setPrescreen.mockImplementation(
		(_input: unknown, options?: { onSuccess?: () => void }) =>
			options?.onSuccess?.()
	);
});

describe("admin teams UI", () => {
	it("renders teams with a column per round and the empty state", () => {
		const { rerender } = render(<TeamsView rounds={rounds} teams={teams} />);

		expect(screen.getByRole("heading", { name: "Teams" })).toBeInTheDocument();
		expect(screen.getByText("Showing 4 of 4 teams")).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Round 1" })
		).toBeInTheDocument();
		expect(
			screen.getByRole("columnheader", { name: "Round 2" })
		).toBeInTheDocument();
		expect(
			screen.queryByRole("columnheader", { name: "Rank" })
		).not.toBeInTheDocument();
		expect(screen.getByText("ALPHA1")).toBeInTheDocument();
		expect(screen.getByText("Ada Lovelace, Alan Turing")).toBeInTheDocument();
		expect(screen.queryByText(/alpha@example\.com/)).not.toBeInTheDocument();
		// Alpha passed pre-screening and round 1.
		expect(screen.getAllByRole("img", { name: "Yes" })).toHaveLength(2);
		expect(screen.getAllByRole("img", { name: "No" })).toHaveLength(4);

		rerender(<TeamsView rounds={rounds} teams={[]} />);
		expect(screen.getByText("No teams found")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Try adjusting your search or clearing the active filters."
			)
		).toBeInTheDocument();
	});

	it("searches, filters, and sorts the visible teams", async () => {
		render(<TeamsView rounds={rounds} teams={teams} />);
		const search = screen.getByRole("textbox", { name: "Search for a team" });

		fireEvent.change(search, { target: { value: "turing" } });
		expect(screen.getByText("Showing 1 of 4 teams")).toBeInTheDocument();
		expect(screen.getByText("Alpha Labs")).toBeInTheDocument();

		fireEvent.change(search, { target: { value: "delta1" } });
		expect(screen.getByText("Showing 1 of 4 teams")).toBeInTheDocument();
		expect(screen.getByText("Delta Devs")).toBeInTheDocument();

		fireEvent.change(search, { target: { value: "" } });
		fireEvent.click(screen.getByRole("button", { name: "Filter teams" }));
		fireEvent.click(
			screen.getByRole("menuitemcheckbox", { name: "Passed Round 1" })
		);
		expect(screen.getByText("Showing 1 of 4 teams")).toBeInTheDocument();
		expect(screen.getByText("Alpha Labs")).toBeInTheDocument();
		expect(screen.queryByText("Beta Builders")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Sort teams" }));
		fireEvent.click(
			await screen.findByRole("menuitemradio", {
				name: "Sort by: name Descending (Z-A)"
			})
		);
		expect(
			screen.getByLabelText("Remove filter: Passed Round 1")
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Remove filter: Sort by: name Descending (Z-A)")
		).toBeInTheDocument();
	});

	it("shows the pre-screening breakdown", () => {
		render(<TeamsView rounds={rounds} teams={teams} />);

		expect(screen.getByText("2 of 4 teams pre-screened")).toBeInTheDocument();
		expect(statValue("Not pre-screened")).toBe("2");
		expect(statValue("Failed")).toBe("1");
		expect(statValue("Passed")).toBe("1");
	});

	it("passes a team in one click and moves to the next unscreened team", () => {
		render(<TeamsView rounds={rounds} teams={teams} />);
		const dialog = openPrescreening();

		expect(within(dialog).getByText("Team 2 of 4")).toBeInTheDocument();
		expect(
			within(dialog).getByRole("heading", { name: "Beta Builders" })
		).toBeInTheDocument();
		fireEvent.click(within(dialog).getByRole("button", { name: "Pass" }));

		expect(mocks.setPrescreen).toHaveBeenCalledWith(
			{ teamId: "team-beta", status: "passed" },
			expect.anything()
		);
		expect(
			within(dialog).getByRole("heading", { name: "Delta Devs" })
		).toBeInTheDocument();
	});

	it("requires feedback to fail a team", async () => {
		render(<TeamsView rounds={rounds} teams={teams} />);
		const dialog = openPrescreening();

		fireEvent.click(within(dialog).getByRole("button", { name: "Fail" }));
		fireEvent.click(within(dialog).getByRole("button", { name: "Fail team" }));
		expect(
			await within(dialog).findByText("Tell the team why they didn’t pass")
		).toBeInTheDocument();
		expect(mocks.setPrescreen).not.toHaveBeenCalled();

		fireEvent.change(within(dialog).getByLabelText("Feedback"), {
			target: { value: "  No working demo  " }
		});
		fireEvent.click(within(dialog).getByRole("button", { name: "Fail team" }));

		await waitFor(() =>
			expect(mocks.setPrescreen).toHaveBeenCalledWith(
				{
					teamId: "team-beta",
					status: "failed",
					comments: "No working demo"
				},
				expect.anything()
			)
		);
		expect(
			within(dialog).getByRole("heading", { name: "Delta Devs" })
		).toBeInTheDocument();
	});

	it("lets admins step back to change an earlier decision", () => {
		render(<TeamsView rounds={rounds} teams={teams} />);
		const dialog = openPrescreening();

		fireEvent.click(
			within(dialog).getByRole("button", { name: "Previous team" })
		);
		expect(
			within(dialog).getByRole("heading", { name: "Alpha Labs" })
		).toBeInTheDocument();
		expect(
			within(dialog).getByText("Passed pre-screening")
		).toBeInTheDocument();
		expect(
			within(dialog).getByRole("button", { name: "Previous team" })
		).toBeDisabled();

		fireEvent.click(within(dialog).getByRole("button", { name: "Fail" }));
		expect(within(dialog).getByLabelText("Feedback")).toHaveValue("");
	});

	it("finishes once every team is pre-screened", () => {
		render(
			<TeamsView
				rounds={rounds}
				teams={teams.filter((team) => team.id !== "team-delta")}
			/>
		);
		const dialog = openPrescreening();

		fireEvent.click(within(dialog).getByRole("button", { name: "Pass" }));
		expect(
			screen.getByRole("dialog", { name: "Pre-screening complete" })
		).toBeInTheDocument();
	});

	it("requires confirmation before deleting a team", async () => {
		render(<TeamsView rounds={rounds} teams={teams} />);
		openTeamMenu("Beta Builders");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Delete team" })
		);

		expect(
			screen.getByText(
				"Team Beta Builders will be removed. This cannot be undone."
			)
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(mocks.deleteTeam).not.toHaveBeenCalled();

		openTeamMenu("Beta Builders");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Delete team" })
		);
		fireEvent.click(screen.getByRole("button", { name: "Delete team" }));

		await waitFor(() =>
			expect(mocks.deleteTeam).toHaveBeenCalledWith({ id: "team-beta" })
		);
	});

	it("only offers deletion in each team's actions", () => {
		render(<TeamsView rounds={rounds} teams={teams} />);

		for (const team of teams) {
			openTeamMenu(team.name);
			expect(
				screen.getAllByRole("menuitem").map((item) => item.textContent)
			).toEqual(["Delete team"]);
			fireEvent.keyDown(document.body, { key: "Escape" });
		}
	});
});
