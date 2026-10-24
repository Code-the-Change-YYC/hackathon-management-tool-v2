import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamsView } from "@/app/components/admin/teams/TeamsView";
import type { Team } from "@/app/components/admin/teams/types";

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
	useRefresh: () => ({ refresh: mocks.refresh })
}));

vi.mock("sonner", () => ({
	toast: {
		success: mocks.toastSuccess,
		error: mocks.toastError
	}
}));

const teams: Team[] = [
	{
		rank: 2,
		id: "team-beta",
		name: "Beta Builders",
		prescreen: "pending",
		feedback: null,
		round1: null,
		round2: null,
		members: "beta@example.com",
		memberCount: 1
	},
	{
		rank: 1,
		id: "team-alpha",
		name: "Alpha Labs",
		prescreen: "passed",
		feedback: "Strong idea",
		round1: true,
		round2: "winner",
		members: "alpha@example.com, teammate@example.com",
		memberCount: 2
	},
	{
		rank: 3,
		id: "team-charlie",
		name: "Charlie Crew",
		prescreen: "failed",
		feedback: "Needs work",
		round1: false,
		round2: "rejected",
		members: "",
		memberCount: 3
	}
];

function openTeamMenu(name: string) {
	fireEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }));
}

beforeEach(() => vi.clearAllMocks());

describe("admin teams UI", () => {
	it("renders teams and the empty state", () => {
		const { rerender } = render(<TeamsView teams={teams} />);

		expect(screen.getByRole("heading", { name: "Teams" })).toBeInTheDocument();
		expect(screen.getByText("Showing 3 of 3 teams")).toBeInTheDocument();
		expect(screen.getByText("Alpha Labs")).toBeInTheDocument();
		expect(
			screen.getByText("alpha@example.com, teammate@example.com")
		).toBeInTheDocument();

		rerender(<TeamsView teams={[]} />);
		expect(screen.getByText("No teams found")).toBeInTheDocument();
		expect(
			screen.getByText(
				"Try adjusting your search or clearing the active filters."
			)
		).toBeInTheDocument();
	});

	it("searches, filters, and sorts the visible teams", async () => {
		render(<TeamsView teams={teams} />);
		const search = screen.getByRole("textbox", { name: "Search for a team" });

		fireEvent.change(search, { target: { value: "charlie" } });
		expect(screen.getByText("Showing 1 of 3 teams")).toBeInTheDocument();
		expect(screen.getByText("Charlie Crew")).toBeInTheDocument();
		expect(screen.queryByText("Alpha Labs")).not.toBeInTheDocument();

		fireEvent.change(search, { target: { value: "" } });
		fireEvent.click(screen.getByRole("button", { name: "Filter teams" }));
		fireEvent.click(
			screen.getByRole("menuitemcheckbox", { name: "Passed pre-screening" })
		);
		expect(screen.getByText("Showing 1 of 3 teams")).toBeInTheDocument();
		expect(screen.getByText("Alpha Labs")).toBeInTheDocument();
		expect(screen.queryByText("Beta Builders")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Sort teams" }));
		fireEvent.click(
			await screen.findByRole("menuitemradio", {
				name: "Sort by: name Descending (Z-A)"
			})
		);
		expect(
			screen.getByLabelText("Remove filter: Passed pre-screening")
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Remove filter: Sort by: name Descending (Z-A)")
		).toBeInTheDocument();
	});

	it("saves a pass/fail prescreen decision with required feedback", async () => {
		render(<TeamsView teams={teams} />);
		openTeamMenu("Beta Builders");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Prescreen team" })
		);

		expect(
			screen.getByRole("dialog", {
				name: "Prescreening for Team: Beta Builders"
			})
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Skip to pass/fail" }));

		const feedback = screen.getByPlaceholderText(
			"Describe why the team passed or failed…"
		);
		const pass = screen.getByRole("button", { name: "Pass team" });
		expect(pass).toBeDisabled();
		fireEvent.change(feedback, { target: { value: "Good prototype" } });
		fireEvent.click(pass);
		fireEvent.click(screen.getByRole("button", { name: "Save and Finish" }));

		await waitFor(() =>
			expect(mocks.setPrescreen).toHaveBeenCalledWith({
				teamId: "team-beta",
				status: "passed",
				comments: "Good prototype"
			})
		);
	});

	it("requires confirmation before deleting a team", async () => {
		render(<TeamsView teams={teams} />);
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

	it("shows the table actions for each team", () => {
		render(<TeamsView teams={teams} />);

		for (const team of teams) {
			openTeamMenu(team.name);
			expect(
				screen.getByRole("menuitem", { name: "Prescreen team" })
			).toBeInTheDocument();
			expect(
				screen.getByRole("menuitem", { name: "Delete team" })
			).toBeInTheDocument();
			fireEvent.keyDown(document.body, { key: "Escape" });
		}
	});
});
