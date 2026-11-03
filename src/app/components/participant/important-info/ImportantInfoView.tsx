import { ArrowRightUpLine, CheckLine } from "@mingcute/react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader
} from "@/app/components/ui/card";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger
} from "@/app/components/ui/tabs";
import { DEVPOST_URL } from "@/lib/constants";

const guidelines = [
	{
		title: "Rules",
		items: [
			"Create your project’s design, code, and hardware during the event. Third-party tools, frameworks, and your usual tooling are allowed.",
			"Present your finished project to the judges within your assigned time slot. Check the judging page for your assignment.",
			"Intellectual property developed during the hackathon belongs to the team that created it.",
			"Teams must have between 2 and 5 members.",
			"Submissions made solely using Figma will not be accepted.",
			"AI tools are permitted, but projects must demonstrate original work and disclose AI usage. Reskins of existing AI tools or failure to disclose AI usage may result in disqualification and/or reporting to MLH."
		]
	},
	{
		title: "Code of Conduct",
		items: [
			"Treat all attendees with respect. Harassment, discrimination, bullying, or inappropriate behaviour will not be tolerated.",
			"Treat judges, mentors, volunteers, and organizers with respect. Reports of misconduct may result in disciplinary action, including disqualification.",
			"Arrive on time for your presentation and stay within the assigned time limit. Organizers may adjust the schedule if delays occur."
		]
	},
	{
		title: "Tips for Success",
		items: [
			"Review the judging rubric before submitting. Projects must earn at least a satisfactory rating in both Idea and Effectiveness to advance from Devpost submissions to live judging.",
			"Plan your presentation to leave time for a slideshow, a working demo, and questions from the judges.",
			"Ask for help! Contact mentors on Discord, or create a support ticket for questions about the event."
		]
	}
] as const;

function NumberedList({ items }: { items: readonly ReactNode[] }) {
	return (
		<ol className="flex flex-col gap-4">
			{items.map((item, index) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static list
				<li className="flex gap-3" key={index}>
					<span
						aria-hidden="true"
						className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-medium text-primary text-xs tabular-nums"
					>
						{index + 1}
					</span>
					<div className="min-w-0 flex-1 pt-0.5">{item}</div>
				</li>
			))}
		</ol>
	);
}

export function ImportantInfoView() {
	return (
		<div className="flex min-w-0 flex-col gap-6">
			<PageHeader
				description="Rules, code of conduct, project submission steps, and tips for success."
				title="Important Information"
			/>
			<Card>
				<Tabs defaultValue={guidelines[0].title}>
					<CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<h2 className="font-medium text-xl">Event Guidelines</h2>
						<TabsList className="w-full sm:w-fit">
							{guidelines.map((guideline) => (
								<TabsTrigger
									className="sm:px-2.5"
									key={guideline.title}
									value={guideline.title}
								>
									{guideline.title}
								</TabsTrigger>
							))}
						</TabsList>
					</CardHeader>
					{guidelines.map((guideline) => (
						<TabsContent
							className="px-6 pt-4 leading-relaxed"
							key={guideline.title}
							value={guideline.title}
						>
							<NumberedList items={guideline.items} />
						</TabsContent>
					))}
				</Tabs>
			</Card>
			<Card>
				<CardHeader>
					<h2 className="font-medium text-xl">Submitting Your Project</h2>
					<CardDescription>
						Prepare your submission and submit it on Devpost before Sunday,
						November 8 at 11:30AM ABT.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-8 leading-relaxed">
					<section className="flex flex-col gap-3">
						<h3 className="font-semibold">What goes into a submission?</h3>
						<ul className="flex flex-col gap-2">
							{[
								"Your team ID and team name.",
								"Your project’s source code, such as a GitHub repository link, if applicable.",
								"A link to a 2–3 minute demo video showing your software or hardware project in action."
							].map((item) => (
								<li className="flex gap-3" key={item}>
									<CheckLine
										aria-hidden="true"
										className="mt-0.5 size-5 shrink-0 text-primary"
									/>
									{item}
								</li>
							))}
						</ul>
					</section>
					<section className="flex flex-col gap-3">
						<h3 className="font-semibold">Submission instructions</h3>
						<NumberedList
							items={[
								<>
									Open the event’s Devpost page and select “Start Project”.
									<Image
										alt="Dev Post Start Submission"
										className="mt-3 h-auto w-full max-w-2xl rounded-lg ring-1 ring-border"
										height={410}
										sizes="(max-width: 768px) 90vw, 672px"
										src="/images/devpost-submission/startSubmission.png"
										width={1013}
									/>
								</>,
								<>
									Complete the project submission form with your team details,
									source code, and demo video.
									<Image
										alt="Dev Post Complete Submission"
										className="mt-3 h-auto w-full max-w-2xl rounded-lg ring-1 ring-border"
										height={714}
										loading="eager"
										sizes="(max-width: 768px) 90vw, 672px"
										src="/images/devpost-submission/completeSubmission.png"
										width={1523}
									/>
								</>,
								"Submit your completed project before the deadline."
							]}
						/>
						<div className="pl-9">
							<Button
								nativeButton={false}
								render={
									<Link
										href={DEVPOST_URL}
										rel="noopener noreferrer"
										target="_blank"
									/>
								}
							>
								Open Devpost
								<ArrowRightUpLine className="size-4" data-icon="inline-end" />
							</Button>
						</div>
					</section>
					<div className="grid gap-4 sm:grid-cols-2">
						<section className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
							<h3 className="font-semibold">After submissions</h3>
							<p className="text-muted-foreground">
								Teams will demo their projects to judges live. Check the{" "}
								<Link
									className="text-primary underline underline-offset-4"
									href="/participant/judging"
								>
									judging page
								</Link>{" "}
								for your assignment and rubric, and the{" "}
								<Link
									className="text-primary underline underline-offset-4"
									href="/participant/schedule"
								>
									event schedule
								</Link>{" "}
								for timing. Leave time for both your presentation and questions.
							</p>
						</section>
						<section className="flex flex-col gap-2 rounded-lg bg-muted/50 p-4">
							<h3 className="font-semibold">After judging</h3>
							<p className="text-muted-foreground">
								Stay tuned while CTC members aggregate the final scores and
								announce the winners at the closing ceremonies. Follow the event
								schedule and check Discord announcements for details.
							</p>
						</section>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
