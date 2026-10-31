"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import PageHeader from "@/app/components/PageHeader";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@/app/components/ui/card";
import { DEVPOST_URL } from "@/lib/constants";

const slides = [
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

export function ImportantInfoView() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const slide = slides[currentIndex] ?? slides[0];

	return (
		<div className="flex min-w-0 flex-col gap-6">
			<PageHeader
				description="Rules, code of conduct, project submission steps, and tips for success."
				title="Important Information"
			/>
			<section
				aria-label="Event guidelines"
				aria-roledescription="carousel"
				className="flex flex-col gap-4"
			>
				<Card aria-atomic="true" aria-live="polite">
					<CardHeader>
						<CardTitle>
							<h2>{slide.title}</h2>
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ol className="flex list-decimal flex-col gap-4 pl-5 leading-relaxed">
							{slide.items.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ol>
					</CardContent>
				</Card>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						aria-label="Previous guideline"
						onClick={() =>
							setCurrentIndex(
								(index) => (index + slides.length - 1) % slides.length
							)
						}
						size="sm"
						variant="outline"
					>
						Previous
					</Button>
					<div className="flex flex-wrap gap-2">
						{slides.map((item, index) => (
							<Button
								aria-label={`Show ${item.title}`}
								aria-pressed={index === currentIndex}
								key={item.title}
								onClick={() => setCurrentIndex(index)}
								size="sm"
								variant={index === currentIndex ? "secondary" : "ghost"}
							>
								{index + 1}
							</Button>
						))}
					</div>
					<Button
						aria-label="Next guideline"
						onClick={() =>
							setCurrentIndex((index) => (index + 1) % slides.length)
						}
						size="sm"
						variant="outline"
					>
						Next
					</Button>
				</div>
			</section>
			<Card>
				<CardHeader>
					<CardTitle>
						<h2>Submitting Your Project</h2>
					</CardTitle>
					<CardDescription>
						Prepare your submission and submit it on Devpost before Sunday,
						November 8 at 11:30AM ABT.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-6 leading-relaxed">
					<section className="flex flex-col gap-2">
						<h3 className="font-medium">What goes into a submission?</h3>
						<ul className="flex list-disc flex-col gap-2 pl-5">
							<li>Your team ID and team name.</li>
							<li>
								Your project’s source code, such as a GitHub repository link, if
								applicable.
							</li>
							<li>
								A link to a 2–3 minute demo video showing your software or
								hardware project in action.
							</li>
						</ul>
					</section>
					<section className="flex flex-col gap-2">
						<h3 className="font-medium">Submission instructions</h3>
						<ol className="flex list-decimal flex-col gap-2 pl-5">
							<li>
								Open the event’s Devpost page and select “Start Project”.{" "}
								<Image
									alt="Dev Post Start Submission"
									className="mt-3 h-auto w-full max-w-2xl rounded-lg"
									height={410}
									sizes="(max-width: 768px) 90vw, 672px"
									src="/images/devpost-submission/startSubmission.png"
									width={1013}
								/>
							</li>
							<li>
								Complete the project submission form with your team details,
								source code, and demo video.
								<Image
									alt="Dev Post Complete Submission"
									className="mt-3 h-auto w-full max-w-2xl rounded-lg"
									height={714}
									loading="eager"
									sizes="(max-width: 768px) 90vw, 672px"
									src="/images/devpost-submission/completeSubmission.png"
									width={1523}
								/>
							</li>
							<li>Submit your completed project before the deadline.</li>
						</ol>
						<div>
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
							</Button>
						</div>
					</section>
					<section className="flex flex-col gap-2">
						<h3 className="font-medium">After submissions</h3>
						<p>
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
					<section className="flex flex-col gap-2">
						<h3 className="font-medium">After judging</h3>
						<p>
							Stay tuned while CTC members aggregate the final scores and
							announce the winners at the closing ceremonies. Follow the event
							schedule and check Discord announcements for details.
						</p>
					</section>
				</CardContent>
			</Card>
		</div>
	);
}
