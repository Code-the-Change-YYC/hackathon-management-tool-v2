import {
	fireEvent,
	render,
	screen,
	waitFor,
	within
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegisteredUsersView } from "@/app/components/admin/users/RegisteredUsersView";
import type { Participant } from "@/app/components/admin/users/types";
import { Role } from "@/types/types";

const mocks = vi.hoisted(() => ({
	mutate: vi.fn(),
	refresh: vi.fn(),
	removeUser: vi.fn()
}));

vi.mock("@/hooks/use-refresh", () => ({
	useRefresh: () => ({ isRefreshing: false, refresh: mocks.refresh })
}));

vi.mock("@/server/better-auth/client", () => ({
	authClient: { admin: { removeUser: mocks.removeUser } }
}));

vi.mock("@/trpc/react", () => ({
	api: {
		invitations: {
			invite: {
				useMutation: () => ({ mutate: vi.fn(), isPending: false })
			}
		},
		users: {
			update: {
				useMutation: () => ({ mutate: mocks.mutate, isPending: false })
			}
		}
	}
}));

const participants: Participant[] = [
	{
		id: "ada-id",
		firstName: "Ada",
		lastName: "Lovelace",
		email: "ada@example.com",
		role: Role.ADMIN,
		teamName: "Analytical Engines",
		institution: "University of Calgary",
		major: "computer_science",
		registeredForFood: true
	},
	{
		id: "grace-id",
		firstName: "Grace",
		lastName: "Hopper",
		email: "grace@example.com",
		role: Role.JUDGE,
		teamName: null,
		institution: "SAIT",
		major: "software_engineering",
		registeredForFood: false
	},
	{
		id: "linus-id",
		firstName: "Linus",
		lastName: "Torvalds",
		email: "linus@example.com",
		role: Role.PARTICIPANT,
		teamName: null,
		institution: null,
		major: null,
		registeredForFood: null
	}
];

function renderUsers() {
	return render(<RegisteredUsersView participants={participants} />);
}

function openActions(name: string) {
	fireEvent.click(screen.getByRole("button", { name: `Actions for ${name}` }));
}

beforeEach(() => {
	vi.clearAllMocks();
	mocks.removeUser.mockResolvedValue({ data: { success: true } });
});

describe("admin users", () => {
	it("renders the user table and searches across user fields", () => {
		renderUsers();

		expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
		expect(screen.getByText("Showing 3 of 3 users")).toBeInTheDocument();
		expect(screen.getByText("Analytical Engines")).toBeInTheDocument();
		expect(screen.getAllByText("n/a").length).toBeGreaterThan(0);

		fireEvent.change(
			screen.getByRole("textbox", { name: "Search for a user" }),
			{
				target: { value: "grace@example.com" }
			}
		);

		expect(screen.getByText("Showing 1 of 3 users")).toBeInTheDocument();
		expect(screen.getByText("Grace")).toBeInTheDocument();
		expect(screen.queryByText("Ada")).not.toBeInTheDocument();
	});

	it("filters by role and sorts by name", async () => {
		renderUsers();

		fireEvent.click(screen.getByRole("button", { name: "Filter users" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "Role" }));
		fireEvent.click(
			await screen.findByRole("menuitemcheckbox", { name: "Judge" })
		);

		expect(screen.getByText("Showing 1 of 3 users")).toBeInTheDocument();
		expect(screen.getByText("Grace")).toBeInTheDocument();
		expect(screen.queryByText("Ada")).not.toBeInTheDocument();

		fireEvent.click(screen.getByRole("button", { name: "Sort users" }));
		fireEvent.click(
			await screen.findByRole("menuitemradio", {
				name: "Sort by: name Ascending (A-Z)"
			})
		);

		expect(
			screen.getByLabelText("Remove filter: Role: Judge")
		).toBeInTheDocument();
		expect(
			screen.getByLabelText("Remove filter: Sort by: name Ascending (A-Z)")
		).toBeInTheDocument();
	});

	it("edits a user with trimmed names and the selected role", async () => {
		renderUsers();
		openActions("Ada Lovelace");
		fireEvent.click(await screen.findByRole("menuitem", { name: "Edit user" }));

		const dialog = await screen.findByRole("dialog", {
			name: "Edit user information"
		});
		fireEvent.change(within(dialog).getByLabelText("First Name"), {
			target: { value: "  Ada Grace  " }
		});
		fireEvent.change(within(dialog).getByLabelText("Last Name"), {
			target: { value: "  Lovelace  " }
		});
		fireEvent.change(within(dialog).getByLabelText("Email Address"), {
			target: { value: "ada.grace@example.com" }
		});
		fireEvent.click(
			within(dialog).getByRole("combobox", { name: "User Role" })
		);
		const judgeOption = await screen.findByRole("option", { name: "Judge" });
		fireEvent.pointerDown(judgeOption);
		fireEvent.pointerUp(judgeOption);
		fireEvent.click(judgeOption);
		fireEvent.click(
			within(dialog).getByRole("button", { name: "Save changes" })
		);

		await waitFor(() =>
			expect(mocks.mutate).toHaveBeenCalledWith({
				email: "ada.grace@example.com",
				firstName: "Ada Grace",
				id: "ada-id",
				lastName: "Lovelace",
				role: Role.JUDGE
			})
		);
	});

	it("requires confirmation before deleting a user", async () => {
		renderUsers();
		openActions("Grace Hopper");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Delete user" })
		);

		expect(
			await screen.findByRole("alertdialog", { name: "Delete this user?" })
		).toBeInTheDocument();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(mocks.removeUser).not.toHaveBeenCalled();

		openActions("Grace Hopper");
		fireEvent.click(
			await screen.findByRole("menuitem", { name: "Delete user" })
		);
		fireEvent.click(await screen.findByRole("button", { name: "Delete user" }));

		await waitFor(() =>
			expect(mocks.removeUser).toHaveBeenCalledWith({ userId: "grace-id" })
		);
		expect(mocks.refresh).toHaveBeenCalledOnce();
	});
});
