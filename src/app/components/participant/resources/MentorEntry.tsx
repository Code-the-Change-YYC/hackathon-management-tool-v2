import { DiscordFill, User2Fill } from "@mingcute/react";
import { cva } from "class-variance-authority";
import Image from "next/image";
import { getAssetUrl, getFields, getString } from "@/lib/contentful";
import type { Mentor, MentorCategory } from "@/types/contentfulTypes";

const CATEGORY_STRINGS: Record<MentorCategory, string> = {
	industry: "Industry Mentor",
	events_member: "Events Member",
	tech_member: "Tech Member",
	general_member: "General Member"
};

const panelStyles = cva(
	"-top-2 pointer-events-none absolute inset-x-0 z-0 h-72 rounded-md opacity-0 shadow-lg transition-opacity duration-0 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:duration-150 group-focus-visible:pointer-events-auto group-focus-visible:opacity-100 group-focus-visible:duration-150",
	{
		variants: {
			category: {
				industry: "bg-medium-grey",
				events_member: "bg-primary",
				tech_member: "bg-fuzzy-peach",
				general_member: "bg-pastel-pink"
			}
		},
		defaultVariants: { category: "general_member" }
	}
);

const nameStyles = cva(
	"relative z-10 w-full truncate font-semibold text-muted-foreground text-xs transition-colors",
	{
		variants: {
			category: {
				industry: "group-hover:text-black group-focus-visible:text-black",
				events_member: "group-hover:text-white group-focus-visible:text-white",
				tech_member: "group-hover:text-black group-focus-visible:text-black",
				general_member: "group-hover:text-black group-focus-visible:text-black"
			}
		},
		defaultVariants: { category: "general_member" }
	}
);

const infoStyles = cva(
	"absolute inset-x-2 top-46 z-10 flex flex-col items-center gap-2 overflow-hidden px-2 text-sm leading-5 opacity-0 transition-opacity duration-0 group-hover:opacity-100 group-hover:duration-150 group-focus-visible:opacity-100 group-focus-visible:duration-150",
	{
		variants: {
			category: {
				industry: "text-black",
				events_member: "text-white",
				tech_member: "text-black",
				general_member: "text-black"
			}
		},
		defaultVariants: { category: "general_member" }
	}
);

export default function MentorEntry({ mentor }: { mentor: Mentor }) {
	const fields = getFields(mentor);
	const name = getString(fields.name)?.trim() ?? "Mentor";
	const role = getString(fields.role)?.trim();
	const category = getString(fields.category)?.trim() as
		| MentorCategory
		| undefined;
	const discord = getString(fields.discord)?.trim();
	const image = getAssetUrl(fields.image)?.trim();

	return (
		<div className="group relative isolate mx-auto flex w-48 cursor-pointer flex-col items-center gap-2 rounded-md px-4 py-2 text-center outline-none hover:z-10 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
			<div aria-hidden="true" className={panelStyles({ category })} />

			<Image
				alt={`${name} profile photo`}
				className="pointer-events-none relative z-10 size-32 select-none rounded-full object-cover"
				height={128}
				src={image || "/images/resources/defaultProfile.png"}
				width={128}
			/>
			<p className={nameStyles({ category })}>{name}</p>

			<div className={infoStyles({ category })}>
				<div className="flex w-full min-w-0 items-center justify-center">
					<span className="min-w-0 truncate">
						{CATEGORY_STRINGS[category ?? "general_member"]}
					</span>
				</div>
				<div className="flex w-full min-w-0 items-center justify-center gap-2">
					<User2Fill className="size-6 shrink-0" />
					<span className="min-w-0 truncate">{role}</span>
				</div>
				<div className="flex w-full min-w-0 items-center justify-center gap-2">
					<DiscordFill className="size-6 shrink-0" />
					<span className="min-w-0 truncate">{discord}</span>
				</div>
			</div>
		</div>
	);
}
