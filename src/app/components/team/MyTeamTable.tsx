import {
	EditIcon,
	LeaveIcon,
	MailIcon,
	PlusIcon,
	TeamIcon
} from "@/app/components/layout/icons";

export type TeamMember = {
	id: string;
	name: string;
	email: string;
	isYou: boolean;
};

function Avatar() {
	return <span className="size-12 shrink-0 rounded-full bg-grey-200" />;
}

function InviteRow({
	memberCount,
	maxMembers,
	onInvite
}: {
	memberCount: number;
	maxMembers: number;
	onInvite: () => void;
}) {
	const isFull = memberCount >= maxMembers;
	const isAlone = memberCount <= 1;

	// Per Figma interaction spec, only the colors change between states; the
	// label text stays the same. Full (5 members) disables the button and dims
	// it to grey; alone (1 member) turns it orange to prompt inviting a teammate.
	let iconBg = "bg-purple-50 text-purple-800";
	let titleColor = "text-purple-800";
	let subtitleColor = "text-grey-600";
	if (isFull) {
		iconBg = "bg-grey-100 text-grey-300";
		titleColor = "text-grey-300";
		subtitleColor = "text-grey-200";
	} else if (isAlone) {
		iconBg = "bg-orange-50 text-orange-800";
		titleColor = "text-orange-800";
	}

	return (
		<button
			className="flex w-full items-center gap-4 border-grey-300 border-t bg-grey-00 px-5 py-5 text-left transition enabled:hover:bg-grey-50 disabled:cursor-not-allowed"
			disabled={isFull}
			onClick={onInvite}
			type="button"
		>
			<span
				className={`grid size-12 shrink-0 place-items-center rounded-lg ${iconBg}`}
			>
				<PlusIcon className="size-6" />
			</span>
			<span className="flex flex-col gap-1">
				<span className={`font-medium text-[16px] leading-6 ${titleColor}`}>
					Invite Team Member
				</span>
				<span className={`text-[12px] leading-4 ${subtitleColor}`}>
					Invite someone to join your team
				</span>
			</span>
		</button>
	);
}

export default function MyTeamTable({
	teamName,
	members,
	maxMembers,
	canEditName,
	onEditName,
	onInvite,
	onLeave
}: {
	teamName: string;
	members: TeamMember[];
	maxMembers: number;
	canEditName: boolean;
	onEditName: () => void;
	onInvite: () => void;
	onLeave: () => void;
}) {
	return (
		<div className="w-full overflow-clip rounded-[12px] border-2 border-grey-300 p-[2px]">
			<div className="flex flex-col gap-4 bg-purple-50 p-6 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-center gap-3">
					<span className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-purple-500 text-white">
						<TeamIcon className="size-6" />
					</span>
					<div className="flex flex-col">
						<p className="font-medium text-[11px] text-purple-500 uppercase tracking-[0.55px]">
							Your Team
						</p>
						<p className="font-semibold text-[28px] text-grey-800 leading-9 tracking-[-0.7px]">
							{teamName}
						</p>
						<p className="font-medium text-[11px] text-grey-600 uppercase tracking-[0.55px]">
							{members.length}/{maxMembers} Members
						</p>
					</div>
				</div>

				{canEditName && (
					<button
						className="flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 font-medium text-[14px] text-grey-800 transition hover:bg-purple-100"
						onClick={onEditName}
						type="button"
					>
						Edit team name
						<EditIcon className="size-5" />
					</button>
				)}
			</div>

			<div className="border-grey-300 border-t bg-grey-50">
				{members.map((m) => (
					<div
						className="flex gap-4 border-grey-300 border-b bg-grey-00 px-5 py-5 sm:items-center"
						key={m.id}
					>
						<Avatar />
						<div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<div className="flex items-center gap-2">
									<p className="truncate font-medium text-[16px] text-grey-800 leading-6">
										{m.name}
									</p>
									{m.isYou && (
										<span className="shrink-0 rounded-full bg-purple-500 px-2 font-medium text-[11px] text-white leading-4">
											YOU
										</span>
									)}
								</div>
								<div className="flex items-center gap-1 text-grey-600">
									<MailIcon className="size-4 shrink-0" />
									<p className="truncate text-[12px] leading-4">{m.email}</p>
								</div>
							</div>

							<div className="flex justify-end sm:block sm:shrink-0">
								{m.isYou ? (
									<button
										className="flex items-center gap-1 rounded-full px-3 py-1.5 font-medium text-[14px] text-orange-800 transition hover:bg-orange-50"
										onClick={onLeave}
										type="button"
									>
										<LeaveIcon className="size-5" />
										Leave team
									</button>
								) : (
									<span className="px-3 py-1.5 font-medium text-[14px] text-grey-400">
										Member
									</span>
								)}
							</div>
						</div>
					</div>
				))}

				<InviteRow
					maxMembers={maxMembers}
					memberCount={members.length}
					onInvite={onInvite}
				/>
			</div>
		</div>
	);
}
