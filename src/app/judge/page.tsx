import dynamic from "next/dynamic";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

// import internal data from JudgingDashboard
const JudgingDashboard = dynamic(
	() => import("../components/judges/JudgingDashboard")
);

export default async function JudgePage() {
	const session = await requireRole([Role.JUDGE, Role.ADMIN]);

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Judging Portal</h1>
				<div>
					<span>{session.user.name}</span>
					<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
						Judge
					</span>
				</div>
			</header>
			<div className="mx-auto w-full max-w-300 p-8">
				<div className="mb-6 rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
					<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
						Ready to Judge?
					</h2>
					<p>View your assigned teams and submit scores.</p>
				</div>
				<JudgingDashboard />
			</div>
		</main>
	);
}
