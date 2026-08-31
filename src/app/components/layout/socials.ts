// Social links and their icons for the app footer.

import {
	FacebookFill,
	GithubFill,
	InstagramFill,
	LinkedinFill
} from "@mingcute/react";
import type { ComponentType } from "react";

export type Social = {
	label: string;
	href: string;
	Icon: ComponentType<{ className?: string }>;
};

export const socials: Social[] = [
	{
		label: "Facebook",
		href: "https://www.facebook.com/codethechangeyyc",
		Icon: FacebookFill
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/codethechangeyyc",
		Icon: InstagramFill
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/company/code-the-change-yyc",
		Icon: LinkedinFill
	},
	{
		label: "GitHub",
		href: "https://github.com/Code-the-Change-YYC",
		Icon: GithubFill
	}
];
