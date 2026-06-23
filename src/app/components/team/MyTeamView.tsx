"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/trpc/react";
import InviteCodeModal from "./InviteCodeModal";
import JoinCodeModal from "./JoinCodeModal";
import JoinedSuccessModal from "./JoinedSuccessModal";
import LeaveTeamModal from "./LeaveTeamModal";
import MyTeamTable, { type TeamMember } from "./MyTeamTable";
import NoTeamBanner from "./NoTeamBanner";
import SituationModal, { type Situation } from "./SituationModal";

type ModalKind = null | "situation" | "invite" | "join" | "joined" | "leave";

type ViewTeam = {
	name: string;
	teamCode: string;
	maxMembers: number;
	isOwner: boolean;
	members: TeamMember[];
};

// Sample data so every screen can be previewed while the surrounding app and
// real membership data are still WIP.
const SAMPLE_TEAM: ViewTeam = {
	name: "Code Wizards",
	teamCode: "1X3J56",
	maxMembers: 5,
	isOwner: true,
	members: [
		{
			id: "1",
			name: "Victoria Wong",
			email: "victoria@email.com",
			isYou: true
		},
		{
			id: "2",
			name: "Fiona Truong",
			email: "fionat12345@email.com",
			isYou: false
		},
		{ id: "3", name: "Grace Ilori", email: "gracei15@email.com", isYou: false }
	]
};

export default function MyTeamView() {
	const router = useRouter();
	const utils = api.useUtils();
	const { data: team, isLoading } = api.teams.getMyTeam.useQuery();

	const [modal, setModal] = useState<ModalKind>(null);
	const [joinError, setJoinError] = useState<string | null>(null);
	const [joinedTeamName, setJoinedTeamName] = useState("");
	const [previewTeam, setPreviewTeam] = useState(false);

	const joinMutation = api.teams.join.useMutation({
		onSuccess: async (joined) => {
			setJoinError(null);
			setJoinedTeamName(joined.name);
			setModal("joined");
			await utils.teams.getMyTeam.invalidate();
		},
		onError: (error) => {
			setJoinError(
				error.data?.code === "NOT_FOUND"
					? "No team was found. Please check the code and try again."
					: error.message
			);
		}
	});

	const leaveMutation = api.teams.leave.useMutation({
		onSuccess: async () => {
			setModal(null);
			await utils.teams.getMyTeam.invalidate();
		}
	});

	const viewTeam: ViewTeam | null = team
		? {
				name: team.name,
				teamCode: team.teamCode ?? "------",
				maxMembers: team.maxMembers,
				isOwner: team.myRole === "owner",
				members: team.members.map((m) => ({
					id: m.id,
					name: m.name,
					email: m.email,
					isYou: m.isYou
				}))
			}
		: previewTeam
			? SAMPLE_TEAM
			: null;

	function handleSituation(situation: Situation) {
		if (situation === "registered") {
			setJoinError(null);
			setModal("join");
			return;
		}
		if (situation === "unregistered") {
			router.push("/team/register");
			return;
		}
		// "no-team": point them at the community to find teammates.
		window.open("https://discord.gg/codethechangeyyc", "_blank");
		setModal(null);
	}

	return (
		<div className="flex flex-col gap-6 p-6">
			<div>
				<h1 className="font-semibold text-[32px] text-grey-800 leading-10">
					My Team
				</h1>
				<p className="font-medium text-[14px] text-grey-600 leading-5">
					Your team name and members
				</p>
			</div>

			{isLoading ? (
				<div className="h-40 w-full animate-pulse rounded-[12px] bg-grey-100" />
			) : viewTeam ? (
				<MyTeamTable
					canEditName={viewTeam.isOwner}
					maxMembers={viewTeam.maxMembers}
					members={viewTeam.members}
					onEditName={() => undefined}
					onInvite={() => setModal("invite")}
					onLeave={() => setModal("leave")}
					teamName={viewTeam.name}
				/>
			) : (
				<NoTeamBanner onAction={() => setModal("situation")} />
			)}

			<TestingShortcuts
				onOpen={(kind) => {
					setJoinError(null);
					setModal(kind);
				}}
				onTogglePreview={() => setPreviewTeam((v) => !v)}
				previewTeam={previewTeam}
			/>

			<SituationModal
				onClose={() => setModal(null)}
				onContinue={handleSituation}
				open={modal === "situation"}
			/>
			<InviteCodeModal
				code={viewTeam?.teamCode ?? SAMPLE_TEAM.teamCode}
				onClose={() => setModal(null)}
				open={modal === "invite"}
			/>
			<JoinCodeModal
				error={joinError}
				loading={joinMutation.isPending}
				onClose={() => setModal(null)}
				onSubmit={(code) => joinMutation.mutate({ teamCode: code })}
				open={modal === "join"}
			/>
			<JoinedSuccessModal
				onFinish={() => setModal(null)}
				open={modal === "joined"}
				teamName={joinedTeamName || viewTeam?.name || SAMPLE_TEAM.name}
			/>
			<LeaveTeamModal
				loading={leaveMutation.isPending}
				onCancel={() => setModal(null)}
				onConfirm={() => leaveMutation.mutate({ confirmDelete: true })}
				open={modal === "leave"}
				teamName={viewTeam?.name ?? SAMPLE_TEAM.name}
			/>
		</div>
	);
}

function TestingShortcuts({
	onOpen,
	onTogglePreview,
	previewTeam
}: {
	onOpen: (kind: Exclude<ModalKind, null>) => void;
	onTogglePreview: () => void;
	previewTeam: boolean;
}) {
	const buttons: { label: string; kind: Exclude<ModalKind, null> }[] = [
		{ label: "Situation", kind: "situation" },
		{ label: "Invite code", kind: "invite" },
		{ label: "Join code", kind: "join" },
		{ label: "Joined success", kind: "joined" },
		{ label: "Leave team", kind: "leave" }
	];

	return (
		<div className="flex flex-col gap-2 rounded-[12px] border border-grey-300 border-dashed p-4">
			<p className="font-medium text-[11px] text-grey-600 uppercase tracking-wide">
				Testing shortcuts (WIP)
			</p>
			<div className="flex flex-wrap gap-2">
				<button
					className="rounded-lg border border-grey-300 px-3 py-1.5 font-medium text-[12px] text-grey-800 transition hover:bg-grey-100"
					onClick={onTogglePreview}
					type="button"
				>
					{previewTeam ? "Hide sample team" : "Show sample team"}
				</button>
				{buttons.map((b) => (
					<button
						className="rounded-lg border border-grey-300 px-3 py-1.5 font-medium text-[12px] text-grey-800 transition hover:bg-grey-100"
						key={b.kind}
						onClick={() => onOpen(b.kind)}
						type="button"
					>
						{b.label}
					</button>
				))}
			</div>
		</div>
	);
}
