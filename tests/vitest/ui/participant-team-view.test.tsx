import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { TeamView } from "@/app/components/participant/team/TeamView";

vi.mock("next/navigation", () => ({
	useRouter: () => ({ refresh: vi.fn() })
}));
vi.mock("@/trpc/react", () => {
	const mutation = () => ({
		mutate: vi.fn(),
		reset: vi.fn(),
		isPending: false,
		error: null
	});
	return {
		api: {
			teams: {
				leave: { useMutation: mutation },
				update: { useMutation: mutation }
			}
		}
	};
});

type Team = NonNullable<ComponentProps<typeof TeamView>["team"]>;

function member(name: string, isYou: boolean): Team["members"][number] {
	return {
		id: `member-${name}`,
		userId: `user-${name}`,
		name,
		email: `${name.toLowerCase()}@example.com`,
		avatarSrc: "/avatars/star.webp",
		role: isYou ? "owner" : "member",
		isYou
	};
}

const team: Team = {
	id: "team-1",
	name: "Team Alpha",
	teamCode: "ABC123",
	maxMembers: 5,
	myRole: "owner",
	members: [member("Victoria", true), member("Sam", false)]
};

describe("participant team view", () => {
	it("invites participants without a team to join or register one", () => {
		render(<TeamView team={null} />);
		expect(
			screen.getByRole("heading", { name: "You aren't part of a team yet!" })
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Join or register a team" })
		).toBeVisible();
	});
	it("lists members and lets the owner rename the team", () => {
		render(<TeamView team={team} />);
		expect(screen.getByRole("heading", { name: "Team Alpha" })).toBeVisible();
		expect(screen.getByText("2/5 Members")).toBeVisible();
		expect(screen.getByText("Sam")).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Edit team name" })
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Invite team member" })
		).toBeVisible();
	});
	it("hides renaming from members who don't own the team", () => {
		render(<TeamView team={{ ...team, myRole: "member" }} />);
		expect(
			screen.queryByRole("button", { name: "Edit team name" })
		).not.toBeInTheDocument();
	});
});
