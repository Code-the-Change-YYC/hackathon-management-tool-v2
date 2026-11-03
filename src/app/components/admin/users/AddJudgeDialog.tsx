"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TextField } from "@/app/components/forms/TextField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { FieldGroup } from "@/app/components/ui/field";
import { useRefresh } from "@/hooks/use-refresh";
import { getFullName } from "@/lib/names";
import {
	type AddJudgeInput,
	type AddJudgeValues,
	addJudgeSchema
} from "@/lib/validation/judge";
import { NAME_MAX_LENGTH } from "@/lib/validation/profile";
import { api } from "@/trpc/react";

const EMPTY_JUDGE: AddJudgeInput = { firstName: "", lastName: "", email: "" };

type AddedJudge = {
	id: string;
	name: string;
	email: string;
	emailSent: boolean;
};

export function AddJudgeDialog({ onClose }: { onClose: () => void }) {
	const { isRefreshing, refresh } = useRefresh();
	const [added, setAdded] = useState<AddedJudge | null>(null);
	const form = useForm<AddJudgeInput, unknown, AddJudgeValues>({
		defaultValues: EMPTY_JUDGE,
		resolver: zodResolver(addJudgeSchema)
	});

	const createJudge = api.judges.create.useMutation({
		onSuccess: ({ id, emailSent }, values) =>
			refresh(() =>
				setAdded({
					id,
					name: getFullName(values.firstName, values.lastName),
					email: values.email,
					emailSent
				})
			),
		onError: (error) => {
			if (error.data?.code === "CONFLICT") {
				form.setError(
					"email",
					{ message: error.message },
					{ shouldFocus: true }
				);
			} else {
				toast.error(error.message);
			}
		}
	});
	const resendEmail = api.judges.resendAccessEmail.useMutation({
		onSuccess: () => {
			setAdded((current) => current && { ...current, emailSent: true });
			toast.success("Access email sent.");
		},
		onError: (error) => toast.error(error.message)
	});
	const isPending = createJudge.isPending || isRefreshing;

	function addAnother() {
		form.reset(EMPTY_JUDGE);
		setAdded(null);
	}

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-md">
				{added ? (
					<>
						<DialogHeader>
							<DialogTitle>Judge added</DialogTitle>
							<DialogDescription>
								{added.emailSent ? (
									<>
										We emailed {added.name} a link to the judge login page at{" "}
										<span className="font-medium">{added.email}</span>.
									</>
								) : (
									<>
										{added.name} was added, but the access email to{" "}
										<span className="font-medium">{added.email}</span> didn’t
										send. Try again now, or later from Resend access email in
										their actions menu.
									</>
								)}
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							{added.emailSent ? (
								<Button onClick={addAnother}>Add another</Button>
							) : (
								<Button
									disabled={resendEmail.isPending}
									onClick={() => resendEmail.mutate({ id: added.id })}
								>
									{resendEmail.isPending ? "Sending..." : "Try again"}
								</Button>
							)}
							<Button onClick={onClose} variant="outline">
								Done
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Add a judge</DialogTitle>
							<DialogDescription>
								We’ll email them a link to sign in with a one-time code. Judges
								don’t need a password.
							</DialogDescription>
						</DialogHeader>
						<form
							className="flex flex-col gap-6"
							noValidate
							onSubmit={form.handleSubmit((values) =>
								createJudge.mutate(values)
							)}
						>
							<FieldGroup className="gap-5">
								<div className="grid gap-5 sm:grid-cols-2">
									<TextField
										autoComplete="off"
										control={form.control}
										disabled={isPending}
										label="First name"
										maxLength={NAME_MAX_LENGTH}
										name="firstName"
										placeholder="First name"
									/>
									<TextField
										autoComplete="off"
										control={form.control}
										disabled={isPending}
										label="Last name"
										maxLength={NAME_MAX_LENGTH}
										name="lastName"
										placeholder="Last name"
									/>
								</div>
								<TextField
									autoComplete="off"
									control={form.control}
									disabled={isPending}
									label="Email"
									name="email"
									placeholder="Email"
									type="email"
								/>
							</FieldGroup>
							<DialogFooter>
								<Button disabled={isPending} type="submit">
									{isPending ? "Adding..." : "Add judge"}
								</Button>
								<Button onClick={onClose} type="button" variant="outline">
									Cancel
								</Button>
							</DialogFooter>
						</form>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
