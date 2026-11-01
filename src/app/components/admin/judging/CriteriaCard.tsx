"use client";

import { AddLine, Delete2Line, Edit2Line, More1Line } from "@mingcute/react";
import { useState } from "react";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { sortCriteria } from "@/app/components/judge/judgePortal";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from "@/app/components/ui/dropdown-menu";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle
} from "@/app/components/ui/empty";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from "@/app/components/ui/table";
import { useRefresh } from "@/hooks/use-refresh";
import { api } from "@/trpc/react";
import { CriterionDialog } from "./CriterionDialog";
import { type Criterion, ManagementSection, type Round } from "./judgingShared";

export function CriteriaCard({
	criteria,
	rounds
}: {
	criteria: Criterion[];
	rounds: Round[];
}) {
	const { confirm, dialogProps } = useConfirmDialog();
	const { isRefreshing, refresh } = useRefresh();
	const [editing, setEditing] = useState<Criterion | "new" | null>(null);
	const deleteCriterion = api.criteria.delete.useMutation({
		onError: (error) => toast.error(error.message),
		onSuccess: () => refresh(() => toast.success("Criterion deleted."))
	});
	const roundNames = new Map(rounds.map((round) => [round.id, round.name]));
	// The same order judges see.
	const orderedCriteria = criteria.slice().sort(sortCriteria);
	const nextDisplayOrder =
		Math.max(-1, ...criteria.map((criterion) => criterion.displayOrder)) + 1;

	async function requestDelete(criterion: Criterion) {
		const confirmed = await confirm({
			title: `Delete ${criterion.name}?`,
			description: "Judges will no longer score it. This can’t be undone.",
			confirmLabel: "Delete criterion",
			destructive: true
		});
		if (confirmed) deleteCriterion.mutate({ id: criterion.id });
	}

	return (
		<ManagementSection
			action={
				<Button onClick={() => setEditing("new")} size="sm">
					Add criterion
					<AddLine data-icon="inline-end" />
				</Button>
			}
			description="Main criteria decide the ranking. Sidepots are separate prizes."
			title="Rubric"
		>
			{criteria.length ? (
				<Table className="min-w-140">
					<TableHeader>
						<TableRow>
							<TableHead className="w-0 px-3 py-3">Order</TableHead>
							<TableHead className="px-3 py-3">Name</TableHead>
							<TableHead className="px-3 py-3">Type</TableHead>
							<TableHead className="px-3 py-3">Scored</TableHead>
							<TableHead className="px-3 py-3">Rounds</TableHead>
							<TableHead className="w-0 px-3 py-3">
								<span className="sr-only">Actions</span>
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orderedCriteria.map((criterion) => (
							<TableRow key={criterion.id}>
								<TableCell className="px-3 py-3 text-muted-foreground tabular-nums">
									{criterion.displayOrder}
								</TableCell>
								<TableCell className="whitespace-normal px-3 py-3">
									<span className="font-medium">{criterion.name}</span>
									{criterion.description.trim() ? (
										<span className="line-clamp-2 block max-w-md text-muted-foreground">
											{criterion.description}
										</span>
									) : null}
								</TableCell>
								<TableCell className="px-3 py-3">
									{criterion.isSidepot ? (
										<Badge variant="accent">Sidepot</Badge>
									) : (
										<Badge variant="secondary">Main</Badge>
									)}
								</TableCell>
								<TableCell className="px-3 py-3 tabular-nums">
									{criterion.isSidepot ? 0 : 1}–{criterion.maxScore}
								</TableCell>
								<TableCell className="whitespace-normal px-3 py-3">
									<span className="flex flex-wrap gap-1.5">
										{criterion.roundIds.length ? (
											criterion.roundIds.map((id) => (
												<Badge key={id} variant="outline">
													{roundNames.get(id) ?? "Deleted round"}
												</Badge>
											))
										) : (
											<Badge variant="outline">All rounds</Badge>
										)}
									</span>
								</TableCell>
								<TableCell className="px-3 py-3 text-right">
									<DropdownMenu>
										<DropdownMenuTrigger
											render={
												<Button
													aria-label={`Manage ${criterion.name}`}
													size="icon-sm"
													variant="ghost"
												/>
											}
										>
											<More1Line />
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end" className="w-36">
											<DropdownMenuItem onClick={() => setEditing(criterion)}>
												<Edit2Line />
												Edit
											</DropdownMenuItem>
											<DropdownMenuItem
												disabled={deleteCriterion.isPending || isRefreshing}
												onClick={() => void requestDelete(criterion)}
												variant="destructive"
											>
												<Delete2Line />
												Delete
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			) : (
				<Empty>
					<EmptyHeader>
						<EmptyTitle>No criteria yet</EmptyTitle>
						<EmptyDescription>
							Add what judges should score before judging starts.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			)}
			{editing ? (
				<CriterionDialog
					criterion={editing === "new" ? undefined : editing}
					key={editing === "new" ? "new" : editing.id}
					nextDisplayOrder={nextDisplayOrder}
					onClose={() => setEditing(null)}
					rounds={rounds}
				/>
			) : null}
			<ConfirmAlertDialog {...dialogProps} />
		</ManagementSection>
	);
}
