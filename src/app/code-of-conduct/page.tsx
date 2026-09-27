import { LeftLine } from "@mingcute/react";
import type { Metadata } from "next";
import Link from "next/link";
import Markdown, { type Components } from "react-markdown";
import Footer from "@/app/components/landing-page/Footer";
import Header from "@/app/components/landing-page/Header";
import { tryCatch } from "@/lib/utils";

export const metadata: Metadata = {
	title: "Code of Conduct | Hack the Change"
};

// Re-check MLH's copy once a day so policy updates show up automatically
export const revalidate = 86400;

const SOURCE_URL =
	"https://github.com/MLH/mlh-policies/blob/main/code-of-conduct.md";
const RAW_URL =
	"https://raw.githubusercontent.com/MLH/mlh-policies/main/code-of-conduct.md";
const LICENSE_URL = "https://creativecommons.org/licenses/by-sa/4.0/";

const MARKDOWN_COMPONENTS: Components = {
	h2: ({ children }) => (
		<h2 className="mt-4 font-bold text-2xl text-dark-grey sm:text-3xl">
			{children}
		</h2>
	),
	p: ({ children }) => (
		<p className="font-medium text-base text-dark-grey/90 leading-7 sm:text-lg sm:leading-8">
			{children}
		</p>
	),
	ul: ({ children }) => (
		<ul className="flex list-disc flex-col gap-2 pl-6 font-medium text-base text-dark-grey/90 leading-7 marker:text-awesomer-purple sm:text-lg">
			{children}
		</ul>
	),
	strong: ({ children }) => (
		<strong className="font-semibold text-dark-grey">{children}</strong>
	),
	a: ({ children, href }) => (
		<a
			className="text-awesomer-purple! underline underline-offset-2 hover:opacity-75"
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{children}
		</a>
	)
};

async function getCodeOfConduct(): Promise<string | null> {
	const { data: response, error } = await tryCatch(
		fetch(RAW_URL, { next: { revalidate } })
	);

	if (!response?.ok) {
		console.error(
			"Error fetching the MLH code of conduct:",
			error ?? response?.status
		);
		return null;
	}

	return response.text();
}

export default async function CodeOfConductPage() {
	const codeOfConduct = await getCodeOfConduct();

	return (
		<>
			<Header />
			<main className="mt-16 min-h-svh bg-light-grey md:mt-22">
				<div className="bg-pastel-green px-6 pt-12 pb-28 sm:px-12 md:pt-16 md:pb-32">
					<div className="mx-auto flex max-w-3xl flex-col gap-4">
						<Link
							className="flex w-fit items-center gap-1 font-semibold text-awesomer-purple! hover:opacity-75"
							href="/"
						>
							<LeftLine aria-hidden="true" size={20} />
							Back to home
						</Link>
						<h1 className="font-bold text-4xl text-outline-purple text-white sm:text-5xl md:text-6xl">
							Code of Conduct
						</h1>
						<p className="font-medium text-dark-grey text-lg md:text-xl">
							Hack the Change follows the Major League Hacking Code of Conduct.
							Everyone at the event is expected to follow it.
						</p>
					</div>
				</div>

				<div className="-mt-16 px-6 pb-16 sm:px-12 md:pb-24">
					<article className="mx-auto flex max-w-3xl flex-col gap-5 rounded-[30px] bg-white p-6 shadow-[8px_8px_0_0_var(--color-lilac-purple)] sm:p-10 md:shadow-[12px_12px_0_0_var(--color-lilac-purple)] [&>p:first-child]:rounded-2xl [&>p:first-child]:bg-purple-50 [&>p:first-child]:p-5">
						{codeOfConduct ? (
							<Markdown components={MARKDOWN_COMPONENTS}>
								{codeOfConduct}
							</Markdown>
						) : (
							<p className="text-base text-dark-grey leading-7 sm:text-lg">
								We couldn&apos;t load the code of conduct right now. You can
								read it on{" "}
								<a
									className="text-awesomer-purple! underline"
									href={SOURCE_URL}
									rel="noopener noreferrer"
									target="_blank"
								>
									Major League Hacking&apos;s GitHub
								</a>
								.
							</p>
						)}
					</article>

					<p className="mx-auto mt-8 max-w-3xl text-center text-dark-grey/70 text-sm">
						The{" "}
						<a
							className="text-dark-grey/70! underline"
							href={SOURCE_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							MLH Code of Conduct
						</a>{" "}
						is published by Major League Hacking under the{" "}
						<a
							className="text-dark-grey/70! underline"
							href={LICENSE_URL}
							rel="noopener noreferrer"
							target="_blank"
						>
							CC BY-SA 4.0
						</a>{" "}
						license.
					</p>
				</div>
			</main>
			<Footer />
		</>
	);
}
