import Link from "next/link";
import { notFound } from "next/navigation";
import PageContainer from "@/app/components/PageContainer";
import { ImportantInfoSkeleton } from "@/app/components/participant/important-info/ImportantInfoSkeleton";
import { ImportantInfoView } from "@/app/components/participant/important-info/ImportantInfoView";

export default async function ImportantInfoPreviewPage({
	searchParams
}: {
	searchParams: Promise<{ skeleton?: string }>;
}) {
	if (process.env.NODE_ENV !== "development") notFound();
	const { skeleton } = await searchParams;

	return (
		<PageContainer>
			<div className="flex flex-col gap-6">
				<nav aria-label="Preview mode" className="flex flex-wrap gap-4 text-sm">
					<Link
						className="underline underline-offset-4"
						href="/preview/important-info"
					>
						View preview
					</Link>
					<Link
						className="underline underline-offset-4"
						href="/preview/important-info?skeleton=1"
					>
						Skeleton preview
					</Link>
				</nav>
				{skeleton === "1" ? <ImportantInfoSkeleton /> : <ImportantInfoView />}
			</div>
		</PageContainer>
	);
}
