import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { api, type RouterOutputs } from "@/trpc/react";

type Criterion = RouterOutputs["criteria"]["getAll"][number];

interface ModalPopupProps {
	onClose: () => void;
	assignmentId: string; // judging assignment - not sure how its handle currently so may need to change later on
	teamName: string;
	criteria: Criterion[];
}

const ModalPopup = ({
	onClose,
	assignmentId,
	teamName,
	criteria
}: ModalPopupProps) => {
	const utils = api.useUtils();
	const [localScores, setLocalScores] = useState<Record<string, number>>({});

	const { data: existingScores, isLoading } =
		api.scores.getByAssignment.useQuery({
			assignmentId
		});

	// populate with data from db
	useEffect(() => {
		if (existingScores) {
			const initialMap: Record<string, number> = {};
			existingScores.forEach((s) => {
				initialMap[s.criteriaId] = s.value;
			});
			setLocalScores(initialMap);
		}
	}, [existingScores]);

	const createManyMutation = api.scores.createMany.useMutation();

	const handleScoreChange = (criteriaId: string, value: string) => {
		setLocalScores((prev) => ({
			...prev,
			[criteriaId]: parseInt(value, 10)
		}));
	};

	const onSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const scoreData = Object.entries(localScores).map(([criteriaId, val]) => ({
			assignmentId,
			criteriaId,
			score: val
		}));

		if (scoreData.length === 0) {
			toast.error("Please enter at least one score.");
			return;
		}

		try {
			await createManyMutation.mutateAsync(scoreData);
			toast.success(`All ${scoreData.length} scores saved for ${teamName}!`);
			await utils.scores.getByRound.invalidate();
			onClose();
		} catch (error) {
			console.error(error);
			toast.error("Failed to save scores. Please try again.");
		}
	};

	const scoreOptions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	if (isLoading) return <h1>Loading!</h1>;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
			<div className="w-4/5 max-w-300 rounded-md bg-white p-6">
				<div className="mb-6 flex items-start justify-between">
					<h1 className="pb-4 font-bold text-6xl text-dark-pink">
						Scoring <span className="text-medium-pink">{teamName}</span>
					</h1>
					<button onClick={onClose} type="button">
						<Image
							alt="Exit popup icon"
							height={20}
							src="/svgs/judging/exit_icon.svg"
							width={20}
						/>
					</button>
				</div>
				<div className="flex flex-col">
					<form className="flex flex-col gap-4" onSubmit={onSubmit}>
						<p className="font-bold text-2xl">Main Criteria:</p>
						<div className="flex items-center gap-4">
							{criteria
								.filter((c) => !c.isSidepot)
								.map((c) => (
									<div className="flex flex-col gap-2" key={c.id}>
										<label
											className="font-medium text-grey-purple text-sm"
											htmlFor={`criteria-${c.id}`}
										>
											{c.name}
										</label>

										<select
											className="w-full rounded-lg border-2 border-pale-grey p-2 outline-none transition-colors focus:border-medium-pink"
											id={`criteria-${c.id}`}
										>
											<option disabled value="">
												Select Score
											</option>
											{scoreOptions.map((num) => (
												<option key={num} value={num}>
													{num}
												</option>
											))}
										</select>
									</div>
								))}
						</div>
						<hr></hr>
						<p className="font-bold text-2xl">Sidepots:</p>
						<div className="flex items-center gap-4">
							{criteria
								.filter((c) => c.isSidepot)
								.map((c) => (
									<div className="flex flex-col gap-2" key={c.id}>
										<label
											className="font-medium text-grey-purple text-sm"
											htmlFor={`criteria-${c.id}`}
										>
											{c.name}
										</label>
										<select
											className="w-full rounded-lg border-2 border-pastel-green p-2 outline-none transition-colors focus:border-dark-green"
											onChange={(e) => handleScoreChange(c.id, e.target.value)}
											value={localScores[c.id] ?? ""}
										>
											<option value="">N/A (Optional)</option>
											{scoreOptions.map((num) => (
												<option key={num} value={num}>
													{num}
												</option>
											))}
										</select>
									</div>
								))}
						</div>
						<button
							className="rounded-full bg-awesomer-purple px-10 py-3 font-bold text-white shadow-lg transition-all hover:bg-awesome-purple disabled:bg-ehhh-grey"
							disabled={createManyMutation.isPending}
							type="submit"
						>
							{createManyMutation.isPending
								? "Submitting..."
								: "Submit Final Score"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
};

export default ModalPopup;
