import QRCode from "react-qr-code";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const emailAddress = session.user.email;
	const initials = displayName
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((namePart) => namePart[0]?.toUpperCase() ?? "")
		.join("");

	let devpostStatus: Awaited<
		ReturnType<typeof api.teams.getMyDevpostSubmissionStatus>
	> | null = null;

	try {
		devpostStatus = await api.teams.getMyDevpostSubmissionStatus();
	} catch {
		devpostStatus = null;
	}

	return (
		<main className="min-h-screen bg-fuzzy-peach text-grapefruit">
			<section className="relative overflow-hidden bg-grapefruit px-6 pt-12 pb-10 text-white sm:px-10 lg:px-16">
				<div className="mx-auto flex max-w-5xl flex-col gap-6 sm:flex-row sm:items-center">
					<div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-pale-grey bg-pale-grey font-black text-3xl text-medium-pink shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:h-28 sm:w-28">
						{initials || "P"}
					</div>
					<div className="space-y-2">
						<h1 className="font-black text-3xl italic leading-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.08)] sm:text-4xl">
							Hello, {displayName}!
						</h1>
					</div>
				</div>
			</section>

			<section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8 sm:px-10 lg:px-16 lg:py-10">
				{devpostStatus?.showWarning ? (
					<div className="rounded-[28px] border border-medium-pink bg-pale-grey px-6 py-5 text-dark-grey shadow-[0_14px_40px_rgba(255,107,84,0.14)]">
						<h2 className="font-extrabold text-grapefruit text-lg uppercase tracking-[0.08em]">
							Devpost Submission Required
						</h2>
						<p className="mt-2 font-medium text-sm sm:text-base">
							Your team must submit a Devpost link before submissions close.
						</p>
						{devpostStatus.submissionCloseAt ? (
							<p className="mt-2 font-bold text-dark-grey text-sm sm:text-base">
								Submissions close on{" "}
								{devpostStatus.submissionCloseAt.toLocaleString()}.
							</p>
						) : null}
					</div>
				) : null}

				<div className="space-y-3 pl-10">
					<h2 className="font-medium text-2xl uppercase">My Food Ticket</h2>
				</div>

				<div className="rounded-[28px] border-2 border-pale-grey bg-pale-grey p-5 shadow-[0_22px_50px_rgba(255,107,84,0.18)] sm:p-8">
					<div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
						<div className="flex justify-center lg:justify-start">
							<div className="rounded-3xl border border-fuzzy-peach bg-pale-grey p-4 shadow-[0_12px_30px_rgba(255,107,84,0.12)] sm:p-5">
								<QRCode
									className="h-44 w-44 [&>path:first-of-type]:fill-pale-grey [&>path:last-of-type]:fill-dark-pink"
									value={`${session.user.id}::${displayName}::${emailAddress}`}
								/>
							</div>
						</div>
						<div className="space-y-4 text-center lg:text-left">
							<div>
								<p className="font-black text-grapefruit text-sm uppercase tracking-[0.08em]">
									Name
								</p>
								<p className="wrap-break-word mt-1 font-semibold text-dark-grey text-lg">
									{displayName}
								</p>
							</div>
							<div>
								<p className="font-black text-grapefruit text-sm uppercase tracking-[0.08em]">
									Email Address
								</p>
								<p className="mt-1 break-all font-semibold text-dark-grey text-lg">
									{emailAddress}
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</main>
	);
}
