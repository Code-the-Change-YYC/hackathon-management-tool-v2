import PageHeader from "@/app/components/PageHeader";
import Mentors from "@/app/components/resources/MentorsSection";
import Resources from "@/app/components/resources/ResourcesSection";

export default function ResourcePage() {
	return (
		<div className="flex flex-col gap-6 p-6">
			<PageHeader
				description="Helpful resources and mentors!"
				title="Resources and Help"
			/>
			<div className="flex flex-col gap-16">
				<Resources />
				<Mentors />
			</div>
		</div>
	);
}
