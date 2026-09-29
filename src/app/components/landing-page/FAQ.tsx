import Link from "next/link";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger
} from "@/app/components/ui/accordion";
import { SectionTitle, SectionWrapper } from "./InfoSection";

const MLH_CODE_OF_CONDUCT_URL =
	"https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md";

const FAQ_ITEMS = [
	{
		question: "What is Code the Change YYC?",
		answer: (
			<p>
				Code the Change YYC is a student-led initiative where students in
				technology-focused programs volunteer their time to work on projects for
				social change. It gives students a way to strengthen their skills, gain
				experience, receive mentorship, and give back to the community through
				software.
			</p>
		)
	},
	{
		question: "What is a hackathon?",
		answer: (
			<p>
				A hackathon is a coding event where teams of students showcase their
				innovation and creativity through software. Teams work together to code
				a solution to an issue within 24 hours.
			</p>
		)
	},
	{
		question: "Who can participate?",
		answer: (
			<p>
				Anyone interested in software development and open to collaborating with
				a team can participate. Hackathons are a great fit for first-time and
				experienced hackers alike.
			</p>
		)
	},
	{
		question: "How are the winners selected?",
		answer: (
			<p>
				Each team presents its project to a group of judges, who score it using
				our <Link href="#judging-criteria">judging criteria</Link>.
			</p>
		)
	},
	{
		question: "How many people can be on a team?",
		answer: <p>Teams can have 2–5 people.</p>
	},
	{
		question: "Is there a cost to participate?",
		answer: <p>No. Participation is completely free for everyone.</p>
	},
	{
		question: "How long is the hackathon?",
		answer: (
			<p>
				Hack the Change is a 24-hour hackathon taking place November 7–8, 2026.
				Check the event schedule for the latest timing details.
			</p>
		)
	},
	{
		question: "What programming language can I use?",
		answer: (
			<p>
				There are no language restrictions. Your team can use any language that
				works for your project.
			</p>
		)
	},
	{
		question: "Will the event be in person?",
		answer: (
			<p>
				Hack the Change will be held in person at the University of Calgary. The
				opening and closing ceremonies will be streamed on Twitch.
			</p>
		)
	},
	{
		question: "Can I stay overnight on campus?",
		answer: (
			<p>
				You can choose to stay on campus overnight, but accommodations are not
				provided. There are places on campus with sofas where you can rest, or
				you can go home and return for the next day&apos;s events.
			</p>
		)
	},
	{
		question: "What is MLH?",
		answer: (
			<p>
				Major League Hacking (MLH) is the official student hackathon league.
				Each year, MLH powers more than 300 weekend-long invention competitions
				that inspire innovation, cultivate communities, and teach computer
				science skills to more than 500,000 developers around the world. MLH is
				an engaged maker community of the next generation of technology leaders
				and entrepreneurs. Read the MLH{" "}
				<a
					href={MLH_CODE_OF_CONDUCT_URL}
					rel="noopener noreferrer"
					target="_blank"
				>
					Code of Conduct
				</a>
				.
			</p>
		)
	}
];

export default function FAQ() {
	return (
		<SectionWrapper bgColor="bg-pastel-green">
			<div className="flex w-full flex-col gap-8 md:gap-10">
				<div className="flex flex-col gap-4">
					<SectionTitle
						accentPosition="after"
						accentSrc="accent_green"
						titleColor="text-awesomer-purple"
						titleHighlight="Frequently Asked Questions"
						titlePrefixColor="text-black"
					/>
					<p className="font-medium text-dark-grey text-lg md:text-xl">
						Find answers to common questions about Hack the Change.
					</p>
				</div>

				<Accordion className="gap-3">
					{FAQ_ITEMS.map(({ question, answer }, index) => (
						<AccordionItem
							className="rounded-2xl bg-white px-5 shadow-[4px_4px_0_0_var(--color-dark-green)] sm:px-7"
							key={question}
							value={`faq-${index}`}
						>
							<AccordionTrigger className="items-center gap-4 py-5 font-semibold text-base text-dark-grey hover:no-underline sm:text-lg">
								<span>{question}</span>
							</AccordionTrigger>
							<AccordionContent className="max-w-4xl pb-5 font-medium text-base text-dark-grey/80 leading-7 sm:text-lg">
								{answer}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</SectionWrapper>
	);
}
