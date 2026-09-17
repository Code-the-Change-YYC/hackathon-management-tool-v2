import Link from "next/link";
import TeamTable from "@/app/components/admin/teamtable/TeamTable";
import UserTable from "@/app/components/admin/usertable";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import CriteriaTable from "../components/admin/criteriaTable/CriteriaTable";
import HackathonSettingsPanel from "../components/admin/hackathonSettings/HackathonSettingsPanel";
import ScoreTable from "../components/admin/scoreTable/ScoreTable";

export default async function AdminPage() {
	const session = await requireRole([Role.ADMIN]);

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Hackathon Admin</h1>
				<div>
					<span>{session.user.name}</span>
					<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
						Admin
					</span>
				</div>
			</header>
			<div className="mx-auto w-full max-w-300 p-8">
				<div className="mb-6 rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
					<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
						Welcome back, Admin!
					</h2>
					<p>Manage your hackathon settings, users, and rounds here.</p>
					<p>
						Judging rounds, rooms, and scheduling live in the{" "}
						<Link href="/admin/judge">judging workspace</Link>.
					</p>
				</div>
			</div>
			<div>
				<div id="settings">
					<h2 className="mt-8 font-semibold text-grey-purple text-xl">
						Hackathon Settings
					</h2>
					<HackathonSettingsPanel />
				</div>
				<div id="users">
					<h2 className="mt-8 font-semibold text-grey-purple text-xl">Users</h2>
					<UserTable />
				</div>
				<div id="teams">
					<h2 className="mt-8 font-semibold text-grey-purple text-xl">Teams</h2>
					<TeamTable />
				</div>
				<div>
					<h2 className="mt-8 font-semibold text-grey-purple text-xl">
						Criteria
					</h2>
					<CriteriaTable />
				</div>
				<div>
					<h2 className="mt-8 font-semibold text-grey-purple text-xl">
						Scores
					</h2>
					<ScoreTable />
				</div>
			</div>
		</main>
	);
}
