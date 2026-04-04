import type { ICellRendererParams } from "ag-grid-community";
import {
	AllCommunityModule,
	ModuleRegistry,
	themeQuartz
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import Image from "next/image";
import { useMemo } from "react";
import type { RouterOutputs } from "@/trpc/react";
import {
	createJudgingColumnDefs,
	JUDGING_TABLE_THEME_PARAMS
} from "@/types/scoresTableConstants";
import Card from "../Dashboard/Card";

ModuleRegistry.registerModules([AllCommunityModule]);

type Assignment = RouterOutputs["scores"]["getByRound"][number];

// custom component for AG Grid to open modal
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
	const theme = useMemo(
		() => themeQuartz.withParams(JUDGING_TABLE_THEME_PARAMS),
		[]
	);

	const columnDefs = useMemo(
		() => createJudgingColumnDefs(criteria),
		[criteria]
	);

	return (
		<Card className="flex w-full flex-col gap-4 p-4 shadow-xl">
			<div className="h-212.5 w-full overflow-hidden rounded-xl">
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
					pagination={true}
					paginationPageSize={10}
					paginationPageSizeSelector={[10, 20, 50, 100]}
					rowData={assignments}
					suppressCellFocus={true}
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
	if (!data) return null;

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
		<button
			className="font-bold text-md text-medium-pink uppercase tracking-widest hover:underline"
			onClick={() => context.onOpenModal(data.id, data.team.name)}
			type="button"
		>
			<div className="flex flex-row gap-2">
				Edit
				<Image
					alt="Edit icon"
					height={16}
					src="/svgs/judges/edit_icon.svg"
					width={16}
				/>
			</div>
		</button>
	);
}
