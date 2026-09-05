import { JudgeScorePage } from "../../../components/judges/JudgeScorePage";

export default async function page({
	params
}: {
	params: Promise<{ assignmentId: string }>;
}) {
	const { assignmentId } = await params;

	return <JudgeScorePage assignmentId={assignmentId} key={assignmentId} />;
}
