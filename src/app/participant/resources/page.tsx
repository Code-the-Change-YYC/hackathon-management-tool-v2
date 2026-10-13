import { redirect } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import Mentors from "@/app/components/resources/MentorsSection";
import Resources from "@/app/components/resources/ResourcesSection";
import { HACKATHON_DATE } from "@/lib/constants";

export default function ResourcePage() {
	if (Date.now() < HACKATHON_DATE.getTime()) {
		redirect("/under-construction");
	}

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
