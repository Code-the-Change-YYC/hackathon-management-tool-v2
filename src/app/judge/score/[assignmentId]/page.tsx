import { JudgeScorePage } from "../../../components/judges/JudgePortal";

export default async function page({
	params
}: {
	params: Promise<{ assignmentId: string }>;
}) {
	const { assignmentId } = await params;

	return <JudgeScorePage assignmentId={assignmentId} key={assignmentId} />;
}
