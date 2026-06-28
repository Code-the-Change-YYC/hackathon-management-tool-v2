import QRCode from "react-qr-code";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { api } from "@/trpc/server";
import { Role } from "@/types/types";

type Meal = Awaited<ReturnType<typeof api.meals.getAllMeals>>[number];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	weekday: "long",
	month: "long",
	day: "numeric"
});

const timeFormatter = new Intl.DateTimeFormat("en-US", {
	hour: "numeric",
	minute: "2-digit"
});

function formatDateKey(date: Date) {
	return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatTimeRange(startTime: Date, endTime: Date) {
	return `${timeFormatter.format(startTime)} - ${timeFormatter.format(endTime)}`;
}

function getMealStatus(meal: Meal, now: Date) {
	const startTime = meal.startTime.getTime();
	const endTime = meal.endTime.getTime();
	const currentTime = now.getTime();

	if (currentTime >= startTime && currentTime <= endTime) {
		return "Ongoing";
	}

	if (currentTime > endTime) {
		return "Ended";
	}

	const minutesUntilStart = Math.max(
		1,
		Math.round((startTime - currentTime) / 60000)
	);

	if (minutesUntilStart <= 60) {
		return `In ${minutesUntilStart} min`;
	}

	return "Scheduled";
}

function groupMealsByDate(meals: Meal[]) {
	return meals.reduce<
		Array<{
			key: string;
			label: string;
			meals: Meal[];
		}>
	>((groups, meal) => {
		const key = formatDateKey(meal.startTime);
		const existingGroup = groups.find((group) => group.key === key);

		if (existingGroup) {
			existingGroup.meals.push(meal);
			return groups;
		}

		groups.push({
			key,
			label: dateFormatter.format(meal.startTime),
			meals: [meal]
		});

		return groups;
	}, []);
}

function getTicketMeal(meals: Meal[], now: Date) {
	return (
		meals.find(
			(meal) => meal.startTime.getTime() <= now.getTime() && meal.endTime >= now
		) ??
		meals.find((meal) => meal.startTime > now) ??
		meals[0] ??
		null
	);
}

export default async function ParticipantPage() {
	const session = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const displayName = session.user.name?.trim() || "Participant";
	const emailAddress = session.user.email;
	const now = new Date();

	const [devpostStatus, meals] = await Promise.all([
		api.teams
			.getMyDevpostSubmissionStatus()
			.catch(
				() =>
					null as Awaited<
						ReturnType<typeof api.teams.getMyDevpostSubmissionStatus>
					> | null
			),
		api.meals.getAllMeals()
	]);

	const groupedMeals = groupMealsByDate(meals);
	const ticketMeal = getTicketMeal(meals, now);
	const ticketMealName = ticketMeal?.title ?? "Meal";
	const ticketCopy = ticketMeal
		? `${ticketMealName} is ${getMealStatus(ticketMeal, now).toLowerCase()} until ${timeFormatter.format(ticketMeal.endTime)}.`
		: "Show this QR code to a Code the Change member to receive your meal.";
	const dietaryRestrictions =
		session.user.allergies
			?.split(",")
			.map((restriction) => restriction.trim())
			.filter(Boolean) ?? [];

	return (
		<main className="min-h-screen bg-pale-grey px-4 py-6 text-dark-grey sm:px-8 lg:px-12">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
				<header className="space-y-1">
					<h1 className="font-extrabold text-3xl text-dark-grey">
						Meal Information
					</h1>
					<p className="text-dark-grey/70 text-sm">
						Your meal tickets, dietary restrictions, and upcoming meal times
					</p>
				</header>

				{devpostStatus?.showWarning ? (
					<section className="rounded-lg border border-medium-pink bg-white px-5 py-4 text-dark-grey shadow-[0_10px_30px_rgba(255,107,84,0.08)]">
						<h2 className="font-bold text-grapefruit text-sm uppercase">
							Devpost Submission Required
						</h2>
						<p className="mt-1 text-sm">
							Your team must submit a Devpost link before submissions close.
						</p>
						{devpostStatus.submissionCloseAt ? (
							<p className="mt-1 font-semibold text-sm">
								Submissions close on{" "}
								{devpostStatus.submissionCloseAt.toLocaleString()}.
							</p>
						) : null}
					</section>
				) : null}

				<section className="space-y-4">
					<h2 className="font-semibold text-dark-grey text-lg">
						Your Meal Ticket
					</h2>

					<div className="grid overflow-hidden rounded-lg bg-pastel-pink shadow-[0_14px_34px_rgba(255,133,156,0.18)] lg:grid-cols-[1fr_1.05fr_280px]">
						<div className="relative flex min-h-56 flex-col justify-center gap-2 border-white/80 border-b border-dashed px-6 py-8 sm:px-10 lg:border-r lg:border-b-0">
							<div className="-left-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
							<div className="-right-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
							<p className="font-extrabold text-dark-pink text-xs uppercase">
								{ticketMealName} Ticket For
							</p>
							<p className="break-words font-bold text-dark-grey text-xl">
								{displayName}
							</p>
							<p className="max-w-sm text-dark-grey/70 text-sm leading-6">
								Present this QR code to a member of Code the Change scanning
								tickets at the door to receive your meal. {ticketCopy}
							</p>
						</div>

						<div
							aria-hidden="true"
							className="hidden min-h-56 border-white/80 border-b border-dashed sm:block lg:border-r lg:border-b-0"
						/>

						<div className="relative flex min-h-56 items-center justify-center bg-pastel-pink/60 px-6 py-8">
							<div className="-left-3 -translate-y-1/2 absolute top-1/2 hidden h-6 w-6 rounded-full bg-pale-grey lg:block" />
							<div className="rounded-lg bg-pale-grey p-4 text-awesomer-purple">
								<QRCode
									className="h-44 w-44 [&>path:first-of-type]:fill-pale-grey [&>path:last-of-type]:fill-awesomer-purple"
									value={`${session.user.id}::${displayName}::${emailAddress}`}
								/>
							</div>
						</div>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="font-semibold text-dark-grey text-lg">
						Dietary Restrictions
					</h2>

					<div className="rounded-lg bg-white px-5 py-4 shadow-[0_8px_24px_rgba(51,51,51,0.04)]">
						<div className="flex items-start justify-between gap-4">
							<div className="min-w-0 space-y-4">
								<p className="text-dark-grey text-sm">
									Your registered dietary restrictions:
								</p>
								{dietaryRestrictions.length > 0 ? (
									<div className="flex flex-wrap gap-2">
										{dietaryRestrictions.map((restriction) => (
											<span
												className="rounded-md bg-lilac-purple/50 px-3 py-1 font-medium text-awesomer-purple text-xs"
												key={restriction}
											>
												{restriction}
											</span>
										))}
									</div>
								) : (
									<p className="font-medium text-dark-grey/60 text-sm">
										None registered
									</p>
								)}
							</div>

							<button
								className="inline-flex shrink-0 cursor-pointer items-center rounded-md px-3 py-2 font-medium text-dark-grey text-sm transition hover:bg-light-grey"
								type="button"
							>
								Edit
							</button>
						</div>
					</div>
				</section>

				<section className="space-y-5">
					<h2 className="font-semibold text-dark-grey text-lg">
						Meal Schedule
					</h2>

					{groupedMeals.length > 0 ? (
						<div className="grid gap-8 lg:grid-cols-2">
							{groupedMeals.map((group) => (
								<div className="space-y-4" key={group.key}>
									<h3 className="font-bold text-dark-grey text-sm">
										{group.label}
									</h3>
									<ol className="relative space-y-8 border-medium-grey border-l pl-8">
										{group.meals.map((meal) => {
											const status = getMealStatus(meal, now);

											return (
												<li className="relative" key={meal.id}>
													<div className="-left-[43px] absolute top-1 flex w-7 flex-col items-center">
														<span className="rounded-full bg-dark-pink px-2 py-0.5 font-bold text-[10px] text-white">
															Food
														</span>
														<span className="mt-2 text-center text-[10px] text-dark-grey/70 leading-3">
															{status}
														</span>
													</div>

													<div className="grid gap-4 sm:grid-cols-[96px_1fr] sm:items-start">
														<div
															aria-hidden="true"
															className="h-24 w-24 rounded-md bg-pastel-pink"
														/>

														<div className="min-w-0 space-y-2">
															<h4 className="break-words font-semibold text-base text-dark-grey">
																{meal.title}
															</h4>
															<p className="text-dark-grey/70 text-xs">
																{formatTimeRange(meal.startTime, meal.endTime)}
															</p>
															<p className="text-dark-grey/70 text-sm leading-6">
																Show your meal ticket during this window to
																check in for {meal.title.toLowerCase()}.
															</p>
														</div>
													</div>
												</li>
											);
										})}
									</ol>
								</div>
							))}
						</div>
					) : (
						<div className="rounded-lg border border-medium-grey border-dashed bg-white px-6 py-10 text-center">
							<p className="font-semibold text-dark-grey">
								No meals have been scheduled yet.
							</p>
							<p className="mt-2 text-dark-grey/60 text-sm">
								Check back soon for meal times and ticket scanning windows.
							</p>
						</div>
					)}
				</section>
			</div>
		</main>
	);
}
