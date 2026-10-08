import { AddLine } from "@mingcute/react";
import { Fragment, useCallback, useState } from "react";
import { toast } from "sonner";
import {
	ConfirmAlertDialog,
	useConfirmDialog
} from "@/app/components/ConfirmAlertDialog";
import { Button } from "@/app/components/ui/button";
import type { RouterOutputs } from "@/trpc/react";

type Criterion = RouterOutputs["criteria"]["getAll"][number];

export function ScoringSection({
	name,
	placeholder,
	items = [],
	sidepot,
	handleCreate,
	handleDelete
}: {
	name: string;
	placeholder: string;
	items?: Criterion[];
	sidepot: boolean;
	handleCreate: (name: string, isSidepot: boolean) => Promise<Criterion | null>;
	handleDelete: (id: string) => Promise<{ success: boolean }>;
}) {
	const [addText, setAddText] = useState("");
	const { confirm, dialogProps } = useConfirmDialog();

	const createItem = useCallback(async () => {
		const name = addText.trim();

		if (!name) return;

		const result = await handleCreate(name, sidepot);

		if (result) {
			setAddText("");
		}
	}, [addText, handleCreate, sidepot]);

	const deleteItem = useCallback(
		async (item: Criterion) => {
			if (
				!(await confirm({
					title: `Delete "${item.name}"?`,
					description:
						"This will also remove all scores recorded for this criterion.",
					confirmLabel: "Delete",
					destructive: true
				}))
			)
				return;

			try {
				await handleDelete(item.id);
				toast.success("Deleted");
			} catch (error) {
				console.error(error);
				toast.error("Failed to delete");
			}
		},
		[confirm, handleDelete]
	);

	return (
		<div className="flex w-full flex-col gap-7">
			<div className="grid w-full grid-cols-[1fr_max-content] grid-rows-[max-content_max-content] items-center gap-x-4 gap-y-2 pr-4">
				<p className="pl-4 font-regular text-[14px] leading-5">{name}</p>

				<textarea
					className="field-sizing-content row-start-2 w-full resize-none rounded-[12px] border py-3 pr-3 pl-4 text-4 leading-6"
					onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
						setAddText(event.target.value);
					}}
					onKeyDown={(event) => {
						if (event.key === "Enter" && !event.shiftKey) {
							event.preventDefault();
							void createItem();
						}
					}}
					placeholder={placeholder}
					rows={1}
					value={addText}
				/>

				<Button
					className="row-start-2"
					onClick={() => void createItem()}
					type="button"
				>
					<AddLine aria-label="Add" className="size-5" />
					<p className="font-medium text-4 text-white leading-6">Add</p>
				</Button>
			</div>

			<div className="grid grid-cols-[1fr_max-content] justify-center gap-4">
				{items.map((item) => (
					<Fragment key={item.id}>
						<div className="field-sizing-content w-full resize-none rounded-[12px] border bg-muted py-3 pr-3 pl-4 text-4 leading-6">
							{item.name}
						</div>

						<Button
							className="bg-strawberry-red text-white hover:bg-strawberry-red/90"
							onClick={() => void deleteItem(item)}
							type="button"
							variant="destructive"
						>
							<AddLine aria-label="Remove" className="size-5 rotate-45" />
							<p className="font-medium text-4 text-white leading-6">Remove</p>
						</Button>
					</Fragment>
				))}
			</div>

			<ConfirmAlertDialog {...dialogProps} />
		</div>
	);
}
