import type { Metadata } from "next";
import { RegisteredUsersView } from "@/app/components/admin/participants/RegisteredUsersView";
import type { Participant } from "@/app/components/admin/participants/types";
import { SidebarInset, SidebarProvider } from "@/app/components/ui/sidebar";
import { Role } from "@/types/types";
import { AppSidebar, type NavGroup } from "@/app/components/layout/AppSidebar";
import { AppSidebarTriggerHeader } from "@/app/components/layout/AppSidebar";

export const metadata: Metadata = {
	title: "Registered Users"
};

// TODO: guard with `requireRole([Role.ADMIN])` and load participants from the
// users router once the backend for this screen exists.
const MOCK_PARTICIPANTS: Participant[] = [
	{
		id: "1",
		firstName: "Liam",
		lastName: "Smith",
		email: "liam.smith@example.com",
		role: Role.PARTICIPANT,
		teamId: "4133",
		teamName: "Team Alpha",
		institution: "Mount Royal University",
		major: "Computer Science",
		registeredForFood: true
	},
	{
		id: "2",
		firstName: "Emma",
		lastName: "Johnson",
		email: "emma.johnson@example.com",
		role: Role.PARTICIPANT,
		teamId: "9416",
		teamName: "Team Delta",
		institution: "University of Calgary",
		major: "Software Engineering",
		registeredForFood: true
	},
	{
		id: "3",
		firstName: "Noah",
		lastName: "Williams",
		email: "noah.williams@example.com",
		role: Role.ADMIN,
		teamId: null,
		teamName: null,
		institution: "SAIT",
		major: "Computer Science",
		registeredForFood: false
	},
	{
		id: "4",
		firstName: "Olivia",
		lastName: "Brown",
		email: "olivia.brown@example.com",
		role: Role.JUDGE,
		teamId: null,
		teamName: null,
		institution: "University of Calgary",
		major: null,
		registeredForFood: true
	},
	{
		id: "5",
		firstName: "Ava",
		lastName: "Jones",
		email: "ava.jones@example.com",
		role: Role.PARTICIPANT,
		teamId: "E345",
		teamName: "Team Epsilon",
		institution: "SAIT",
		major: "Software Engineering",
		registeredForFood: false
	},
	{
		id: "6",
		firstName: "Sophia",
		lastName: "Garcia",
		email: "sophia.garcia@example.com",
		role: Role.PARTICIPANT,
		teamId: "F579",
		teamName: "Team Zeta",
		institution: "Mount Royal University",
		major: "Computer Science",
		registeredForFood: true
	},
	{
		id: "7",
		firstName: "Mason",
		lastName: "Martinez",
		email: "mason.martinez@example.com",
		role: Role.ADMIN,
		teamId: null,
		teamName: null,
		institution: "Other",
		major: null,
		registeredForFood: false
	},
	{
		id: "8",
		firstName: "Isabella",
		lastName: "Hernandez",
		email: "isabella.hernandez@example.com",
		role: Role.JUDGE,
		teamId: null,
		teamName: null,
		institution: "University of Calgary",
		major: null,
		registeredForFood: true
	},
	{
		id: "9",
		firstName: "Lucas",
		lastName: "Lopez",
		email: "lucas.lopez@example.com",
		role: Role.PARTICIPANT,
		teamId: "7167",
		teamName: null,
		institution: "SAIT",
		major: "Other",
		registeredForFood: false
	},
	{
		id: "10",
		firstName: "Mia",
		lastName: "Gonzalez",
		email: "mia.gonzalez@example.com",
		role: Role.PARTICIPANT,
		teamId: "2692",
		teamName: "Team Iota",
		institution: "Mount Royal University",
		major: "Software Engineering",
		registeredForFood: true
	},
	{
		id: "11",
		firstName: "Ethan",
		lastName: "Wilson",
		email: "ethan.wilson@example.com",
		role: Role.ADMIN,
		teamId: null,
		teamName: null,
		institution: "Other",
		major: null,
		registeredForFood: true
	},
	{
		id: "12",
		firstName: "James",
		lastName: "Anderson",
		email: "james.anderson@example.com",
		role: Role.JUDGE,
		teamId: null,
		teamName: null,
		institution: "University of Calgary",
		major: null,
		registeredForFood: false
	},
	{
		id: "13",
		firstName: "Charlotte",
		lastName: "Thomas",
		email: "charlotte.thomas@example.com",
		role: Role.PARTICIPANT,
		teamId: "M769",
		teamName: "Team Mu",
		institution: "SAIT",
		major: "Computer Science",
		registeredForFood: true
	},
	{
		id: "14",
		firstName: "Amelia",
		lastName: "Taylor",
		email: "amelia.taylor@example.com",
		role: Role.PARTICIPANT,
		teamId: "N012",
		teamName: "Team Nu",
		institution: "Mount Royal University",
		major: "Other",
		registeredForFood: false
	},
	{
		id: "15",
		firstName: "Benjamin",
		lastName: "Moore",
		email: "benjamin.moore@example.com",
		role: Role.ADMIN,
		teamId: null,
		teamName: null,
		institution: "Other",
		major: null,
		registeredForFood: true
	}
];

const ADMIN_NAV_GROUPS: NavGroup[] = [
	{
		groupLabel: "Event Management",
		items: [
			{ title: "Schedule", href: "/admin/schedule", icon: "calendar" },
			{
				title: "Registered Users",
				href: "/admin/participants",
				icon: "user"
			},
			{ title: "Teams", href: "/admin/teams", icon: "group" },
			{ title: "Meals", href: "/admin/meals", icon: "hamburger" },
			{
				title: "Judging Information",
				href: "/admin/judging",
				icon: "task"
			}
		]
	},
	{
		groupLabel: "App Management",
		items: [{ title: "Admin Controls", href: "/admin", icon: "settings" }]
	}
];

export default function AdminParticipantsPage() {
	return (
		<SidebarProvider>
			<AppSidebar navGroups={ADMIN_NAV_GROUPS} userName="Admin User" />
			<SidebarInset>
				<AppSidebarTriggerHeader />
				<RegisteredUsersView participants={MOCK_PARTICIPANTS} />
			</SidebarInset>
		</SidebarProvider>
	);
}
