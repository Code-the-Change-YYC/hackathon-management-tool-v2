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
		<Avatar size="lg">
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
		<div className="flex @md:items-center @md:gap-4 gap-3 border-t-2 p-4 @md:px-5 @md:py-5">
			<MemberAvatar name={member.name} src={member.avatarSrc} />
			<div className="flex min-w-0 flex-1 @md:flex-row flex-col @md:items-center @md:gap-4 gap-2">
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<p className="wrap-break-word min-w-0 font-medium">{member.name}</p>
						{member.isYou && (
							<Badge className="shrink-0 text-xs uppercase">YOU</Badge>
						)}
					</div>
					<p
						className="truncate text-muted-foreground text-xs"
						title={member.email}
					>
						{member.email}
					</p>
				</div>

				{member.isYou && (
					<Button
						className="-ml-3 @md:ml-0 @md:self-auto self-start hover:bg-destructive/10 hover:text-destructive"
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
			className="flex h-auto w-full cursor-pointer items-center justify-start @md:gap-4 gap-3 border-t-2 p-4 @md:px-5 @md:py-5 transition-color duration-150 ease-out hover:bg-muted"
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
		// The grid's minmax(0, 1fr) column stops long emails from widening the page.
		<div className="@container grid w-full grid-cols-1 overflow-hidden rounded-xl border-2">
			<div className="flex items-start justify-between @md:gap-4 gap-3 bg-purple-50 @md:p-6 p-4">
				<div className="flex min-w-0 items-center gap-3">
					<span className="grid @md:size-14 size-11 shrink-0 place-items-center @md:rounded-xl rounded-lg bg-purple-500 text-white">
						<Group3Line className="@md:size-7 size-6" />
					</span>
					<div className="flex min-w-0 flex-col gap-0.5">
						<h2 className="wrap-break-word font-medium @md:text-2xl @xl:text-3xl text-grey-800 text-xl @md:leading-8 @xl:leading-9 leading-7">
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
						className="shrink-0 hover:bg-purple-100"
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
