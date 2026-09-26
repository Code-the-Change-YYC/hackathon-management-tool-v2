"use client";

import { CloseLine } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import {
	Field,
	FieldGroup,
	FieldLabel,
	FieldTitle
} from "@/app/components/ui/field";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { cn } from "@/lib/utils";

const RECIPIENT_GROUPS = [
	"Participants",
	"Registered for food",
	"Not registered for food",
	"Admin",
	"Judges"
];

const DEFAULT_MESSAGE = "Type your email here";

type SendEmailDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function SendEmailDialog({ open, onOpenChange }: SendEmailDialogProps) {
	const [recipients, setRecipients] = useState<string[]>([]);
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");

	function toggleRecipient(group: string) {
		setRecipients((current) =>
			current.includes(group)
				? current.filter((item) => item !== group)
				: [...current, group]
		);
	}

	function handleSend() {
		// TODO: actually send an email.
		toast.success("Email sent!");
		onOpenChange(false);
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-lg">Send an email</DialogTitle>
				</DialogHeader>
				<FieldGroup>
					<Field>
						<FieldTitle>To:</FieldTitle>
						<div className="flex flex-wrap gap-1.5">
							{RECIPIENT_GROUPS.map((group) => {
								const selected = recipients.includes(group);

								return (
									<Badge
										aria-pressed={selected}
										className={cn(
											"h-7 cursor-pointer px-2.5",
											!selected && "text-muted-foreground"
										)}
										key={group}
										render={
											<button
												onClick={() => toggleRecipient(group)}
												type="button"
											/>
										}
										variant={selected ? "default" : "outline"}
									>
										{group}
										{selected ? <CloseLine /> : null}
									</Badge>
								);
							})}
						</div>
					</Field>
					<Field>
						<FieldLabel htmlFor="email-subject">Subject</FieldLabel>
						<Input
							id="email-subject"
							onChange={(event) => setSubject(event.target.value)}
							placeholder="Subject"
							value={subject}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="email-message">Write a message</FieldLabel>
						<Textarea
							className="min-h-32"
							id="email-message"
							onChange={(event) => setMessage(event.target.value)}
							placeholder={DEFAULT_MESSAGE}
							value={message}
						/>
					</Field>
				</FieldGroup>
				<div className="flex flex-col gap-2">
					<Button
						disabled={recipients.length === 0 || subject.trim().length === 0}
						onClick={handleSend}
					>
						Send email
					</Button>
					<DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
				</div>
			</DialogContent>
		</Dialog>
	);
}
