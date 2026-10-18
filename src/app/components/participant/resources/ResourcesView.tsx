import PageHeader from "@/app/components/PageHeader";
import MentorsSection from "./MentorsSection";
import ResourcesSection from "./ResourcesSection";

export function ResourcesView() {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				description="Helpful resources and mentors!"
				title="Resources and Help"
			/>
			<div className="flex flex-col gap-16">
				<ResourcesSection />
				<MentorsSection />
			</div>
		</div>
	);
}
