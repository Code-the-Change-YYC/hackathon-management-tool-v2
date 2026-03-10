import type { ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	type CellValueChangedEvent,
	type ColDef,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { api, type RouterOutputs } from "@/trpc/react";
import {
	createJudgingColumnDefs,
	JUDGING_TABLE_THEME_PARAMS
} from "@/types/scoresTableConstants";
import Card from "../Dashboard/Card";

ModuleRegistry.registerModules([AllCommunityModule]);

type Assignment = RouterOutputs["scores"]["getByRound"][number];

type ActionRendererParams = ICellRendererParams<Assignment> & {
	context: {
		onOpenModal: (assignmentId: string, teamName: string) => void;
	};
};

interface JudgingTableProps {
	assignments: Assignment[];
	criteria: {
		id: string;
		name: string;
		isSidepot: boolean;
		maxScore: number;
	}[];
	onOpenModal: (assignmentId: string, teamName: string) => void;
}

export default function JudgingTable({
	assignments,
	criteria,
	onOpenModal
}: JudgingTableProps) {
	const utils = api.useUtils();
	const theme = useMemo(
		() => themeQuartz.withParams(JUDGING_TABLE_THEME_PARAMS),
		[]
	);

	const columnDefs = useMemo(
		() => createJudgingColumnDefs(criteria),
		[criteria]
	);

	// mutations
	const updateMutation = api.scores.update.useMutation({
		onSuccess: () => utils.scores.getByRound.invalidate()
	});

	const createMutation = api.scores.createMany.useMutation({
		onSuccess: () => utils.scores.getByRound.invalidate()
	});

	// handles updates to scores
	const onCellValueChanged = useCallback(
		async (event: CellValueChangedEvent<Assignment>) => {
			if (event.newValue === event.oldValue || event.newValue === "-") return;

			type JudgingColDef = ColDef<Assignment> & {
				criteriaId?: string;
			};
			const criteriaId = (event.colDef as JudgingColDef).criteriaId;
			if (!criteriaId) return;

			const scoreRecord = event.data.scores?.find(
				(s) => s.criteriaId === criteriaId
			);
			const scoreValue = parseInt(event.newValue, 10);

			try {
				if (scoreRecord) {
					// update existing score
					await updateMutation.mutateAsync({
						id: scoreRecord.id,
						score: scoreValue
					});
				} else {
					// create new score entry
					await createMutation.mutateAsync([
						{
							assignmentId: event.data.id,
							criteriaId: criteriaId,
							score: scoreValue
						}
					]);
				}
				toast.success(`Score successfully updated for ${event.data.team.name}`);
			} catch {
				toast.error("Failed to save score. Please try again.");
			}
		},
		[updateMutation, createMutation]
	);

	return (
		<Card className="flex w-full flex-col gap-4 p-4 shadow-xl">
			<div className="h-200 w-full overflow-hidden rounded-xl">
				<AgGridReact
					columnDefs={columnDefs}
					components={{ actionCellRenderer: ActionCellRenderer }}
					context={{ onOpenModal }}
					defaultColDef={{
						flex: 1,
						sortable: true,
						resizable: false,
						wrapHeaderText: true,
						autoHeaderHeight: true,
						cellClass: "flex items-center justify-center"
					}}
					getRowId={({ data }) => data.id}
					onCellValueChanged={onCellValueChanged}
					pagination={true}
					paginationPageSize={10}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					rowData={assignments}
					suppressPaginationPanel={false}
					theme={theme}
				/>
			</div>
		</Card>
	);
}

// helper function to show judges whether all criteria have been scored if they still need to create a score
function ActionCellRenderer({ data, context }: ActionRendererParams) {
	const hasScores = (data?.scores?.length ?? 0) > 0;

	if (!hasScores) {
		return (
			<button
				className="rounded-full bg-medium-pink px-4 py-1 font-bold text-sm text-white shadow-sm"
				onClick={() => {
					if (!data) return;
					context.onOpenModal(data.id, data.team.name);
				}}
				type="button"
			>
				+ Create
			</button>
		);
	}

	return (
		<span className="font-bold text-md text-medium-pink uppercase tracking-widest">
			Scored
		</span>
	);
}
