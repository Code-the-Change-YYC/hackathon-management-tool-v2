"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "@/app/components/ui/select";
import type { Role } from "@/types/types";
import { ROLE_OPTIONS } from "./types";

type InviteUserDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function InviteUserDialog({
	open,
	onOpenChange
}: InviteUserDialogProps) {
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<Role | null>(null);

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			setEmail("");
			setRole(null);
		}
		onOpenChange(nextOpen);
	}

	function handleInvite() {
		// TODO: actually send an invitation.
		toast.success("Invitation sent!");
		handleOpenChange(false);
	}

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogContent className="sm:max-w-sm">
				<DialogHeader>
					<DialogTitle className="text-lg">Invite a user</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldLabel htmlFor="invite-email">Type user email</FieldLabel>
						<Input
							id="invite-email"
							onChange={(event) => setEmail(event.target.value)}
							placeholder="User email"
							type="email"
							value={email}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="invite-role">Select user role</FieldLabel>
						<Select
							items={ROLE_OPTIONS}
							onValueChange={(value) => setRole(value as Role)}
							value={role}
						>
							<SelectTrigger className="w-full" id="invite-role">
								<SelectValue placeholder="User role" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									{ROLE_OPTIONS.map((option) => (
										<SelectItem key={option.value} value={option.value}>
											{option.label}
										</SelectItem>
									))}
								</SelectGroup>
							</SelectContent>
						</Select>
					</Field>
				</FieldGroup>
				<div className="flex flex-col gap-2">
					<Button
						disabled={email.trim().length === 0 || role === null}
						onClick={handleInvite}
					>
						Invite user
					</Button>
					<DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
}
