import { Group3Line } from "@mingcute/react";
import { getMentors } from "@/app/actions";
import { cn } from "@/lib/utils";
import { MENTOR_CATEGORIES } from "@/types/contentfulTypes";
import { Card, CardContent, CardHeader } from "../../ui/card";
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle
} from "../../ui/empty";
import MentorEntry from "./MentorEntry";

export default async function MentorsSection() {
	const mentors = await getMentors();

	return (
		<div className="flex flex-col gap-4">
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Mentors</h2>
				</CardHeader>
				<CardContent
					className={cn("flex flex-col gap-4", mentors.size > 0 && "pb-28")}
				>
					{mentors.size > 0 ? (
						MENTOR_CATEGORIES.map((category) => {
							const categoryList = mentors.get(category) ?? [];

							return (
								categoryList.length > 0 && (
									<div
										className="grid grid-cols-[repeat(auto-fill,192px)] justify-evenly gap-8 md:justify-between"
										key={category}
									>
										{categoryList.map((mentor) => (
											<MentorEntry key={mentor.sys.id} mentor={mentor} />
										))}
									</div>
								)
							);
						})
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
