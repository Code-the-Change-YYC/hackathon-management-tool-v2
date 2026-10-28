import { getMentors } from "@/app/actions";
import { MENTOR_CATEGORIES } from "@/types/contentfulTypes";
import { Card, CardContent, CardHeader } from "../../ui/card";
import MentorEntry from "./MentorEntry";

export default async function MentorsSection() {
	const mentors = await getMentors();

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Mentors</h2>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 pb-32">
					{mentors.size ? (
						MENTOR_CATEGORIES.map((category) => (
							<div
								className="grid grid-cols-6 justify-between gap-8"
								key={category}
							>
								{(mentors.get(category) ?? []).map((mentor) => (
									<MentorEntry key={mentor.sys.id} mentor={mentor} />
								))}
							</div>
						))
					) : (
						<p className="text-dark-grey">Mentors will be announced soon.</p>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
