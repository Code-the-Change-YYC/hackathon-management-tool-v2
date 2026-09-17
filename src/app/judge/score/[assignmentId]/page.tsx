import { JudgeScorePage } from "../../../components/judges/JudgeScorePage";

export default async function page({
	params
}: {
	params: Promise<{ assignmentId: string }>;
}) {
	const { assignmentId } = await params;

	return (
		<main className="flex flex-col">
			<JudgeScorePage assignmentId={assignmentId} key={assignmentId} />
		</main>
	);
}
