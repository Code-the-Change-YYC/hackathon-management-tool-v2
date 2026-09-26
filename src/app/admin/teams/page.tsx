import type { Metadata } from "next";
import { TeamsView } from "@/app/components/admin/teams/TeamsView";
import type { Team } from "@/app/components/admin/teams/types";

export const metadata: Metadata = {
	title: "Teams"
};

// TODO: guard with `requireRole([Role.ADMIN])` and load teams from the
// teams router once the backend for this screen exists.
export const MOCK_TEAMS: Team[] = [
	{
		rank: 1,
		id: "1XJD",
		name: "Super Sparklers",
		prescreen: true,
		round1: true,
		round2: "winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 2,
		id: "18VK",
		name: "Code the Changers",
		prescreen: true,
		round1: true,
		round2: "winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 3,
		id: "AHJ8",
		name: "Kevin fanclub",
		prescreen: true,
		round1: true,
		round2: "winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 4,
		id: "0HN2",
		name: "Team super awesome",
		prescreen: true,
		round1: true,
		round2: "sp-winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 5,
		id: "92NS",
		name: "the dog club",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 6,
		id: "0NAK",
		name: "fantasy land",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 7,
		id: "CN12",
		name: "the Code Crusaders",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 8,
		id: "V81N",
		name: "Vibe coders",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 9,
		id: "L1N2",
		name: "the fluffy dogs",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 10,
		id: "N9S0",
		name: "cat tower",
		prescreen: true,
		round1: false,
		round2: null,
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 11,
		id: "U29L",
		name: "party in the backrooms",
		prescreen: true,
		round1: true,
		round2: "sp-winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 12,
		id: "110C",
		name: "Polar bear fanclub",
		prescreen: true,
		round1: true,
		round2: "rejected",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 13,
		id: "10VH",
		name: "Macaroni pencil",
		prescreen: false,
		round1: null,
		round2: null,
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com, grace@email.com",
		memberCount: 2
	},
	{
		rank: 14,
		id: "8FG7",
		name: "Always midnight",
		prescreen: true,
		round1: true,
		round2: "sp-winner",
		feedback: "Prescreen: Concept is very interesting",
		members: "victoria@email.com",
		memberCount: 1
	},
	{
		rank: 15,
		id: "Q90B",
		name: "Happy happy happy",
		prescreen: null,
		round1: null,
		round2: null,
		feedback: null,
		members: "victoria@email.com, grace@email.com, paul@email.com",
		memberCount: 3
	}
];

export default function AdminTeamsPage() {
	return <TeamsView teams={MOCK_TEAMS} />;
}
