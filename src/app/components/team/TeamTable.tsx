import { AddFill, Edit2Line, ExitLine, Group3Line } from "@mingcute/react";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { getInitials } from "@/lib/names";

export type TeamMember = {
	id: string;
	name: string;
	email: string;
	avatarSrc: string;
	isYou: boolean;
};

function MemberAvatar({ name, src }: { name: string; src: string }) {
	return (
		<Avatar className="size-12" size="lg">
			<AvatarImage alt={`${name}'s avatar`} src={src} />
			<AvatarFallback className="bg-grey-200 text-grey-600">
				{getInitials(name)}
			</AvatarFallback>
		</Avatar>
	);
}

function MemberRow({
	member,
	onLeave
}: {
	member: TeamMember;
	onLeave: () => void;
}) {
	return (
		<div className="flex gap-4 border-t-2 px-5 py-5 sm:items-center">
			<MemberAvatar name={member.name} src={member.avatarSrc} />
			<div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<p className="truncate font-medium">{member.name}</p>
						{member.isYou && (
							<Badge className="shrink-0 text-xs uppercase">YOU</Badge>
						)}
					</div>
					<p className="truncate text-muted-foreground text-xs">
						{member.email}
					</p>
				</div>

				<div className="flex justify-end sm:block sm:shrink-0">
					{member.isYou && (
						<Button
							className="hover:bg-destructive/10 hover:text-destructive"
							onClick={onLeave}
							size="sm"
							variant="ghost"
						>
							<ExitLine data-icon="inline-start" />
							Leave team
						</Button>
					)}
				</div>
			</div>
		</div>
	);
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

	return (
		<button
			className="flex h-auto w-full cursor-pointer items-center justify-start gap-4 border-t-2 px-5 py-5 transition-color duration-150 ease-out hover:bg-muted"
			disabled={isFull}
			onClick={onInvite}
			type="button"
		>
			<span className="grid size-10 shrink-0 place-items-center rounded-lg bg-purple-100 text-purple-800">
				<AddFill className="size-4" />
			</span>
			<span className="text-left font-medium text-purple-800">
				Invite team member
			</span>
		</button>
	);
}

interface TeamTableProps {
	teamName: string;
	members: TeamMember[];
	maxMembers: number;
	canEditName: boolean;
	onEditName: () => void;
	onInvite: () => void;
	onLeave: () => void;
}

export default function TeamTable({
	teamName,
	members,
	maxMembers,
	canEditName,
	onEditName,
	onInvite,
	onLeave
}: TeamTableProps) {
	return (
		<div className="w-full overflow-hidden rounded-xl border-2">
			<div className="flex flex-col gap-4 bg-purple-50 p-6 sm:flex-row sm:items-start sm:justify-between">
				<div className="flex items-center gap-3">
					<span className="grid size-14 shrink-0 place-items-center rounded-xl bg-purple-500 text-white">
						<Group3Line className="size-7" />
					</span>
					<div className="flex flex-col gap-0.5">
						<h2 className="font-medium text-3xl text-grey-800 leading-9">
							{teamName}
						</h2>
						<p className="font-medium text-muted-foreground text-xs uppercase">
							{members.length}/{maxMembers} Members
						</p>
					</div>
				</div>

				{canEditName && (
					<Button
						aria-label="Edit team name"
						className="hover:bg-purple-100"
						onClick={onEditName}
						size="icon-lg"
						variant="ghost"
					>
						<Edit2Line />
					</Button>
				)}
			</div>

			<div>
				{members.map((member) => (
					<MemberRow key={member.id} member={member} onLeave={onLeave} />
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
