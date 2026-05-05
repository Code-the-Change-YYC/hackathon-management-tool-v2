const LOREM =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.";

// Placeholder rubric content until this is backed by actual criteria.
const CATEGORIES = [
	"Lorem ipsum category one",
	"Lorem ipsum category two",
	"Lorem ipsum category three",
	"Lorem ipsum category four",
	"Lorem ipsum category five"
] as const;

const COLUMNS = [
	"Category",
	"Minimal (1-2)",
	"Developing (3-4)",
	"Satisfactory (5-6)",
	"Effective (7-8)",
	"Excellent (9-10)"
] as const;

const SCORE_LEVELS = COLUMNS.slice(1);

export default function RubricTable() {
	return (
		<div className="rounded-2xl border-2 border-emerald-green bg-mint-green/40 p-4 shadow-md sm:p-6">
			<div className="overflow-x-auto rounded-xl border border-medium-grey bg-white">
				<table className="w-full min-w-[720px] border-collapse text-left text-sm">
					<thead>
						<tr className="bg-mint-green">
							{COLUMNS.map((col) => (
								<th
									className="border-medium-grey border-b px-4 py-3 font-bold text-emerald-green"
									key={col}
								>
									{col}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{CATEGORIES.map((cat) => (
							<tr
								className="border-medium-grey border-b last:border-b-0"
								key={cat}
							>
								<td className="border-medium-grey border-r px-4 py-4 font-medium text-dark-grey">
									{cat}
								</td>
								{SCORE_LEVELS.map((level) => (
									<td
										className="border-medium-grey border-r px-4 py-4 text-dark-grey last:border-r-0"
										key={`${cat}-${level}`}
									>
										{LOREM}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
