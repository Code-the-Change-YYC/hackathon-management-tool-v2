import Image from "next/image";
import Link from "next/link";

export default function TeamLandingPage() {
	return (
		<section className="relative min-h-full overflow-hidden bg-awesomer-purple px-4 pt-8 pb-0 sm:px-6 sm:pt-12">
			{/* Sparkle decorations - purple background */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 select-none"
			>
				<span className="absolute top-28 left-3 text-2xl text-white/30 sm:top-32 sm:left-8 sm:text-4xl">
					✦
				</span>
				<span className="absolute top-36 right-4 text-3xl text-white/20 sm:top-44 sm:right-12">
					✦
				</span>
				<span className="absolute top-1/2 left-4 text-white/20 text-xl sm:left-10">
					✦
				</span>
				<span className="absolute top-2/3 right-5 text-2xl text-white/20 sm:right-14">
					✦
				</span>
			</div>

			{/* Small mint curve accents - lower sides */}
			<div
				aria-hidden="true"
				className="pointer-events-none absolute bottom-48 left-0 w-20 sm:w-28"
			>
				<Image
					alt=""
					className="w-full"
					height={48}
					src="/team/curve-sm-left.png"
					width={112}
				/>
			</div>
			<div
				aria-hidden="true"
				className="pointer-events-none absolute right-0 bottom-56 w-20 sm:w-28"
			>
				<Image
					alt=""
					className="w-full"
					height={56}
					src="/team/curve-sm-right.png"
					width={112}
				/>
			</div>

			{/* Page title with flanking mint curves */}
			<div className="relative mb-6 text-center">
				{/* Left curve - hugs the left side of the title */}
				<div
					aria-hidden="true"
					className="-left-2 -translate-y-1/2 pointer-events-none absolute top-1/2 w-14 sm:w-20"
				>
					<Image
						alt=""
						className="w-full"
						height={30}
						src="/team/curve-sm-left.png"
						width={80}
					/>
				</div>
				{/* Right curve - exits after "2026" */}
				<div
					aria-hidden="true"
					className="-right-2 -translate-y-1/2 pointer-events-none absolute top-1/2 w-14 sm:w-20"
				>
					<Image
						alt=""
						className="w-full"
						height={40}
						src="/team/curve-sm-right.png"
						width={80}
					/>
				</div>

				<h1
					className="relative font-extrabold text-3xl text-white sm:text-4xl md:text-5xl"
					style={{ textShadow: "0 3px 12px rgba(0,0,0,0.45)" }}
				>
					Register for Hack the Change{" "}
					<span className="text-[#D7FAF0]">2026</span>
				</h1>
			</div>

			{/* Main card */}
			<div className="relative mx-auto max-w-2xl rounded-2xl bg-white p-6 shadow-xl sm:p-8">
				{/* Sparkle inside card */}
				<div
					aria-hidden="true"
					className="pointer-events-none absolute top-4 right-4 select-none text-awesomer-purple/20 text-xl sm:top-6 sm:right-6 sm:text-2xl"
				>
					✦✦
				</div>
				<div
					aria-hidden="true"
					className="pointer-events-none absolute bottom-6 left-4 select-none text-awesomer-purple/15 text-lg"
				>
					✦
				</div>

				{/* Section heading - Register */}
				<div className="mb-6">
					<div className="mb-1 flex items-center gap-2">
						<div className="flex shrink-0 flex-col gap-0.5">
							<Image alt="" height={6} src="/team/pill-a.png" width={24} />
							<Image alt="" height={5} src="/team/pill-b.png" width={18} />
						</div>
						<h2 className="font-bold text-dark-grey text-lg sm:text-xl">
							Register your new team OR Join an existing team
						</h2>
					</div>
					{/* Wavy underline - constrained to roughly the first word */}
					<div className="mt-1 mb-4 ml-8">
						<Image
							alt=""
							className="w-16 sm:w-20"
							height={8}
							src="/team/underline-register.png"
							width={80}
						/>
					</div>
				</div>

				{/* Choice cards */}
				<div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
					<Link
						className="group flex flex-col items-center rounded-2xl bg-mint-green p-5 transition hover:opacity-90"
						href="/team/register"
					>
						{/* Button with white shadow ring */}
						<span className="mb-4 inline-block rounded-full bg-awesomer-purple px-5 py-2 font-semibold text-sm text-white shadow-[0_0_0_4px_white]">
							Register New Team
						</span>
						<div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-white p-3">
							<Image
								alt="Register a new team - character holding a flag"
								className="h-full w-auto object-contain"
								height={160}
								src="/team/mascot-register.png"
								width={160}
							/>
						</div>
					</Link>

					<Link
						className="group flex flex-col items-center rounded-2xl bg-mint-green p-5 transition hover:opacity-90"
						href="/team/join"
					>
						{/* Button with white shadow ring */}
						<span className="mb-4 inline-block rounded-full bg-awesomer-purple px-5 py-2 font-semibold text-sm text-white shadow-[0_0_0_4px_white]">
							Join Existing Team
						</span>
						<div className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-white p-3">
							<Image
								alt="Join an existing team - star character celebrating with friends"
								className="h-full w-auto object-contain"
								height={160}
								src="/team/mascot-join.png"
								width={160}
							/>
						</div>
					</Link>
				</div>

				{/* Section heading - Looking for a team */}
				<div>
					<div className="mb-1 flex items-center gap-2">
						<div className="flex shrink-0 flex-col gap-0.5">
							<Image alt="" height={6} src="/team/pill-a.png" width={24} />
							<Image alt="" height={5} src="/team/pill-b.png" width={18} />
						</div>
						<h2 className="font-bold text-dark-grey text-lg sm:text-xl">
							Looking for a team?
						</h2>
					</div>
					{/* Wavy underline - constrained to roughly the first word */}
					<div className="mt-1 mb-4 ml-8">
						<Image
							alt=""
							className="w-16 sm:w-20"
							height={8}
							src="/team/underline-looking.png"
							width={80}
						/>
					</div>

					<ol className="ml-2 space-y-3 rounded-2xl bg-mint-green px-5 py-5 text-dark-grey text-sm sm:text-base">
						<li className="flex gap-2">
							<span className="shrink-0 font-bold">1.</span>
							<span>
								Join the <strong>Code the Change YYC Discord</strong> and
								navigate to the <strong>#looking-for-a-team</strong> channel.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="shrink-0 font-bold">2.</span>
							<span>
								Reach out to <strong>an existing team</strong> or{" "}
								<strong>form a new team</strong>.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="shrink-0 font-bold">3.</span>
							<span>
								After creating a team, assign <strong>ONE</strong> member to{" "}
								&ldquo;Register New Team&rdquo; using your Team Name. They will
								receive a unique <strong>4-character Team ID</strong> following
								registration.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="shrink-0 font-bold">4.</span>
							<span>
								Next, provide this <strong>Team ID</strong> to all team members.
							</span>
						</li>
						<li className="flex gap-2">
							<span className="shrink-0 font-bold">5.</span>
							<span>
								<strong>EACH</strong> team member <strong>must</strong> navigate
								to &ldquo;Join Existing Team&rdquo; to submit this Team ID to
								officially join the group.
							</span>
						</li>
					</ol>
				</div>
			</div>

			{/* Squiggly mint line at the bottom */}
			<div aria-hidden="true" className="pointer-events-none mt-6">
				<Image
					alt=""
					className="w-full"
					height={48}
					src="/team/squiggle-bottom-fix.png"
					width={1440}
				/>
			</div>
		</section>
	);
}
