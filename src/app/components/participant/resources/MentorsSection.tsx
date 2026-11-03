import { Group3Line } from "@mingcute/react";
import { getMentors } from "@/app/actions";
import { Card, CardContent, CardHeader } from "../../ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from "../../ui/empty";
import MentorCard from "./MentorCard";

export default async function MentorsSection() {
	const mentors = await getMentors();

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Mentors</h2>
				</CardHeader>
				<CardContent>
					{mentors.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
							{mentors.map((mentor) => (
								<MentorCard key={mentor.sys.id} mentor={mentor} />
							))}
						</div>
					) : (
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Group3Line />
								</EmptyMedia>
								<EmptyTitle>No mentors yet</EmptyTitle>
								<EmptyDescription>
									Mentors will be announced soon.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
