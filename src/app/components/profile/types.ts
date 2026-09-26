import type { Program } from "@/types/types";

export type Profile = {
	name: string;
	email: string;
	avatarSrc: string;
	school: string | null;
	program: Program | null;
};
