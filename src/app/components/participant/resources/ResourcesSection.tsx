import { getResources } from "@/app/actions";
import { Card, CardContent, CardHeader } from "../../ui/card";
import ResourceCard from "./ResourceCard";

export default async function ResourcesSection() {
	const resources = await getResources();

	return (
		<div className="flex h-full w-full flex-col gap-4">
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Resources</h2>
				</CardHeader>
				<CardContent>
					{resources.length ? (
						<div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2 2xl:grid-cols-4">
							{resources.map((resource) => (
								<ResourceCard key={resource.sys.id} resource={resource} />
							))}
						</div>
					) : (
						<p className="text-dark-grey">Resources will be announced soon.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
