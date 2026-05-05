import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import JudgeNav from "../components/judges/JudgeNav";
import JudgeTopBar from "../components/judges/JudgeTopBar";

export default async function JudgeLayout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	await requireRole([Role.JUDGE, Role.ADMIN]);

	return (
		// Shared judge shell so auth, nav, and the app font stay in one place.
		<div
			className="min-h-screen bg-dashboard-grey text-dark-grey"
			style={{ fontFamily: "var(--font-omnes), sans-serif" }}
		>
			<JudgeTopBar />
			<JudgeNav />
			<main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
				{children}
			</main>
		</div>
	);
}
