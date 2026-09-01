"use client";

import {
	ArrowLeftLine,
	ArrowRightLine,
	Calendar2Line,
	ClipboardLine,
	Home1Line,
	More1Line,
	NotificationLine,
	VideoLine
} from "@mingcute/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	type ComponentType,
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState
} from "react";
import { useConfirmDialog } from "@/app/components/ConfirmAlertDialog";
import { MobileNavSheet } from "@/app/components/MobileNavSheet";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api, type RouterOutputs } from "@/trpc/react";

type JudgeAssignment =
	RouterOutputs["judgingAssignments"]["getByJudge"][number];
type Criterion = RouterOutputs["criteria"]["getAll"][number];
type JudgeNavIcon = ComponentType<{ className?: string }>;

type JudgeUserContextValue = {
	userId: string;
	userName: string;
};

const JudgeUserContext = createContext<JudgeUserContextValue | null>(null);

const navItems: Array<{ href: string; icon: JudgeNavIcon; label: string }> = [
	{ href: "/judge", icon: Home1Line, label: "Dashboard" },
	{ href: "/judge/schedule", icon: Calendar2Line, label: "Schedule" },
	{ href: "/judge/rubric", icon: ClipboardLine, label: "Rubric" }
];

function useJudgeUser() {
	const value = useContext(JudgeUserContext);
	if (!value) {
		throw new Error("Judge portal user context is missing.");
	}
	return value;
}

function isActivePath(pathname: string, href: string) {
	if (href === "/judge") {
		return pathname === "/judge" || pathname === "/judge/";
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}

function JudgeNavContent({
	onNavigate,
	userName
}: {
	onNavigate?: () => void;
	userName: string;
}) {
	const pathname = usePathname();
	const initial = userName.trim().charAt(0).toUpperCase() || "J";

	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex min-w-0 items-center gap-2">
					<span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#fe957b] font-semibold text-sm text-white">
						{initial}
					</span>
					<span className="truncate font-medium text-base text-foreground">
						{userName}
					</span>
				</div>
				<span aria-hidden="true" className="p-2 text-foreground">
					<NotificationLine className="size-6" />
				</span>
			</div>

			<nav aria-label="Judge navigation" className="flex flex-col gap-4">
				<p className="m-0 font-medium text-[11px] text-muted-foreground leading-4">
					JUDGING INFORMATION
				</p>
				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{navItems.map((item) => {
						const active = isActivePath(pathname, item.href);
						const Icon = item.icon;
						return (
							<li key={item.href}>
								<Link
									aria-current={active ? "page" : undefined}
									className={cn(
										"flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors",
										active
											? "bg-accent text-foreground"
											: "text-foreground hover:bg-muted"
									)}
									href={item.href}
									onClick={onNavigate}
								>
									<Icon className="size-5 shrink-0" />
									<span>{item.label}</span>
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>
		</div>
	);
}

export function JudgeShell({
	children,
	userId,
	userName
}: {
	children: ReactNode;
	userId: string;
	userName: string;
}) {
	const pathname = usePathname();
	const [menuOpen, setMenuOpen] = useState(false);
	const isScorePath = pathname.startsWith("/judge/score/");

	return (
		<JudgeUserContext.Provider value={{ userId, userName }}>
			<div
				className="min-h-screen bg-background text-foreground"
				style={{ fontFamily: "var(--font-omnes), sans-serif" }}
			>
				<aside className="fixed inset-y-0 left-0 hidden w-[209px] border-border border-r bg-sidebar py-4 pr-4 pl-4 lg:block">
					<JudgeNavContent userName={userName} />
				</aside>

				<header className="flex h-14 items-center justify-between bg-background px-6 py-1 lg:hidden">
					<Button
						aria-expanded={menuOpen}
						aria-label="Open judge navigation"
						onClick={() => setMenuOpen(true)}
						size="icon-lg"
						type="button"
						variant="ghost"
					>
						<More1Line />
					</Button>
					<span aria-hidden="true" className="p-2 text-foreground">
						<NotificationLine className="size-6" />
					</span>
				</header>

				<div className="lg:hidden">
					<MobileNavSheet
						onOpenChange={setMenuOpen}
						open={menuOpen}
						title="Judge navigation"
					>
						<JudgeNavContent
							onNavigate={() => setMenuOpen(false)}
							userName={userName}
						/>
					</MobileNavSheet>
				</div>

				<main
					className={
						isScorePath
							? "flex flex-col lg:ml-[209px]"
							: "flex flex-col gap-5 px-6 py-6 lg:ml-[209px]"
					}
				>
					{children}
				</main>
			</div>
		</JudgeUserContext.Provider>
	);
}

const judgeTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

function formatTime(value?: Date | null) {
	if (!value) return "Unscheduled";
	return new Intl.DateTimeFormat("en-US", {
		hour: "numeric",
		hour12: true,
		minute: "2-digit",
		timeZone: judgeTimeZone
	}).format(value);
}

function formatDate(value?: Date | null) {
	if (!value) return "Unscheduled";
	return new Intl.DateTimeFormat("en-US", {
		day: "numeric",
		month: "long",
		weekday: "long",
		timeZone: judgeTimeZone
	}).format(value);
}

function formatDuration(minutes: number) {
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;
	return remainder ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

function getTeamCode(assignment: JudgeAssignment) {
	return (
		assignment.team.teamCode ?? assignment.team.id.slice(0, 4).toUpperCase()
	);
}

function getAssignmentRoomName(assignment: JudgeAssignment) {
	return assignment.room.name || "Room";
}

function sortAssignments(a: JudgeAssignment, b: JudgeAssignment) {
	const aTime = a.timeSlot?.getTime() ?? Number.MAX_SAFE_INTEGER;
	const bTime = b.timeSlot?.getTime() ?? Number.MAX_SAFE_INTEGER;
	return aTime - bTime || a.team.name.localeCompare(b.team.name);
}

function getCriteriaScore(assignment: JudgeAssignment, criterionId: string) {
	return assignment.scores.find((score) => score.criteriaId === criterionId)
		?.value;
}

function isAssignmentScored(
	assignment: JudgeAssignment,
	criteria: Criterion[]
) {
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	if (mainCriteria.length === 0) {
		return assignment.scores.length > 0;
	}
	return mainCriteria.every((criterion) =>
		assignment.scores.some((score) => score.criteriaId === criterion.id)
	);
}

function getAssignmentTotal(
	assignment: JudgeAssignment,
	criteria: Criterion[],
	includeSidepots = false
) {
	const selectedCriteria = criteria.filter(
		(criterion) => includeSidepots || !criterion.isSidepot
	);
	const selectedIds = new Set(
		selectedCriteria.map((criterion) => criterion.id)
	);
	const total = assignment.scores.reduce(
		(sum, score) => sum + (selectedIds.has(score.criteriaId) ? score.value : 0),
		0
	);
	const max = selectedCriteria.reduce(
		(sum, criterion) => sum + criterion.maxScore,
		0
	);
	return { max, total };
}

function getScoreTone(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) {
		return "border-[#c8efbd] bg-[#eefbe9] text-[#317d15]";
	}
	if (percent >= 0.5) {
		return "border-[#ffe5b2] bg-[#fff8e8] text-[#9f630b]";
	}
	if (percent >= 0.3) {
		return "border-[#ffd2c9] bg-[#fff1ee] text-[#b71801]";
	}
	return "border-[#f6c8d6] bg-[#fff0f4] text-[#a70a38]";
}

function useJudgePortalData() {
	const { userId } = useJudgeUser();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const assignmentsQuery = api.judgingAssignments.getByJudge.useQuery(
		{ judgeId: userId },
		{ enabled: Boolean(userId) }
	);
	const criteriaQuery = api.criteria.getAll.useQuery();

	const assignments = useMemo(
		() => (assignmentsQuery.data ?? []).slice().sort(sortAssignments),
		[assignmentsQuery.data]
	);
	const criteria = useMemo(
		() =>
			(criteriaQuery.data ?? [])
				.slice()
				.sort((a, b) => Number(a.isSidepot) - Number(b.isSidepot)),
		[criteriaQuery.data]
	);
	const roomLabels = useMemo(() => {
		return new Map(
			assignments.map((assignment) => [
				assignment.room.id,
				getAssignmentRoomName(assignment)
			])
		);
	}, [assignments]);

	const roomSummary = useMemo(() => {
		const labels = Array.from(
			new Set(
				assignments.map((assignment) => getAssignmentRoomName(assignment))
			)
		);
		if (labels.length === 0) return "No room assigned yet";
		return `You’ve been assigned to ${labels[0]}`;
	}, [assignments]);
	const roomLabelSummary = useMemo(() => {
		const labels = Array.from(
			new Set(
				assignments.map((assignment) => getAssignmentRoomName(assignment))
			)
		);
		return labels.length > 0 ? labels[0] : "No room";
	}, [assignments]);

	const firstMeetingLink =
		assignments.find((assignment) => assignment.room.roomLink)?.room.roomLink ??
		"";

	const isLoading =
		settingsQuery.isLoading ||
		roundsQuery.isLoading ||
		assignmentsQuery.isLoading ||
		criteriaQuery.isLoading;
	const error =
		settingsQuery.error ??
		roundsQuery.error ??
		assignmentsQuery.error ??
		criteriaQuery.error;

	return {
		activeRoundId: settingsQuery.data?.currentRoundId ?? "",
		assignments,
		criteria,
		error,
		firstMeetingLink,
		isLoading,
		roomLabelSummary,
		roomLabels,
		roomSummary,
		rounds: roundsQuery.data ?? []
	};
}

function PageHeader({
	children,
	description,
	title
}: {
	children?: ReactNode;
	description: string;
	title: ReactNode;
}) {
	return (
		<header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div>
				<h1 className="m-0 font-semibold text-[32px] leading-10">{title}</h1>
				<p className="m-0 text-[#575757] text-sm leading-5">{description}</p>
			</div>
			{children}
		</header>
	);
}

function JoinMeetingButton({ href }: { href: string }) {
	if (!href) {
		return (
			<Button disabled type="button" variant="secondary">
				<VideoLine data-icon="inline-start" />
				Join Zoom Meeting
			</Button>
		);
	}

	return (
		<Button
			render={
				<a href={href} rel="noreferrer" target="_blank">
					<VideoLine data-icon="inline-start" />
					Join Zoom Meeting
				</a>
			}
		/>
	);
}

function LoadingCard({
	label = "Loading judging information…"
}: {
	label?: string;
}) {
	return (
		<Card aria-live="polite">
			<CardContent className="flex min-h-56 flex-col justify-center gap-3">
				<Skeleton className="h-4 w-48" />
				<p className="m-0 text-muted-foreground text-sm">{label}</p>
			</CardContent>
		</Card>
	);
}

function ErrorCard({ message }: { message: string }) {
	return (
		<Card>
			<CardContent>
				<p className="m-0 text-destructive">{message}</p>
			</CardContent>
		</Card>
	);
}

function RoundStatsCard({
	assigned,
	name,
	remaining,
	scored
}: {
	assigned: number;
	name: string;
	remaining: number;
	scored: number;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="m-0 font-medium text-[20px] leading-6">{name}</h2>
			<Card className="rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<CardContent className="grid min-h-[96px] grid-cols-3 px-4 py-3">
					<StatNumber label="Assigned" value={assigned} />
					<StatNumber label="Scored" tone="green" value={scored} />
					<StatNumber label="Remaining" tone="red" value={remaining} />
				</CardContent>
			</Card>
		</div>
	);
}

function StatNumber({
	label,
	tone = "default",
	value
}: {
	label: string;
	tone?: "default" | "green" | "red";
	value: number | string;
}) {
	const color =
		tone === "green"
			? "text-[#038b6f]"
			: tone === "red"
				? "text-[#fe3b20]"
				: "text-[#000000]";

	return (
		<div className="flex min-w-0 flex-col items-center justify-center gap-0 text-center">
			<strong className={`font-semibold text-[44px] leading-[52px] ${color}`}>
				{value}
			</strong>
			<span className="font-medium text-[#1a1a1a] text-xs uppercase leading-4">
				{label}
			</span>
		</div>
	);
}

function JudgeTeamCard({
	assignment,
	criteria,
	currentTime,
	roomLabel,
	scoreHref
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	currentTime: Date;
	roomLabel: string;
	scoreHref: string;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const canScore =
		scored || !assignment.timeSlot || assignment.timeSlot <= currentTime;
	const mainCriteria = criteria.filter((criterion) => !criterion.isSidepot);
	const sidepots = criteria.filter((criterion) => criterion.isSidepot);
	const total = getAssignmentTotal(assignment, criteria);

	return (
		<Card className="flex min-h-[138px] flex-col gap-3 rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
			<CardContent className="flex flex-1 flex-col gap-3">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2">
							<h3 className="m-0 truncate font-medium text-base text-black">
								{assignment.team.name}
							</h3>
							{scored ? (
								<Link
									aria-label={`Edit score for ${assignment.team.name}`}
									className="rounded-full bg-[#d8f6ee] px-2 py-0.5 font-medium text-[#02644f] text-[11px] transition hover:bg-[#c6f0e5]"
									href={scoreHref}
								>
									Scored
								</Link>
							) : null}
						</div>
						<p className="mt-1 mb-0 text-[#767676] text-[11px]">
							Team ID: {getTeamCode(assignment)}
						</p>
					</div>
					<div className="shrink-0 text-left text-[#767676] text-xs sm:text-right">
						<p className="m-0">
							{formatTime(assignment.timeSlot)}
							{assignment.timeSlot ? " • " : ""}
							{assignment.room.round.name}
						</p>
						<p className="m-0">{roomLabel}</p>
					</div>
				</div>

				{scored ? (
					<div className="flex flex-col gap-3">
						{sidepots.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{sidepots.map((criterion) => {
									const value = getCriteriaScore(assignment, criterion.id);
									if (value === undefined) return null;
									return (
										<span
											className="inline-flex items-center gap-2 rounded-full bg-[#f7f5ff] px-3 py-1 text-[#1a1a1a] text-[11px]"
											key={criterion.id}
										>
											{criterion.name}
											<span className="rounded-full bg-[#7054fd] px-2 py-0.5 font-medium text-[10px] text-white">
												{value}/{criterion.maxScore}
											</span>
										</span>
									);
								})}
							</div>
						) : null}

						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
							{mainCriteria.map((criterion) => {
								const value = getCriteriaScore(assignment, criterion.id) ?? 0;
								return (
									<div
										className={`rounded-xl border px-2 py-2 text-center ${getScoreTone(value, criterion.maxScore)}`}
										key={criterion.id}
									>
										<strong className="block font-semibold text-base leading-5">
											{value}
										</strong>
										<span className="block truncate text-[#292929] text-[9px] uppercase leading-3">
											{criterion.name}
										</span>
									</div>
								);
							})}
							<div className="rounded-xl border border-[#d6d6d6] bg-[#fafafa] px-2 py-2 text-center">
								<strong className="block font-semibold text-base leading-5">
									{total.max ? `${total.total}/${total.max}` : total.total}
								</strong>
								<span className="block text-[#434343] text-[9px] uppercase leading-3">
									Total
								</span>
							</div>
						</div>
					</div>
				) : null}

				{scored ? null : (
					<div className="mt-auto flex justify-end">
						{canScore ? (
							<Button render={<Link href={scoreHref} />} size="sm">
								Score team
								<ArrowRightLine data-icon="inline-end" />
							</Button>
						) : (
							<Button disabled size="sm" type="button" variant="secondary">
								Score team
								<ArrowRightLine data-icon="inline-end" />
							</Button>
						)}
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function hasDraftScore(scores: Record<string, number>, criterionId: string) {
	return Object.hasOwn(scores, criterionId);
}

function getDraftScore(scores: Record<string, number>, criterionId: string) {
	return hasDraftScore(scores, criterionId) ? scores[criterionId] : undefined;
}

function getScoreTextColor(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "text-[#02644f]";
	if (percent >= 0.5) return "text-[#317d15]";
	if (percent >= 0.3) return "text-[#9f630b]";
	if (percent >= 0.15) return "text-[#b71801]";
	return "text-[#a70a38]";
}

function getScoreFillClass(value: number, max: number) {
	const percent = max > 0 ? value / max : 0;
	if (percent >= 0.75) return "bg-[#02644f] text-white";
	if (percent >= 0.5) return "bg-[#317d15] text-white";
	if (percent >= 0.3) return "bg-[#9f630b] text-white";
	if (percent >= 0.15) return "bg-[#b71801] text-white";
	return "bg-[#a70a38] text-white";
}

function getCriterionDescription(criterion: Criterion) {
	return criterion.isSidepot
		? `Assess how well this project meets the ${criterion.name} sidepot and whether the execution is clear, meaningful, and complete.`
		: `Evaluate how strongly this project demonstrates ${criterion.name.toLowerCase()} and how clearly that strength supports the team’s overall solution.`;
}

function getBandDescription(criterion: Criterion, label: string) {
	return criterion.isSidepot
		? `Use this range when the ${criterion.name} sidepot shows ${label.toLowerCase()} evidence, execution, and relevance.`
		: `Use this range when the project shows ${label.toLowerCase()} evidence for ${criterion.name.toLowerCase()}.`;
}

function getScoreOptions(
	criterion: Criterion,
	includeZero: boolean,
	currentScore?: number
) {
	const maxScore = criterion.maxScore;
	const start = includeZero || currentScore === 0 ? 0 : 1;
	return Array.from(
		{ length: Math.max(0, maxScore - start + 1) },
		(_, index) => start + index
	);
}

function ScoreStatusChip({
	active,
	criterion,
	score,
	sidepotComplete
}: {
	active: boolean;
	criterion?: Criterion;
	score?: number;
	sidepotComplete?: boolean;
}) {
	if (!criterion) {
		return (
			<Badge
				className={cn(
					"h-auto rounded-full px-3 py-1 text-base leading-6",
					active
						? "bg-foreground text-background hover:bg-foreground/90"
						: sidepotComplete
							? "border-transparent bg-[#f7f5ff] text-[#4a28f6] hover:bg-[#f7f5ff]"
							: "text-[#a5a5a5]"
				)}
				variant={active || sidepotComplete ? "default" : "outline"}
			>
				Side pots
				<span className="flex items-center gap-1">
					<span className="size-1.5 rounded-full bg-current" />
					<span className="size-1.5 rounded-full bg-current opacity-70" />
				</span>
			</Badge>
		);
	}

	if (active) {
		return (
			<Badge className="h-auto rounded-full bg-foreground px-3 py-1 text-background text-base leading-6 hover:bg-foreground/90">
				{criterion.name}
			</Badge>
		);
	}

	if (score === undefined) {
		return (
			<Badge
				className="h-auto rounded-full px-3 py-1 text-[#a5a5a5] text-base leading-6"
				variant="outline"
			>
				{criterion.name}
			</Badge>
		);
	}

	return (
		<Badge
			className={cn(
				"h-auto rounded-full px-3 py-1 text-base leading-6",
				getScoreTone(score, criterion.maxScore)
			)}
			variant="outline"
		>
			{criterion.name}
			<span>{score}</span>
		</Badge>
	);
}

function ScoreTotal({
	criteria,
	scores
}: {
	criteria: Criterion[];
	scores: Record<string, number>;
}) {
	const total = criteria.reduce(
		(sum, criterion) => sum + (getDraftScore(scores, criterion.id) ?? 0),
		0
	);
	const max = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);

	return (
		<div className="flex flex-col items-end text-center font-medium">
			<p className="m-0 text-[0px] text-black leading-none">
				<span className="text-[22px] leading-7">{total}</span>
				<span className="text-[#a5a5a5] text-sm leading-5">/{max}</span>
			</p>
			<p className="m-0 text-[#434343] text-[9px] uppercase leading-[14px]">
				Total
			</p>
		</div>
	);
}

function ScoreTopBar({
	activeStep,
	assignment,
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	activeStep: number;
	assignment: JudgeAssignment;
	criteria: Criterion[];
	mainCriteria: Criterion[];
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	const sidepotStepActive = activeStep >= mainCriteria.length;
	const sidepotsComplete =
		sidepotCriteria.length > 0 &&
		sidepotCriteria.every((criterion) => hasDraftScore(scores, criterion.id));

	return (
		<header className="border-[#d6d6d6] border-b bg-[#fafafa] px-6 py-4 sm:px-8">
			<nav className="mb-3 flex items-center gap-1 text-xs leading-4">
				<Link
					className="text-[#a5a5a5] transition hover:text-[#575757]"
					href="/judge"
				>
					Dashboard
				</Link>
				<span className="text-[#a5a5a5]">/</span>
				<span className="font-medium text-[#ec1245]">Score</span>
			</nav>
			<div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
				<div className="flex min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:items-center">
					<div className="min-w-[172px]">
						<h1 className="m-0 truncate font-semibold text-base text-black leading-6">
							{assignment.team.name}
						</h1>
						<div className="mt-0 flex flex-wrap items-center gap-1 text-[#767676] text-[11px] leading-4">
							<span>Team ID: {getTeamCode(assignment)}</span>
							<span aria-hidden="true">•</span>
							<span>{formatTime(assignment.timeSlot)}</span>
							<span aria-hidden="true">•</span>
							<span>{assignment.room.round.name}</span>
						</div>
					</div>

					<div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 lg:pl-7">
						{mainCriteria.map((criterion, index) => (
							<ScoreStatusChip
								active={activeStep === index}
								criterion={criterion}
								key={criterion.id}
								score={getDraftScore(scores, criterion.id)}
							/>
						))}
						{sidepotCriteria.length > 0 ? (
							<ScoreStatusChip
								active={sidepotStepActive}
								sidepotComplete={sidepotsComplete}
							/>
						) : null}
					</div>
				</div>

				<ScoreTotal criteria={criteria} scores={scores} />
			</div>
		</header>
	);
}

function ScoreButtonGroup({
	criterion,
	includeZero,
	onChange,
	value
}: {
	criterion: Criterion;
	includeZero: boolean;
	onChange: (value: number) => void;
	value?: number;
}) {
	return (
		<div className="flex flex-wrap gap-3">
			{getScoreOptions(criterion, includeZero, value).map((option) => {
				const selected = value === option;
				return (
					<button
						aria-pressed={selected}
						className={`flex h-14 w-[62px] items-center justify-center rounded-lg border font-medium text-base transition ${
							selected
								? `border-transparent ${getScoreFillClass(
										option,
										criterion.maxScore
									)}`
								: "border-[#e6e6e6] bg-white text-[#575757] hover:border-[#7054fd] hover:bg-[#f7f5ff]"
						}`}
						key={option}
						onClick={() => onChange(option)}
						type="button"
					>
						{option}
					</button>
				);
			})}
		</div>
	);
}

function RubricBandCard({
	band,
	criterion,
	selected
}: {
	band: ReturnType<typeof getRubricBands>[number];
	criterion: Criterion;
	selected: boolean;
}) {
	const toneValue = band.max;
	return (
		<article
			className={`rounded-lg border p-3 ${
				selected
					? getScoreTone(toneValue, criterion.maxScore)
					: "border-[#e6e6e6] bg-white"
			}`}
		>
			<div className="mb-2 flex items-center gap-2">
				<p
					className={`m-0 text-2xl leading-8 ${getScoreTextColor(
						toneValue,
						criterion.maxScore
					)}`}
				>
					{band.range}
				</p>
				<p className="m-0 font-medium text-[#292929] text-xs uppercase leading-4">
					{band.label}
				</p>
			</div>
			<p className="m-0 text-[#292929] text-[13px] leading-[18px]">
				{getBandDescription(criterion, band.label)}
			</p>
		</article>
	);
}

function RubricBandGrid({
	criterion,
	includeZero,
	selectedScore
}: {
	criterion: Criterion;
	includeZero: boolean;
	selectedScore?: number;
}) {
	return (
		<div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1">
			{getRubricBands(criterion.maxScore, includeZero).map((band) => (
				<RubricBandCard
					band={band}
					criterion={criterion}
					key={`${criterion.id}-${band.range}`}
					selected={
						selectedScore !== undefined &&
						selectedScore >= band.min &&
						selectedScore <= band.max
					}
				/>
			))}
		</div>
	);
}

function StepActions({
	canSubmit,
	disabledSubmitLabel,
	isLastStep,
	isPending,
	onNext,
	onPrevious,
	onSubmit
}: {
	canSubmit: boolean;
	disabledSubmitLabel: string;
	isLastStep: boolean;
	isPending: boolean;
	onNext: () => void;
	onPrevious: () => void;
	onSubmit: () => void;
}) {
	return (
		<div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
			<Button onClick={onPrevious} type="button" variant="outline">
				<ArrowLeftLine data-icon="inline-start" />
				Prev
			</Button>

			{isLastStep ? (
				<Button
					className="sm:min-w-[318px]"
					disabled={!canSubmit || isPending}
					onClick={onSubmit}
					type="button"
					variant={canSubmit ? "default" : "secondary"}
				>
					{isPending
						? "Submitting…"
						: canSubmit
							? "Submit score"
							: disabledSubmitLabel}
				</Button>
			) : (
				<Button onClick={onNext} type="button">
					Next
					<ArrowRightLine data-icon="inline-end" />
				</Button>
			)}
		</div>
	);
}

function MainCriterionStep({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<div className="grid w-full gap-6 xl:grid-cols-[minmax(0,728px)_263px]">
			<section className="flex min-w-0 flex-col gap-8 xl:pr-4">
				<div className="flex flex-col gap-6">
					<h2 className="m-0 font-semibold text-[#1a1a1a] text-[28px] leading-9">
						{criterion.name}
					</h2>
					<p className="m-0 text-[#292929] text-base leading-6">
						{getCriterionDescription(criterion)}
					</p>
				</div>

				<div className="flex flex-col gap-3">
					<p className="m-0 font-medium text-[#434343] text-sm uppercase leading-5">
						Score
					</p>
					<ScoreButtonGroup
						criterion={criterion}
						includeZero={false}
						onChange={(value) => onScoreChange(criterion.id, value)}
						value={score}
					/>
				</div>

				<div className="xl:hidden">
					<RubricBandGrid
						criterion={criterion}
						includeZero={false}
						selectedScore={score}
					/>
				</div>
			</section>

			<aside className="hidden border-[#eceae5] border-l pl-4 xl:block">
				<RubricBandGrid
					criterion={criterion}
					includeZero={false}
					selectedScore={score}
				/>
			</aside>
		</div>
	);
}

function SidepotBadge({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	const scored = score !== undefined;
	return (
		<Badge
			className={cn(
				"h-auto gap-1.5 rounded-full px-2 py-1 text-[11px]",
				scored
					? getScoreTone(score, criterion.maxScore)
					: "border-[#a5a5a5] bg-background text-foreground"
			)}
			variant="outline"
		>
			<span className="size-1.5 rounded-full bg-current" />
			<span className="font-medium">{criterion.name}</span>
			<Badge
				className={cn(
					"h-auto rounded-full px-2 py-px font-semibold text-[10px]",
					scored
						? getScoreFillClass(score, criterion.maxScore)
						: "bg-[#a5a5a5] text-white hover:bg-[#a5a5a5]"
				)}
			>
				{scored ? `${score}/${criterion.maxScore}` : `/${criterion.maxScore}`}
			</Badge>
		</Badge>
	);
}

function ScoreTile({
	criterion,
	score
}: {
	criterion: Criterion;
	score?: number;
}) {
	return (
		<div className="flex w-16 flex-col items-center gap-0.5 px-1 text-center">
			<p
				className={`m-0 font-medium text-base leading-6 ${
					score === undefined
						? "text-[#a5a5a5]"
						: getScoreTextColor(score, criterion.maxScore)
				}`}
			>
				{score ?? "–"}
			</p>
			<p className="m-0 truncate text-[#292929] text-[9px] uppercase leading-[14px]">
				{criterion.name}
			</p>
		</div>
	);
}

function ScoreSummaryCard({
	criteria,
	mainCriteria,
	scores,
	sidepotCriteria
}: {
	criteria: Criterion[];
	mainCriteria: Criterion[];
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	return (
		<section className="rounded-[10px] bg-white px-3 py-4">
			<h3 className="m-0 font-medium text-base text-black leading-6">
				Score Summary
			</h3>
			<div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center">
				<div className="flex flex-wrap gap-3">
					{sidepotCriteria.map((criterion) => (
						<SidepotBadge
							criterion={criterion}
							key={criterion.id}
							score={getDraftScore(scores, criterion.id)}
						/>
					))}
				</div>
				<div className="flex flex-1 flex-col gap-3 border-[#e6e6e6] border-t pt-3 lg:flex-row lg:items-center lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
					<div className="flex flex-1 flex-wrap justify-between gap-2">
						{mainCriteria.map((criterion) => (
							<ScoreTile
								criterion={criterion}
								key={criterion.id}
								score={getDraftScore(scores, criterion.id)}
							/>
						))}
					</div>
					<div className="border-[#e6e6e6] border-t pt-2 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-4">
						<ScoreTotal criteria={criteria} scores={scores} />
					</div>
				</div>
			</div>
		</section>
	);
}

function SidepotCriterionCard({
	criterion,
	onScoreChange,
	score
}: {
	criterion: Criterion;
	onScoreChange: (criterionId: string, score: number) => void;
	score?: number;
}) {
	return (
		<article className="overflow-hidden rounded-xl border border-[#d6d6d6] bg-white">
			<header className="flex items-center justify-between border-[#f5f5f5] border-b bg-[#fcfcfc] px-5 py-4">
				<div className="flex items-center gap-2.5">
					<span className="size-2.5 rounded-full bg-[#ec1245]" />
					<div>
						<h3 className="m-0 font-medium text-[#1a1a1a] text-base leading-6">
							{criterion.name}
						</h3>
						<p className="m-0 text-[#a5a5a5] text-xs leading-4">Sidepot</p>
					</div>
				</div>
				<div className="text-right font-medium">
					{score === undefined ? (
						<p className="m-0 text-[#767676] text-[11px] leading-[14px]">
							Not yet scored
						</p>
					) : (
						<>
							<p className="m-0 text-[0px] text-black leading-none">
								<span className="text-[22px] leading-7">{score}</span>
								<span className="text-[#a5a5a5] text-sm leading-5">
									/{criterion.maxScore}
								</span>
							</p>
							<p className="m-0 text-[#434343] text-[9px] leading-[14px]">
								Scored
							</p>
						</>
					)}
				</div>
			</header>
			<div className="border-[#f5f5f5] border-b px-5 py-3">
				<p className="m-0 text-[#292929] text-xs leading-4 sm:text-sm sm:leading-5">
					{getCriterionDescription(criterion)}
				</p>
			</div>
			<div className="flex flex-col gap-4 p-4">
				<ScoreButtonGroup
					criterion={criterion}
					includeZero
					onChange={(value) => onScoreChange(criterion.id, value)}
					value={score}
				/>
				<RubricBandGrid
					criterion={criterion}
					includeZero
					selectedScore={score}
				/>
			</div>
		</article>
	);
}

function SidepotsStep({
	criteria,
	mainCriteria,
	onScoreChange,
	scores,
	sidepotCriteria
}: {
	criteria: Criterion[];
	mainCriteria: Criterion[];
	onScoreChange: (criterionId: string, score: number) => void;
	scores: Record<string, number>;
	sidepotCriteria: Criterion[];
}) {
	return (
		<section className="flex flex-col gap-6">
			<div className="flex flex-col gap-3">
				<h2 className="m-0 font-semibold text-[#1a1a1a] text-[28px] leading-9">
					Side pots
				</h2>
				<p className="m-0 text-[#292929] text-base leading-6">
					Please grade the side pots according to their own rubric.
				</p>
			</div>

			{sidepotCriteria.length > 0 ? (
				<div className="flex flex-col gap-4">
					{sidepotCriteria.map((criterion) => (
						<SidepotCriterionCard
							criterion={criterion}
							key={criterion.id}
							onScoreChange={onScoreChange}
							score={getDraftScore(scores, criterion.id)}
						/>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-[#d6d6d6] border-dashed bg-white p-8 text-center text-[#575757]">
					No sidepot criteria have been published for this event.
				</div>
			)}

			<ScoreSummaryCard
				criteria={criteria}
				mainCriteria={mainCriteria}
				scores={scores}
				sidepotCriteria={sidepotCriteria}
			/>
		</section>
	);
}

function ScorePageMessage({
	description,
	title
}: {
	description: ReactNode;
	title: string;
}) {
	return (
		<div className="flex min-h-[calc(100vh-57px)] items-center justify-center px-6 py-12 lg:min-h-screen">
			<div className="max-w-md rounded-2xl border border-[#d6d6d6] bg-white p-6 text-center shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<h1 className="m-0 font-semibold text-[28px] leading-9">{title}</h1>
				<p className="mt-3 mb-0 text-[#575757] text-base leading-6">
					{description}
				</p>
				<Link
					className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#7054fd] px-4 font-medium text-white transition hover:bg-[#6044ed]"
					href="/judge"
				>
					Back to dashboard
				</Link>
			</div>
		</div>
	);
}

export function JudgeScorePage({ assignmentId }: { assignmentId: string }) {
	const { userId } = useJudgeUser();
	const router = useRouter();
	const { confirm, dialog } = useConfirmDialog();
	const data = useJudgePortalData();
	const utils = api.useUtils();
	const assignment = data.assignments.find((item) => item.id === assignmentId);
	const scoresQuery = api.scores.getByAssignment.useQuery(
		{ assignmentId },
		{ enabled: Boolean(assignment) }
	);
	const createMany = api.scores.createMany.useMutation();
	const [activeStep, setActiveStep] = useState(0);
	const [draftScores, setDraftScores] = useState<Record<string, number>>({});
	const [draftDirty, setDraftDirty] = useState(false);
	const [message, setMessage] = useState("");

	const criteria = data.criteria;
	const mainCriteria = useMemo(
		() => criteria.filter((criterion) => !criterion.isSidepot),
		[criteria]
	);
	const sidepotCriteria = useMemo(
		() => criteria.filter((criterion) => criterion.isSidepot),
		[criteria]
	);
	const hasSidepotStep = sidepotCriteria.length > 0;
	const totalSteps = mainCriteria.length + (hasSidepotStep ? 1 : 0);
	const requiredCriteria = criteria;
	const selectedCount = requiredCriteria.filter((criterion) =>
		hasDraftScore(draftScores, criterion.id)
	).length;
	const selectedSidepotCount = sidepotCriteria.filter((criterion) =>
		hasDraftScore(draftScores, criterion.id)
	).length;
	const allScoresSelected =
		requiredCriteria.length > 0 && selectedCount === requiredCriteria.length;
	const disabledSubmitLabel =
		sidepotCriteria.length > 0 && selectedSidepotCount < sidepotCriteria.length
			? `Score all side pots to submit (${selectedSidepotCount} of ${sidepotCriteria.length} done)`
			: `Score all criteria to submit (${selectedCount} of ${requiredCriteria.length} done)`;
	const activeCriterion =
		activeStep < mainCriteria.length ? mainCriteria[activeStep] : undefined;
	const isLastStep = totalSteps === 0 || activeStep >= totalSteps - 1;

	useEffect(() => {
		if (!(assignment && !draftDirty)) return;
		const nextScores: Record<string, number> = {};
		for (const score of scoresQuery.data ?? assignment.scores) {
			nextScores[score.criteriaId] = score.value;
		}
		setDraftScores(nextScores);
	}, [assignment, draftDirty, scoresQuery.data]);

	const updateScore = (criterionId: string, score: number) => {
		setDraftDirty(true);
		setDraftScores((current) => ({ ...current, [criterionId]: score }));
	};

	const submitScores = async () => {
		if (!(assignment && allScoresSelected)) return;
		setMessage("");

		try {
			await createMany.mutateAsync(
				requiredCriteria.map((criterion) => ({
					assignmentId: assignment.id,
					criteriaId: criterion.id,
					score: draftScores[criterion.id] ?? 0
				}))
			);
			await Promise.all([
				utils.scores.getByAssignment.invalidate({
					assignmentId: assignment.id
				}),
				utils.scores.getByRound.invalidate({
					roundId: assignment.room.round.id
				}),
				utils.judgingAssignments.getByJudge.invalidate({ judgeId: userId })
			]);
			router.push("/judge");
		} catch (error) {
			setMessage(
				error instanceof Error ? error.message : "Scores could not be saved."
			);
		}
	};

	if (data.error) {
		return (
			<ScorePageMessage
				description={`Judging data could not be loaded: ${data.error.message}`}
				title="Unable to load scoring"
			/>
		);
	}

	if (data.isLoading) {
		return <LoadingCard label="Loading scoring workspace…" />;
	}

	if (!assignment) {
		return (
			<ScorePageMessage
				description="This assignment could not be found for your judging account."
				title="Assignment unavailable"
			/>
		);
	}

	if (criteria.length === 0) {
		return (
			<ScorePageMessage
				description="No judging criteria have been published yet."
				title="No criteria available"
			/>
		);
	}

	return (
		<div className="min-h-screen bg-[#fcfcfc]">
			{dialog}
			<ScoreTopBar
				activeStep={activeStep}
				assignment={assignment}
				criteria={criteria}
				mainCriteria={mainCriteria}
				scores={draftScores}
				sidepotCriteria={sidepotCriteria}
			/>
			<div className="mx-auto flex w-full max-w-[1071px] flex-col gap-6 px-4 py-6 sm:px-8 lg:px-6">
				{activeCriterion ? (
					<MainCriterionStep
						criterion={activeCriterion}
						onScoreChange={updateScore}
						score={getDraftScore(draftScores, activeCriterion.id)}
					/>
				) : (
					<SidepotsStep
						criteria={criteria}
						mainCriteria={mainCriteria}
						onScoreChange={updateScore}
						scores={draftScores}
						sidepotCriteria={sidepotCriteria}
					/>
				)}

				{message ? (
					<p className="m-0 rounded-xl bg-red-50 px-4 py-3 text-red-700 text-sm">
						{message}
					</p>
				) : null}

				<StepActions
					canSubmit={allScoresSelected}
					disabledSubmitLabel={disabledSubmitLabel}
					isLastStep={isLastStep}
					isPending={createMany.isPending}
					onNext={() =>
						setActiveStep((current) => Math.min(current + 1, totalSteps - 1))
					}
					onPrevious={async () => {
						if (activeStep === 0) {
							if (
								draftDirty &&
								!(await confirm({
									title: "Leave scoring?",
									description:
										"You have unsaved score changes that will be lost.",
									confirmLabel: "Leave",
									destructive: true
								}))
							) {
								return;
							}
							router.push("/judge");
						} else {
							setActiveStep((current) => Math.max(0, current - 1));
						}
					}}
					onSubmit={submitScores}
				/>
			</div>
		</div>
	);
}

export function JudgeDashboardPage() {
	const { userName } = useJudgeUser();
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const roundStats = useMemo(() => {
		const roundsById = new Map(
			data.rounds.map((round) => [round.id, round] as const)
		);
		for (const assignment of data.assignments) {
			roundsById.set(assignment.room.round.id, assignment.room.round);
		}

		const grouped = new Map<string, JudgeAssignment[]>();
		for (const assignment of data.assignments) {
			const roundId = assignment.room.round.id;
			grouped.set(roundId, [...(grouped.get(roundId) ?? []), assignment]);
		}

		return Array.from(grouped.entries())
			.map(([roundId, assignments]) => {
				const round = roundsById.get(roundId);
				const scored = assignments.filter((assignment) =>
					isAssignmentScored(assignment, data.criteria)
				).length;
				return {
					assigned: assignments.length,
					id: roundId,
					isActive: data.activeRoundId === roundId,
					name: round?.name ?? "Judging round",
					remaining: assignments.length - scored,
					scored,
					startTime: round?.startTime?.getTime() ?? 0
				};
			})
			.sort(
				(a, b) =>
					Number(b.isActive) - Number(a.isActive) || a.startTime - b.startTime
			);
	}, [data.activeRoundId, data.assignments, data.criteria, data.rounds]);
	const dashboardRoundId =
		roundStats.find((round) => round.isActive)?.id ?? roundStats[0]?.id ?? "";
	const dashboardAssignments = dashboardRoundId
		? data.assignments.filter(
				(assignment) => assignment.room.round.id === dashboardRoundId
			)
		: data.assignments;
	const dashboardRoundName =
		roundStats.find((round) => round.id === dashboardRoundId)?.name ?? "";

	if (data.error) {
		return (
			<ErrorCard
				message={`Judging data could not be loaded: ${data.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Manage and score your assigned teams."
				title={
					<>
						Hi, <span className="text-[#f70c55]">{userName}</span>!
					</>
				}
			>
				<div className="flex flex-col items-start gap-1 sm:items-end">
					<p className="m-0 font-medium text-base">{data.roomSummary}</p>
					<JoinMeetingButton href={data.firstMeetingLink} />
				</div>
			</PageHeader>

			{data.isLoading ? (
				<LoadingCard />
			) : (
				<>
					{roundStats.length > 0 ? (
						<section className="grid gap-4 xl:grid-cols-2">
							{roundStats.map((round) => (
								<RoundStatsCard
									assigned={round.assigned}
									key={round.id}
									name={round.name}
									remaining={round.remaining}
									scored={round.scored}
								/>
							))}
						</section>
					) : null}

					<section className="flex flex-col gap-4">
						<h2 className="m-0 font-medium text-[22px] leading-7">
							{dashboardRoundName ? `Teams · ${dashboardRoundName}` : "Teams"}
						</h2>
						{dashboardAssignments.length > 0 ? (
							<div className="grid gap-4 xl:grid-cols-2">
								{dashboardAssignments.map((assignment) => (
									<JudgeTeamCard
										assignment={assignment}
										criteria={data.criteria}
										currentTime={currentTime}
										key={assignment.id}
										roomLabel={
											data.roomLabels.get(assignment.room.id) ??
											getAssignmentRoomName(assignment)
										}
										scoreHref={`/judge/score/${assignment.id}`}
									/>
								))}
							</div>
						) : (
							<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
								No teams have been assigned to you yet.
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}

function useCurrentTime() {
	const [currentTime, setCurrentTime] = useState(() => new Date());

	useEffect(() => {
		const interval = window.setInterval(
			() => setCurrentTime(new Date()),
			30_000
		);
		return () => window.clearInterval(interval);
	}, []);

	return currentTime;
}

function inferDuration(
	assignment: JudgeAssignment,
	assignments: JudgeAssignment[]
) {
	const assignmentTime = assignment.timeSlot;
	if (!assignmentTime) return 20;
	const nextAssignment = assignments
		.filter(
			(candidate) =>
				candidate.room.id === assignment.room.id &&
				candidate.timeSlot &&
				candidate.timeSlot > assignmentTime
		)
		.sort(sortAssignments)[0];

	if (!nextAssignment?.timeSlot) return 20;
	const minutes = Math.round(
		(nextAssignment.timeSlot.getTime() - assignmentTime.getTime()) / 60_000
	);
	if (minutes <= 0 || minutes > 120) return 20;
	return minutes;
}

function ScheduleEventCard({
	assignment,
	criteria,
	duration,
	roomLabel,
	scoreHref
}: {
	assignment: JudgeAssignment;
	criteria: Criterion[];
	duration: number;
	roomLabel: string;
	scoreHref: string;
}) {
	const scored = isAssignmentScored(assignment, criteria);
	const total = getAssignmentTotal(assignment, criteria);

	return (
		<Link
			className="group w-full rounded-2xl border border-[#d6d6d6] bg-white p-4 text-left shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:border-[#7054fd] hover:bg-[#f7f5ff]"
			href={scoreHref}
		>
			<div className="flex gap-4">
				<div className="hidden w-[68px] shrink-0 flex-col items-end border-[#d6d6d6] border-r pr-4 text-right sm:flex">
					<span
						className={`rounded-full px-2 py-0.5 font-medium text-[11px] ${
							scored
								? "bg-[#d8f6ee] text-[#02644f]"
								: "bg-[#eae6ff] text-[#2911a7]"
						}`}
					>
						{scored ? "Scored" : "Open"}
					</span>
					<span className="mt-2 text-[#767676] text-[11px]">
						{formatTime(assignment.timeSlot)}
					</span>
				</div>
				<div className="min-w-0 flex-1">
					<h3 className="m-0 truncate font-medium text-[#292929] text-lg">
						{assignment.team.name}
					</h3>
					<div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[#575757] text-xs">
						<span>Team ID: {getTeamCode(assignment)}</span>
						<span>{formatDuration(duration)}</span>
						<span>{roomLabel}</span>
					</div>
				</div>
				{scored ? (
					<div className="hidden shrink-0 text-right md:block">
						<span className="rounded-full bg-[#d8f6ee] px-3 py-1 font-medium text-[#02644f] text-xs">
							Scored
						</span>
						<p className="mt-2 mb-0 font-medium text-[22px] leading-7">
							{total.max ? `${total.total}/${total.max}` : total.total}
						</p>
					</div>
				) : null}
			</div>
		</Link>
	);
}

export function JudgeSchedulePage() {
	const data = useJudgePortalData();
	const currentTime = useCurrentTime();

	const scheduledAssignments = useMemo(
		() =>
			data.assignments
				.filter((assignment) => assignment.timeSlot)
				.slice()
				.sort(sortAssignments),
		[data.assignments]
	);
	const assignmentsByDate = useMemo(() => {
		const groups = new Map<string, JudgeAssignment[]>();
		for (const assignment of scheduledAssignments) {
			const key = assignment.timeSlot?.toDateString() ?? "unscheduled";
			groups.set(key, [...(groups.get(key) ?? []), assignment]);
		}
		return Array.from(groups.values());
	}, [scheduledAssignments]);

	if (data.error) {
		return (
			<ErrorCard
				message={`Schedule could not be loaded: ${data.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="View your assigned time slots."
				title="Judging Schedule"
			/>

			<Card className="rounded-2xl border-border shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
				<CardContent className="flex items-center justify-between px-4 py-3">
					<div>
						<p className="m-0 text-muted-foreground text-xs">Current time</p>
						<p className="m-0 font-medium text-[22px] leading-7">
							{formatTime(currentTime)}
						</p>
					</div>
					<div className="text-right">
						<p className="m-0 text-muted-foreground text-xs">Room assignment</p>
						<p className="m-0 font-medium text-base">{data.roomLabelSummary}</p>
					</div>
				</CardContent>
			</Card>

			{data.isLoading ? (
				<LoadingCard label="Loading schedule…" />
			) : scheduledAssignments.length > 0 ? (
				<div className="flex flex-col gap-8">
					{assignmentsByDate.map((group) => (
						<section className="flex flex-col gap-3" key={group[0]?.id}>
							<h2 className="m-0 font-medium text-base">
								{formatDate(group[0]?.timeSlot)}
							</h2>
							<div className="relative rounded-2xl bg-[#fcfcfc] pl-0 sm:pl-6">
								<div className="absolute top-3 bottom-3 left-3 hidden w-1 rounded-full bg-[#7054fd] sm:block" />
								<div className="flex flex-col gap-4">
									{group.map((assignment) => (
										<div
											className="grid gap-2 sm:grid-cols-[64px_1fr] sm:gap-4"
											key={assignment.id}
										>
											<div className="font-medium text-[#575757] text-sm sm:pt-2 sm:text-right">
												{formatTime(assignment.timeSlot)}
											</div>
											<ScheduleEventCard
												assignment={assignment}
												criteria={data.criteria}
												duration={inferDuration(
													assignment,
													scheduledAssignments
												)}
												roomLabel={
													data.roomLabels.get(assignment.room.id) ??
													getAssignmentRoomName(assignment)
												}
												scoreHref={`/judge/score/${assignment.id}`}
											/>
										</div>
									))}
								</div>
							</div>
						</section>
					))}
				</div>
			) : (
				<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
					No scheduled judging assignments yet.
				</div>
			)}
		</div>
	);
}

function getRubricBands(maxScore: number, includeZero = false) {
	const bands = [
		"Minimal",
		"Developing",
		"Satisfactory",
		"Effective",
		"Excellent"
	];
	const minScore = includeZero ? 0 : 1;
	const scoreCount = Math.max(1, maxScore - minScore + 1);
	const activeBands = bands.slice(0, Math.min(bands.length, scoreCount));

	return activeBands.map((label, index) => {
		const start = Math.min(
			maxScore,
			minScore + Math.ceil((index * scoreCount) / activeBands.length)
		);
		const rawEnd =
			minScore + Math.ceil(((index + 1) * scoreCount) / activeBands.length) - 1;
		const end = Math.min(maxScore, Math.max(start, rawEnd));
		return {
			label,
			max: end,
			min: start,
			range: start === end ? `${start}` : `${start}–${end}`
		};
	});
}

export function JudgeRubricPage() {
	const criteriaQuery = api.criteria.getAll.useQuery();
	const criteria = useMemo(
		() =>
			(criteriaQuery.data ?? [])
				.slice()
				.sort((a, b) => Number(a.isSidepot) - Number(b.isSidepot)),
		[criteriaQuery.data]
	);

	if (criteriaQuery.error) {
		return (
			<ErrorCard
				message={`Rubric could not be loaded: ${criteriaQuery.error.message}`}
			/>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Guidelines and criteria for assessing projects."
				title="Judging Rubric"
			/>

			<section className="rounded-2xl border border-border bg-background p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] sm:p-8">
				<p className="mt-0 mb-4 text-muted-foreground">
					Click on any category to view the detailed scoring criteria.
				</p>
				{criteriaQuery.isLoading ? (
					<LoadingCard label="Loading rubric…" />
				) : criteria.length > 0 ? (
					<Accordion
						className="gap-4"
						defaultValue={criteria[0] ? [criteria[0].id] : []}
					>
						{criteria.map((criterion) => (
							<AccordionItem
								className="overflow-hidden rounded-2xl border border-border not-last:border-b bg-card shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
								key={criterion.id}
								value={criterion.id}
							>
								<AccordionTrigger className="w-full items-center gap-4 px-4 py-4 hover:no-underline [&_svg]:size-5">
									<div className="text-left">
										<h3 className="m-0 font-medium text-base">
											{criterion.name}
										</h3>
										<p className="mt-1 mb-0 text-muted-foreground text-sm">
											{criterion.isSidepot ? "Sidepot" : "Main criteria"} ·{" "}
											{criterion.maxScore} points
										</p>
									</div>
								</AccordionTrigger>
								<AccordionContent className="border-border border-t px-4 pb-4">
									<div className="grid gap-3 pt-4 md:grid-cols-5">
										{getRubricBands(criterion.maxScore).map((band) => (
											<div
												className="rounded-xl bg-accent p-3 text-sm"
												key={`${criterion.id}-${band.label}`}
											>
												<p className="m-0 font-medium text-primary">
													{band.label}
												</p>
												<p className="mt-1 mb-0 font-semibold text-foreground">
													{band.range} pts
												</p>
												<p className="mt-2 mb-0 text-muted-foreground text-xs leading-4">
													Use this band when the project demonstrates{" "}
													{band.label.toLowerCase()} evidence for{" "}
													{criterion.name.toLowerCase()}.
												</p>
											</div>
										))}
									</div>
								</AccordionContent>
							</AccordionItem>
						))}
					</Accordion>
				) : (
					<div className="rounded-2xl border border-[#d6d6d6] border-dashed p-8 text-center text-[#575757]">
						No judging criteria have been published yet.
					</div>
				)}
			</section>
		</div>
	);
}
