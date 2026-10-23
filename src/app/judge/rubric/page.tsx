import { api, HydrateClient } from "@/trpc/server";
import { JudgeRubricPage } from "../../components/judges/JudgeRubricPage";

export default async function Page() {
	await api.criteria.getAll.prefetch();
	return (
		<HydrateClient>
			<main className="flex flex-col gap-5 px-6 py-6">
				<JudgeRubricPage />
			</main>
		</HydrateClient>
	);
}
