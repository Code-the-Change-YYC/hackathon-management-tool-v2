"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { EditIcon } from "@/app/components/layout/icons";
import {
	Modal,
	ModalHeader,
	PrimaryButton,
	SecondaryButton
} from "@/app/components/team/Modal";
import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import { Button } from "@/app/components/ui/button";
import { FieldLabel } from "@/app/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
import { Spinner } from "@/app/components/ui/spinner";
import {
	AVATAR_IDS,
	AVATAR_LABELS,
	type AvatarId,
	getAvatarId,
	getAvatarSrc,
	isAvatarId
} from "@/lib/avatars";
import { api } from "@/trpc/react";

export function AvatarPicker({
	currentAvatarSrc
}: {
	currentAvatarSrc: string;
}) {
	const router = useRouter();
	const currentAvatarId = getAvatarId(currentAvatarSrc);
	const [open, setOpen] = useState(false);
	const [selectedAvatarId, setSelectedAvatarId] = useState(currentAvatarId);
	const [isRefreshing, startTransition] = useTransition();
	const updateAvatar = api.users.updateAvatar.useMutation();

	const isSaving = updateAvatar.isPending || isRefreshing;
	const hasChanges = selectedAvatarId !== currentAvatarId;
	const previewSrc = selectedAvatarId
		? getAvatarSrc(selectedAvatarId)
		: currentAvatarSrc;

	function openPicker() {
		setSelectedAvatarId(currentAvatarId);
		setOpen(true);
	}

	function cancel() {
		if (isSaving) return;
		setOpen(false);
		if (hasChanges) toast("Cancelled changes");
	}

	function save() {
		if (!selectedAvatarId) return;
		updateAvatar.mutate(
			{ avatarId: selectedAvatarId },
			{
				onError: () => {
					toast.error("We couldn't update your profile picture. Try again.");
				},
				onSuccess: () => {
					toast.success("Profile picture was updated");
					// Close once the refreshed avatar is ready so nothing flickers.
					startTransition(() => {
						router.refresh();
						setOpen(false);
					});
				}
			}
		);
	}

	return (
		<>
			<Button
				aria-label="Change avatar"
				className="rounded-full bg-background text-primary hover:text-primary"
				onClick={openPicker}
				size="icon-xs"
				variant="ghost"
			>
				<EditIcon />
			</Button>

			<Modal onClose={cancel} open={open}>
				<ModalHeader title="Choose your avatar" />

				<div className="flex flex-col">
					<div className="flex flex-col items-center gap-2 rounded-xl bg-grey-00 bg-linear-to-b from-green-100/25 via-60% via-purple-100/25 to-red-200/25 py-6">
						<Avatar className="size-22">
							<AvatarImage alt="Selected avatar" src={previewSrc} />
							<AvatarFallback />
						</Avatar>
						<p className="font-medium text-[13px] text-grey-600 leading-4.5">
							Preview
						</p>
					</div>

					<RadioGroup
						aria-label="Avatars"
						className="flex flex-wrap justify-center gap-3 py-5 sm:px-5"
						onValueChange={(value) => {
							if (isAvatarId(value)) setSelectedAvatarId(value);
						}}
						value={selectedAvatarId ?? null}
					>
						{AVATAR_IDS.map((avatarId) => (
							<AvatarOption avatarId={avatarId} key={avatarId} />
						))}
					</RadioGroup>
				</div>

				<div className="flex flex-col gap-4">
					<PrimaryButton
						disabled={!hasChanges || isSaving}
						onClick={save}
						type="button"
					>
						{isSaving && <Spinner data-icon="inline-start" />}
						Save changes
					</PrimaryButton>
					<SecondaryButton disabled={isSaving} onClick={cancel} type="button">
						Cancel
					</SecondaryButton>
				</div>
			</Modal>
		</>
	);
}

function AvatarOption({ avatarId }: { avatarId: AvatarId }) {
	const id = `avatar-option-${avatarId}`;
	const label = AVATAR_LABELS[avatarId];

	return (
		<FieldLabel
			className="relative rounded-full ring-offset-2 ring-offset-grey-50 transition-transform hover:scale-105 has-focus-visible:outline-2 has-focus-visible:outline-ring has-focus-visible:outline-offset-4 has-data-checked:ring-2 has-data-checked:ring-primary"
			htmlFor={id}
		>
			<Avatar className="size-12">
				<AvatarImage alt="" src={getAvatarSrc(avatarId)} />
				<AvatarFallback />
			</Avatar>
			{/* The radio stays invisible on top of the avatar so it keeps receiving clicks and focus. */}
			<RadioGroupItem
				aria-label={label}
				className="absolute inset-0 size-full opacity-0"
				id={id}
				value={avatarId}
			/>
		</FieldLabel>
	);
}
