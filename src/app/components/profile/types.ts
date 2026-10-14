import type { LevelOfStudy } from "@/lib/validation/signup";
import type { Program } from "@/types/types";

export type Profile = {
	name: string;
	email: string;
	avatarSrc: string;
	firstName: string | null;
	lastName: string | null;
	age: number | null;
	phoneNumber: string | null;
	countryOfResidence: string | null;
	school: string | null;
	/** Whether `school` is on MLH's list, rather than typed in. */
	schoolIsListed: boolean;
	levelOfStudy: LevelOfStudy | null;
	program: Program | null;
};
