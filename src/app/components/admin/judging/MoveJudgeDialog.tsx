"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SelectField } from "@/app/components/forms/SelectField";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";
import { useRefresh } from "@/hooks/use-refresh";
import { api } from "@/trpc/react";
import type { Judge, LayoutTable, Round } from "./judgingShared";

const NOT_AT_A_TABLE = "none";

const moveJudgeSchema = z.object({
	judgeId: z.string({ message: "Choose a judge." }).min(1, "Choose a judge."),
	tableId: z.string({ message: "Choose a table." }).min(1, "Choose a table.")
});

export function MoveJudgeDialog({
	round,
	tables,
	judges,
	onClose
}: {
	round: Round;
	tables: LayoutTable[];
	judges: Judge[];
	onClose: () => void;
}) {
	const { isRefreshing, refresh } = useRefresh();
	const form = useForm<z.input<typeof moveJudgeSchema>>({
		defaultValues: { judgeId: "", tableId: "" },
		resolver: zodResolver(moveJudgeSchema)
	});
	const assignJudge = api.judgingTables.assignJudge.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () =>
			refresh(() => {
				toast.success("Judge moved.");
				onClose();
			})
	});
	const isPending = assignJudge.isPending || isRefreshing;
	const tableNumbers = new Map(
		tables.flatMap((table) =>
			table.judges.map(({ judge }) => [judge.id, table.tableNumber])
		)
	);

	return (
		<Dialog
			disablePointerDismissal
			onOpenChange={(open) => !open && onClose()}
			open
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Move a judge</DialogTitle>
					<DialogDescription>
						Teams keep their times. Only the judge’s table changes.
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6"
					noValidate
					onSubmit={form.handleSubmit(({ judgeId, tableId }) =>
						assignJudge.mutate({
							roundId: round.id,
							judgeId,
							tableId: tableId === NOT_AT_A_TABLE ? null : tableId
						})
					)}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<SelectField
							control={form.control}
							disabled={isPending}
							label="Judge"
							name="judgeId"
							options={judges.map((judge) => {
								const tableNumber = tableNumbers.get(judge.id);
								return {
									value: judge.id,
									label: tableNumber
										? `${judge.name} (Table ${tableNumber})`
										: judge.name
								};
							})}
							placeholder="Choose a judge"
						/>
						<SelectField
							control={form.control}
							disabled={isPending}
							label="Move to"
							name="tableId"
							options={[
								...tables.map((table) => ({
									value: table.id,
									label: `Table ${table.tableNumber}`
								})),
								{ value: NOT_AT_A_TABLE, label: "No table" }
							]}
							placeholder="Choose a table"
						/>
					</div>
					<DialogFooter>
						<Button disabled={isPending} type="submit">
							Move judge
						</Button>
						<Button onClick={onClose} type="button" variant="outline">
							Cancel
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
