import QRCode from "react-qr-code";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	let devpostStatus: Awaited<
		ReturnType<typeof api.teams.getMyDevpostSubmissionStatus>
	> | null = null;

	try {
		devpostStatus = await api.teams.getMyDevpostSubmissionStatus();
	} catch {
		devpostStatus = null;
	}

	return (
		<main className="flex min-h-screen flex-col bg-pale-grey font-sans text-dark-grey">
			<header className="flex items-center justify-between bg-awesomer-purple px-8 py-4 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
				<h1 className="m-0 font-bold text-2xl">Participant Dashboard</h1>
				<div>
					<span>{session.user.name}</span>
					<span className="ml-4 inline-block rounded-full bg-white/20 px-3 py-1 font-semibold text-sm">
						Participant
					</span>
				</div>
			</header>
			<div className="mx-auto w-full max-w-300 p-8">
				{devpostStatus?.showWarning ? (
					<div className="mb-6 rounded-xl border border-[#ffd39b] border-l-[#f97316] border-l-[6px] bg-[#fff6e8] px-5 py-4 text-[#7c2d12]">
						<h2 className="m-0 mb-[0.35rem] font-bold text-lg">
							Devpost Submission Required
						</h2>
						<p>
							Your team must submit a Devpost link before submissions close.
						</p>
						{devpostStatus.submissionCloseAt ? (
							<p className="mt-[0.35rem] font-semibold">
								Submissions close on{" "}
								{devpostStatus.submissionCloseAt.toLocaleString()}.
							</p>
						) : null}
					</div>
				) : null}

				<div className="mb-6 rounded-xl border border-light-grey bg-white p-8 shadow-[0_4px_6px_rgba(0,0,0,0.05)]">
					<h2 className="mb-4 font-semibold text-2xl text-grey-purple">
						Welcome, Hacker!
					</h2>
					<p>Check your schedule, submit your project, and view results.</p>
				</div>
				<QRCode value={`${session.user.id}::${session.user.name}`} />
			</div>
		</main>
	);
}
