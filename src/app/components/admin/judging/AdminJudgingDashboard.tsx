"use client";

import Image from "next/image";
import Link from "next/link";
import {
	type CSSProperties,
	type ReactNode,
	useEffect,
	useMemo,
	useState
} from "react";
import { api, type RouterOutputs } from "@/trpc/react";
import styles from "./AdminJudgingDashboard.module.scss";
import JudgingManagementSections from "./JudgingManagementSections";
import { formatTime } from "./judgingFormatters";

type IconName =
	| "arrow"
	| "bell"
	| "calendar"
	| "chevron"
	| "clipboard"
	| "close"
	| "meal"
	| "menu"
	| "settings"
	| "teams"
	| "users";

type Assignment = RouterOutputs["judgingAssignments"]["getByRound"][number];
type Room = RouterOutputs["judgingRooms"]["getLayoutByRound"]["rooms"][number];
type Team = RouterOutputs["teams"]["getAll"][number];
type SlotMinutes = 15 | 30 | 60;

const navSections = [
	{
		label: "EVENT MANAGEMENT",
		items: [
			{
				href: "/admin/judge#judging-schedule",
				icon: "calendar" as const,
				label: "Schedule"
			},
			{
				href: "/admin#users",
				icon: "users" as const,
				label: "Registered Users"
			},
			{ href: "/admin#teams", icon: "teams" as const, label: "Teams" },
			{ href: "/meal", icon: "meal" as const, label: "Meals" },
			{
				href: "/admin/judge",
				icon: "clipboard" as const,
				label: "Judging Information",
				active: true
			}
		]
	},
	{
		label: "APP MANAGEMENT",
		items: [
			{
				href: "/admin",
				icon: "settings" as const,
				label: "Admin Controls"
			}
		]
	}
] as const;

function Icon({
	className = "size-5",
	name
}: {
	className?: string;
	name: IconName;
}) {
	const paths: Record<IconName, ReactNode> = {
		arrow: (
			<>
				<path d="M5 12h14" />
				<path d="m13 6 6 6-6 6" />
			</>
		),
		bell: (
			<>
				<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
				<path d="M10 21h4" />
			</>
		),
		calendar: (
			<>
				<rect height="16" rx="2" width="18" x="3" y="5" />
				<path d="M16 3v4M8 3v4M3 10h18M7 14h2M11 14h2M15 14h2" />
			</>
		),
		chevron: <path d="m8 10 4 4 4-4" />,
		clipboard: (
			<>
				<rect height="18" rx="2" width="14" x="5" y="3" />
				<path d="M9 3.5h6v3H9zM8.5 13l2 2 5-5" />
			</>
		),
		close: (
			<>
				<path d="m6 6 12 12" />
				<path d="M18 6 6 18" />
			</>
		),
		meal: (
			<>
				<path d="M4 7h16M5 7l1 13h12l1-13M8 4h8" />
				<path d="M8 11h8M8 15h8" />
			</>
		),
		menu: (
			<>
				<path d="M4 7h16" />
				<path d="M4 12h16" />
				<path d="M4 17h16" />
			</>
		),
		settings: (
			<>
				<circle cx="12" cy="12" r="3" />
				<path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.55V21h-4v-.08A1.7 1.7 0 0 0 9 19.37a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.63 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.08V3h4v.08A1.7 1.7 0 0 0 15 4.63a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.92 10H21v4h-.08A1.7 1.7 0 0 0 19.4 15Z" />
			</>
		),
		teams: (
			<>
				<circle cx="9" cy="8" r="3" />
				<circle cx="17" cy="9" r="2" />
				<path d="M3 20c0-4 2.7-7 6-7s6 3 6 7M15 14c3 0 5 2.3 5 5" />
			</>
		),
		users: (
			<>
				<circle cx="12" cy="8" r="3.5" />
				<path d="M5 21c0-4.4 3.1-8 7-8s7 3.6 7 8" />
			</>
		)
	};

	return (
		<svg
			aria-hidden="true"
			className={className}
			fill="none"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.6"
			viewBox="0 0 24 24"
		>
			{paths[name]}
		</svg>
	);
}

function SidebarContent({
	onNavigate,
	userName
}: {
	onNavigate?: () => void;
	userName: string;
}) {
	return (
		<div className="flex h-full flex-col gap-5">
			<div className="flex items-center justify-between">
				<div className="flex min-w-0 items-center gap-2">
					<Image
						alt=""
						className="size-7 shrink-0 rounded-full bg-[#fe957b]"
						height={28}
						src="/images/admin-judging/avatar.png"
						width={28}
					/>
					<span className="truncate font-medium text-[#292929] text-base">
						{userName}
					</span>
				</div>
				<span aria-hidden="true" className="p-2 text-[#292929]">
					<Icon className="size-6" name="bell" />
				</span>
			</div>

			<nav aria-label="Admin navigation" className="flex flex-col gap-5">
				{navSections.map((section, sectionIndex) => (
					<div className="flex flex-col gap-4" key={section.label}>
						{sectionIndex > 0 ? <div className="h-px bg-[#d6d6d6]" /> : null}
						<p className="m-0 font-medium text-[#575757] text-[11px] leading-4">
							{section.label}
						</p>
						<ul className="m-0 flex list-none flex-col gap-1 p-0">
							{section.items.map((item) => (
								<li key={item.label}>
									<Link
										aria-current={"active" in item ? "page" : undefined}
										className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium text-sm transition-colors ${
											"active" in item
												? "bg-[#eae6ff] text-[#292929]"
												: "text-[#292929] hover:bg-[#f2f2f2]"
										}`}
										href={item.href}
										onClick={onNavigate}
									>
										<Icon className="size-5 shrink-0" name={item.icon} />
										<span>{item.label}</span>
									</Link>
								</li>
							))}
						</ul>
					</div>
				))}
			</nav>
		</div>
	);
}

function SelectField({
	children,
	disabled,
	label,
	onChange,
	value
}: {
	children: ReactNode;
	disabled?: boolean;
	label: string;
	onChange: (value: string) => void;
	value: string;
}) {
	return (
		<label className="flex w-full flex-col gap-2">
			<span className="pl-4 text-[#292929] text-sm leading-5">{label}</span>
			<span className="relative">
				<select
					className="h-12 w-full appearance-none rounded-xl border border-[#a5a5a5] bg-[#fcfcfc] py-2.5 pr-11 pl-4 text-[#292929] text-base outline-none transition focus:border-[#7054fd] focus:ring-2 focus:ring-[#eae6ff] disabled:cursor-not-allowed disabled:opacity-60"
					disabled={disabled}
					onChange={(event) => onChange(event.target.value)}
					value={value}
				>
					{children}
				</select>
				<Icon
					className="-translate-y-1/2 pointer-events-none absolute top-1/2 right-3 size-5 text-[#292929]"
					name="chevron"
				/>
			</span>
		</label>
	);
}

function buildTimeSlots(
	startTime: Date,
	endTime: Date,
	slotMinutes: SlotMinutes
) {
	const slots: Date[] = [];
	const start = startTime.getTime();
	const end = endTime.getTime();
	const slotMs = slotMinutes * 60 * 1000;

	for (
		let timestamp = start;
		timestamp < end && slots.length < 96;
		timestamp += slotMs
	) {
		slots.push(new Date(timestamp));
	}

	return slots;
}

function byNameThenId<T extends { id: string; name: string }>(a: T, b: T) {
	const nameSort = a.name.localeCompare(b.name);
	return nameSort || a.id.localeCompare(b.id);
}

function isPrescreenPassed(team: Team) {
	return team.prescreenStatus === "passed";
}

function calculateClientReadiness({
	assignments,
	judgeCount,
	roomCount,
	roundEnd,
	roundStart,
	slotMinutes,
	teamCount
}: {
	assignments: Assignment[];
	judgeCount: number;
	roomCount: number;
	roundEnd?: Date;
	roundStart?: Date;
	slotMinutes: SlotMinutes;
	teamCount: number;
}) {
	if (!roundStart || !roundEnd) {
		return {
			blockingReason: "Select a valid judging round before assigning rooms.",
			canAssign: false,
			freeSlotCount: 0,
			recommendedRoomCount: 1,
			slotCount: 0,
			totalJudgingMinutes: 0
		};
	}

	const slots = buildTimeSlots(roundStart, roundEnd, slotMinutes);
	const slotCount = slots.length;
	const safeRoomCount = Math.max(1, roomCount);
	const freeSlotCount = safeRoomCount * slotCount;
	const totalJudgingMinutes = Math.max(
		0,
		Math.floor((roundEnd.getTime() - roundStart.getTime()) / 60_000)
	);
	const scoredAssignmentCount = assignments.filter(
		(assignment) => assignment.scores.length > 0
	).length;
	const recommendedRoomCount =
		slotCount > 0 ? Math.max(1, Math.ceil(teamCount / slotCount)) : 1;

	let blockingReason = "";
	if (teamCount === 0) {
		blockingReason =
			"No prescreen-passed teams are available to assign. Pass teams from Admin → Teams first.";
	} else if (slotCount === 0 || totalJudgingMinutes < 1) {
		blockingReason = "The selected round has no available time slots.";
	} else if (judgeCount === 0) {
		blockingReason = "No judges found. Assign judge roles before scheduling.";
	} else if (safeRoomCount > judgeCount) {
		blockingReason = `Room count cannot be greater than the number of judges (${judgeCount}).`;
	} else if (freeSlotCount < teamCount) {
		blockingReason = `Need ${teamCount} slots for all passed teams, but this setup only has ${freeSlotCount}.`;
	} else if (scoredAssignmentCount > 0) {
		blockingReason =
			"This round already has scored assignments. Create a new round or clear scores before rebuilding the schedule.";
	}

	return {
		blockingReason,
		canAssign: !blockingReason,
		freeSlotCount,
		recommendedRoomCount,
		slotCount,
		totalJudgingMinutes
	};
}

function ScheduleGrid({
	assignments,
	isLoading,
	rooms,
	roundEnd,
	roundStart,
	slotMinutes
}: {
	assignments: Assignment[];
	isLoading: boolean;
	rooms: Room[];
	roundEnd?: Date;
	roundStart?: Date;
	slotMinutes: SlotMinutes;
}) {
	const slots = useMemo(
		() =>
			roundStart && roundEnd
				? buildTimeSlots(roundStart, roundEnd, slotMinutes)
				: [],
		[roundEnd, roundStart, slotMinutes]
	);

	if (isLoading) {
		return (
			<div
				aria-live="polite"
				className="flex min-h-56 items-center justify-center rounded-2xl bg-[#f2f2f2] text-[#575757]"
			>
				Loading schedule…
			</div>
		);
	}

	if (!roundStart || !roundEnd) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-[#a5a5a5] border-dashed px-6 text-center text-[#575757]">
				Select a judging round to view its schedule.
			</div>
		);
	}

	if (rooms.length === 0) {
		return (
			<div className="flex min-h-48 items-center justify-center rounded-2xl border border-[#a5a5a5] border-dashed px-6 text-center text-[#575757]">
				No rooms have been assigned for this round yet.
			</div>
		);
	}

	const scheduleStyle = {
		"--room-count": rooms.length
	} as CSSProperties;

	return (
		<div className="overflow-x-auto rounded-2xl">
			<div className={styles.scheduleGrid} style={scheduleStyle}>
				<div className={`${styles.scheduleHeader} rounded-tl-2xl`}>Times</div>
				{rooms.map((room, roomIndex) => (
					<div
						className={`${styles.scheduleHeader} ${
							roomIndex === rooms.length - 1 ? "rounded-tr-2xl" : ""
						}`}
						key={room.id}
					>
						{room.name}
					</div>
				))}

				{slots.map((slot, slotIndex) => {
					const slotEnd = slot.getTime() + slotMinutes * 60 * 1000;
					return (
						<div className="contents" key={slot.toISOString()}>
							<div
								className={`${styles.timeCell} ${
									slotIndex % 2 === 0 ? styles.timeCellMuted : ""
								} ${slotIndex === slots.length - 1 ? "rounded-bl-2xl" : ""}`}
							>
								{formatTime(slot)}
							</div>
							{rooms.map((room, roomIndex) => {
								const cellAssignments = assignments.filter((assignment) => {
									if (assignment.room.id !== room.id || !assignment.timeSlot) {
										return false;
									}
									const assignmentTime = new Date(
										assignment.timeSlot
									).getTime();
									return (
										assignmentTime >= slot.getTime() && assignmentTime < slotEnd
									);
								});

								return (
									<div
										className={`${styles.roomCell} ${
											slotIndex === slots.length - 1 &&
											roomIndex === rooms.length - 1
												? "rounded-br-2xl"
												: ""
										}`}
										key={`${slot.toISOString()}-${room.id}`}
									>
										{cellAssignments.map((assignment) => (
											<div
												className={styles.teamPill}
												key={assignment.id}
												title={assignment.team.name}
											>
												{assignment.team.name}
											</div>
										))}
									</div>
								);
							})}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export default function AdminJudgingDashboard({
	userName
}: {
	userName: string;
}) {
	const utils = api.useUtils();
	const [menuOpen, setMenuOpen] = useState(false);
	const [selectedRoundId, setSelectedRoundId] = useState("");
	const [selectedRoomId, setSelectedRoomId] = useState("all");
	const [roomCount, setRoomCount] = useState(1);
	const [slotMinutes, setSlotMinutes] = useState<SlotMinutes>(30);
	const [assignmentMessage, setAssignmentMessage] = useState("");

	const roundsQuery = api.judgingRounds.getAll.useQuery();
	const settingsQuery = api.hackathonSettings.get.useQuery();
	const defaultRoundId =
		settingsQuery.data?.currentRoundId ?? roundsQuery.data?.[0]?.id ?? "";

	useEffect(() => {
		if (!selectedRoundId && defaultRoundId) {
			setSelectedRoundId(defaultRoundId);
			setRoomCount(1);
			setAssignmentMessage("");
		}
	}, [defaultRoundId, selectedRoundId]);

	const layoutQuery = api.judgingRooms.getLayoutByRound.useQuery(
		{ roundId: selectedRoundId },
		{ enabled: Boolean(selectedRoundId) }
	);
	const assignmentsQuery = api.judgingAssignments.getByRound.useQuery(
		{ roundId: selectedRoundId },
		{ enabled: Boolean(selectedRoundId) }
	);
	const usersQuery = api.users.getAll.useQuery();
	const teamsQuery = api.teams.getAll.useQuery();

	const rooms = layoutQuery.data?.rooms ?? [];
	const assignments = assignmentsQuery.data ?? [];
	const judges = useMemo(
		() =>
			(usersQuery.data ?? [])
				.filter((person) => person.role === "judge")
				.sort(byNameThenId),
		[usersQuery.data]
	);
	const teams = useMemo(
		() => (teamsQuery.data ?? []).slice().sort(byNameThenId),
		[teamsQuery.data]
	);
	const eligibleTeams = useMemo(() => teams.filter(isPrescreenPassed), [teams]);
	const pendingTeamCount = teams.filter(
		(team) => !team.prescreenStatus || team.prescreenStatus === "pending"
	).length;
	const failedTeamCount = teams.filter(
		(team) => team.prescreenStatus === "failed"
	).length;
	const selectedRound = roundsQuery.data?.find(
		(round) => round.id === selectedRoundId
	);

	useEffect(() => {
		if (
			selectedRoomId !== "all" &&
			!rooms.some((room) => room.id === selectedRoomId)
		) {
			setSelectedRoomId("all");
		}
	}, [rooms, selectedRoomId]);

	const visibleRooms = useMemo(
		() =>
			selectedRoomId === "all"
				? rooms
				: rooms.filter((room) => room.id === selectedRoomId),
		[rooms, selectedRoomId]
	);
	const visibleAssignments = useMemo(
		() =>
			selectedRoomId === "all"
				? assignments
				: assignments.filter(
						(assignment) => assignment.room.id === selectedRoomId
					),
		[assignments, selectedRoomId]
	);
	const unscheduledCount = assignments.filter(
		(assignment) => !assignment.timeSlot
	).length;
	const readiness = useMemo(
		() =>
			calculateClientReadiness({
				assignments,
				judgeCount: judges.length,
				roomCount,
				roundEnd: selectedRound?.endTime,
				roundStart: selectedRound?.startTime,
				slotMinutes,
				teamCount: eligibleTeams.length
			}),
		[
			assignments,
			eligibleTeams.length,
			judges.length,
			roomCount,
			selectedRound?.endTime,
			selectedRound?.startTime,
			slotMinutes
		]
	);

	useEffect(() => {
		const recommendation = readiness.recommendedRoomCount;
		if (recommendation && roomCount < recommendation) {
			setRoomCount(recommendation);
		}
	}, [readiness.recommendedRoomCount, roomCount]);

	const generateSchedule = api.judgingRooms.generateSchedule.useMutation({
		onError: (error) => {
			setAssignmentMessage(error.message);
		},
		onSuccess: async (result) => {
			await Promise.all([
				utils.judgingRooms.getLayoutByRound.invalidate({
					roundId: selectedRoundId
				}),
				utils.judgingAssignments.getByRound.invalidate({
					roundId: selectedRoundId
				}),
				utils.judgingAssignments.getAll.invalidate()
			]);
			setSelectedRoomId("all");
			setAssignmentMessage(
				result.message ??
					`Assigned ${result.assignmentsCreated} teams across ${result.roomsCreated} room${result.roomsCreated === 1 ? "" : "s"}.`
			);
		}
	});

	const handleAutoAssign = () => {
		setAssignmentMessage("");
		if (!selectedRoundId) {
			setAssignmentMessage("Select a judging round before assigning rooms.");
			return;
		}

		if (!selectedRound?.startTime || !selectedRound.endTime) {
			setAssignmentMessage("The selected round is missing start or end time.");
			return;
		}

		if (!readiness.canAssign) {
			setAssignmentMessage(readiness.blockingReason);
			return;
		}

		if (
			(rooms.length > 0 || assignments.length > 0) &&
			!window.confirm(
				"This will replace the selected round's current unscored room layout and assignments. Continue?"
			)
		) {
			setAssignmentMessage("Assignment cancelled.");
			return;
		}

		generateSchedule.mutate({
			roundId: selectedRoundId,
			roomCount,
			slotDurationMinutes: slotMinutes,
			totalJudgingMinutes: readiness.totalJudgingMinutes
		});
	};

	const queryError =
		roundsQuery.error ??
		settingsQuery.error ??
		layoutQuery.error ??
		assignmentsQuery.error ??
		usersQuery.error ??
		teamsQuery.error;

	return (
		<div
			className="min-h-screen bg-[#fcfcfc] text-[#292929]"
			style={{ fontFamily: "var(--font-omnes), sans-serif" }}
		>
			<aside className="fixed inset-y-0 left-0 hidden w-[209px] border-[#d6d6d6] border-r bg-[#fafafa] py-4 pr-4 pl-4 lg:block">
				<SidebarContent userName={userName} />
			</aside>

			<header className="flex h-14 items-center justify-between bg-[#fcfcfc] px-6 py-1 lg:hidden">
				<button
					aria-expanded={menuOpen}
					aria-label="Open admin navigation"
					className="rounded-full p-2 text-[#7054fd] transition hover:bg-[#eae6ff]"
					onClick={() => setMenuOpen(true)}
					type="button"
				>
					<Icon className="size-6" name="menu" />
				</button>
				<span aria-hidden="true" className="p-2 text-[#292929]">
					<Icon className="size-6" name="bell" />
				</span>
			</header>

			{menuOpen ? (
				<div className="fixed inset-0 z-50 lg:hidden">
					<button
						aria-label="Close admin navigation"
						className="absolute inset-0 bg-black/25"
						onClick={() => setMenuOpen(false)}
						type="button"
					/>
					<aside className="relative h-full w-[280px] bg-[#fafafa] p-4 shadow-xl">
						<button
							aria-label="Close admin navigation"
							className="absolute top-3 right-3 rounded-full p-2 text-[#292929] hover:bg-[#eae6ff]"
							onClick={() => setMenuOpen(false)}
							type="button"
						>
							<Icon className="size-5" name="close" />
						</button>
						<div className="pt-11">
							<SidebarContent
								onNavigate={() => setMenuOpen(false)}
								userName={userName}
							/>
						</div>
					</aside>
				</div>
			) : null}

			<main className="flex flex-col gap-6 p-6 lg:ml-[209px]">
				<header>
					<h1 className="m-0 font-semibold text-[32px] leading-10">Judging</h1>
					<p className="m-0 text-[#575757] text-base leading-6">
						View judging schedule, rooms, assign teams to rooms, etc.
					</p>
				</header>

				<section className="relative flex min-h-[299px] flex-col overflow-hidden rounded-2xl bg-[#7054fd] p-6 text-white sm:block sm:min-h-[148px]">
					<div className="relative z-10 max-w-[400px]">
						<h2 className="m-0 font-semibold text-[28px] leading-9">
							Release Scores to Teams
						</h2>
						<p className="mt-4 mb-0 max-w-[400px] text-base leading-6">
							Let participants know how they scored in their projects now that
							the hackathon has ended!
						</p>
					</div>

					<div className="pointer-events-none absolute inset-x-0 bottom-[-34px] h-[174px] sm:inset-auto sm:top-[-70px] sm:right-0 sm:h-[260px] sm:w-[520px]">
						<Image
							alt=""
							className="-rotate-[4deg] absolute bottom-[-8px] left-0 h-[165px] w-[165px] object-contain sm:top-0 sm:left-0 sm:h-[250px] sm:w-[250px]"
							height={250}
							src="/images/admin-judging/gift.png"
							width={250}
						/>
						<Image
							alt=""
							className="absolute right-[-16px] bottom-[-8px] h-[155px] w-[155px] rotate-[9deg] object-contain sm:top-8 sm:right-2 sm:h-[230px] sm:w-[230px]"
							height={230}
							src="/images/admin-judging/trophy.png"
							width={230}
						/>
					</div>

					<button
						className="absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-xl bg-[#f7f5ff] px-4 py-2.5 font-medium text-[#2911a7] text-base shadow-[0_0_0.25px_rgba(0,0,0,0.18),0_1px_1.5px_rgba(0,0,0,0.1),0_3px_4px_rgba(0,0,0,0.1)] transition hover:bg-white sm:top-5 sm:right-5 sm:bottom-auto sm:left-auto"
						type="button"
					>
						Release scores
						<Icon className="size-5" name="arrow" />
					</button>
				</section>

				<section className="flex flex-col gap-4" id="judging-schedule">
					<h2 className="m-0 font-medium text-[22px] leading-7">
						Judging Schedule
					</h2>

					<div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-4">
						<div className="w-full sm:w-64">
							<SelectField
								disabled={!selectedRoundId || layoutQuery.isLoading}
								label="Room Selection"
								onChange={setSelectedRoomId}
								value={selectedRoomId}
							>
								<option value="all">All</option>
								{rooms.map((room) => (
									<option key={room.id} value={room.id}>
										{room.name}
									</option>
								))}
							</SelectField>
						</div>
						<div className="w-full sm:w-64">
							<SelectField
								disabled={roundsQuery.isLoading}
								label="Round"
								onChange={(value) => {
									setSelectedRoundId(value);
									setSelectedRoomId("all");
									setRoomCount(1);
									setAssignmentMessage("");
								}}
								value={selectedRoundId}
							>
								<option disabled value="">
									Select a round
								</option>
								{(roundsQuery.data ?? []).map((round) => (
									<option key={round.id} value={round.id}>
										{round.name}
									</option>
								))}
							</SelectField>
						</div>
					</div>

					{queryError ? (
						<p className="m-0 rounded-xl bg-red-50 px-4 py-3 text-red-700">
							Schedule data could not be loaded: {queryError.message}
						</p>
					) : (
						<ScheduleGrid
							assignments={visibleAssignments}
							isLoading={
								roundsQuery.isLoading ||
								layoutQuery.isLoading ||
								assignmentsQuery.isLoading
							}
							rooms={visibleRooms}
							roundEnd={selectedRound?.endTime}
							roundStart={selectedRound?.startTime}
							slotMinutes={slotMinutes}
						/>
					)}

					{unscheduledCount > 0 ? (
						<p className="m-0 text-[#575757] text-sm">
							{unscheduledCount}{" "}
							{unscheduledCount === 1 ? "assignment has" : "assignments have"}{" "}
							no time slot and cannot appear in the grid.
						</p>
					) : null}
				</section>

				<section className="mt-6 flex flex-col gap-4">
					<h2 className="m-0 font-medium text-[22px] leading-7">
						Assign teams to rooms
					</h2>
					<div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
						<label className="flex flex-1 flex-col gap-2">
							<span className="pl-4 text-sm leading-5">Number of rooms</span>
							<input
								className="h-12 rounded-xl border border-[#a5a5a5] bg-[#fcfcfc] px-4 text-base outline-none transition focus:border-[#7054fd] focus:ring-2 focus:ring-[#eae6ff]"
								max={20}
								min={1}
								onChange={(event) =>
									setRoomCount(Number.parseInt(event.target.value, 10) || 1)
								}
								type="number"
								value={roomCount}
							/>
						</label>
						<label className="flex flex-1 flex-col gap-2">
							<span className="pl-4 text-sm leading-5">Slot duration</span>
							<select
								className="h-12 rounded-xl border border-[#a5a5a5] bg-[#fcfcfc] px-4 text-base outline-none transition focus:border-[#7054fd] focus:ring-2 focus:ring-[#eae6ff]"
								onChange={(event) => {
									setSlotMinutes(
										Number.parseInt(event.target.value, 10) as SlotMinutes
									);
									setRoomCount(1);
									setAssignmentMessage("");
								}}
								value={slotMinutes}
							>
								<option value={15}>15 minutes</option>
								<option value={30}>30 minutes</option>
								<option value={60}>60 minutes</option>
							</select>
						</label>
					</div>

					<div className="grid gap-3 rounded-2xl bg-[#f7f5ff] p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
						<div>
							<span className="block text-[#575757]">Passed teams</span>
							<strong className="text-base">
								{teamsQuery.isLoading
									? "—"
									: `${eligibleTeams.length} of ${teams.length}`}
							</strong>
						</div>
						<div>
							<span className="block text-[#575757]">Judges</span>
							<strong className="text-base">
								{usersQuery.isLoading ? "—" : `${judges.length} available`}
							</strong>
						</div>
						<div>
							<span className="block text-[#575757]">Free slots</span>
							<strong className="text-base">
								{readiness.freeSlotCount || "—"}
							</strong>
						</div>
						<div>
							<span className="block text-[#575757]">Suggested rooms</span>
							<strong className="text-base">
								{readiness.recommendedRoomCount || "—"}
							</strong>
						</div>
					</div>

					<p className="m-0 text-[#575757] text-sm">
						{teamsQuery.isLoading
							? "Loading team prescreen status…"
							: `${eligibleTeams.length} teams passed prescreening (${pendingTeamCount} pending, ${failedTeamCount} failed). Only passed teams are scheduled.`}
					</p>

					<div className="flex flex-col items-end gap-2">
						<button
							className="rounded-xl bg-[#7054fd] px-4 py-2.5 font-medium text-base text-white transition hover:bg-[#6044ed] disabled:cursor-not-allowed disabled:opacity-60"
							disabled={
								!selectedRoundId ||
								generateSchedule.isPending ||
								roundsQuery.isLoading ||
								layoutQuery.isLoading ||
								assignmentsQuery.isLoading ||
								usersQuery.isLoading ||
								teamsQuery.isLoading ||
								!readiness.canAssign
							}
							onClick={handleAutoAssign}
							type="button"
						>
							{generateSchedule.isPending ? "Assigning…" : "Assign to rooms"}
						</button>
						<p
							aria-live="polite"
							className="m-0 min-h-5 text-right text-[#575757] text-sm"
						>
							{assignmentMessage ||
								readiness.blockingReason ||
								(usersQuery.isLoading || teamsQuery.isLoading
									? "Checking assignment capacity…"
									: "")}
						</p>
					</div>
				</section>

				<JudgingManagementSections
					onSelectRound={(roundId) => {
						setSelectedRoundId(roundId);
						setSelectedRoomId("all");
						setRoomCount(1);
						setAssignmentMessage("");
					}}
					selectedRoundId={selectedRoundId}
					slotMinutes={slotMinutes}
				/>
			</main>
		</div>
	);
}
