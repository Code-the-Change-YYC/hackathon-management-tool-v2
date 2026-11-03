import { generateId } from "better-auth";
import { addMinutes, subDays, subMinutes } from "date-fns";
import { FIRST_NAMES, LAST_NAMES } from "drizzle/seeds/names";
import { createRandom, type Random } from "drizzle/seedUtils";
import { AVATAR_IDS, getAvatarSrc } from "@/lib/avatars";
import { getFullName } from "@/lib/names";
import { UNIVERSITY_OF_CALGARY } from "@/lib/schools";
import { asksForMajor } from "@/lib/validation/profile";
import {
	type DietaryRestriction,
	type LevelOfStudy,
	toDietaryRestrictions
} from "@/lib/validation/signup";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { account, user } from "@/server/db/auth-schema";
import { type Program, Role } from "@/types/types";

export const SEED_PASSWORD = "Password123!";

// Easy-to-remember logins for each role. Everyone else's email is their name.
export const SAMPLE_EMAILS = {
	admin: "admin@hackathon.com",
	judge: "judge@hackathon.com",
	participant: "participant@hackathon.com"
};

const EMAIL_DOMAIN = "hackathon.com";
const JUDGE_COUNT = 25;
const PARTICIPANT_COUNT = 250;
const SIGN_UP_WINDOW_DAYS = 30;
const MINUTES_PER_DAY = 24 * 60;

const PARTICIPANT_LEVELS = [
	["undergraduate_three_plus_year", 62],
	["graduate", 10],
	["not_a_student", 8],
	["undergraduate_two_year", 6],
	["secondary", 6],
	["code_school", 4],
	["vocational", 2],
	["other", 1],
	["prefer_not_to_answer", 1]
] as const satisfies readonly (readonly [LevelOfStudy, number])[];

const AGE_RANGES = {
	less_than_secondary: [13, 14],
	secondary: [15, 18],
	undergraduate_two_year: [18, 22],
	undergraduate_three_plus_year: [18, 24],
	graduate: [22, 31],
	code_school: [20, 35],
	vocational: [18, 28],
	post_doctorate: [28, 38],
	other: [18, 30],
	not_a_student: [22, 34],
	prefer_not_to_answer: [18, 28]
} satisfies Record<LevelOfStudy, [number, number]>;

// Names from MLH's school list.
const UNIVERSITIES = [
	[UNIVERSITY_OF_CALGARY, 62],
	["Mount Royal University", 12],
	["Southern Alberta Institute of Technology", 9],
	["University of Alberta", 4],
	["University of Lethbridge", 3],
	["Ambrose University", 2],
	["St. Mary's University", 2],
	["Athabasca University", 2],
	["University of Saskatchewan", 1],
	["University of Waterloo", 1],
	["University of Toronto", 1],
	["Simon Fraser University", 1],
	["University of Victoria", 1]
] as const;

// Schools that aren't on MLH's list, as participants would type them in.
const HIGH_SCHOOLS = [
	"Western Canada High School",
	"Sir Winston Churchill High School",
	"Henry Wise Wood High School",
	"Crescent Heights High School"
];
const CODE_SCHOOLS = ["Lighthouse Labs", "InceptionU", "Juno College"];

const PROGRAM_WEIGHTS = [
	["computer_science", 45],
	["software_engineering", 30],
	["electrical_engineering", 10],
	["other", 15]
] as const satisfies readonly (readonly [Program, number])[];

const DIETARY_RESTRICTION_WEIGHTS = [
	["vegetarian", 30],
	["halal", 25],
	["gluten_free", 12],
	["dairy_free", 10],
	["vegan", 10],
	["nut_allergy", 8],
	["other", 5]
] as const satisfies readonly (readonly [DietaryRestriction, number])[];

type Name = { firstName: string; lastName: string };
type Background = { age: number; levelOfStudy: LevelOfStudy; school: string };

const ORGANIZER_BACKGROUND: Background = {
	age: 22,
	levelOfStudy: "undergraduate_three_plus_year",
	school: UNIVERSITY_OF_CALGARY
};

function toEmail({ firstName, lastName }: Name) {
	const localPart = `${firstName}.${lastName}`
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.replace(/[^a-z0-9.]/g, "");
	return `${localPart}@${EMAIL_DOMAIN}`;
}

// Never repeats a name, so no two people share an email.
function createNameGenerator(random: Random) {
	const taken = new Set<string>();
	return () => {
		let name: Name;
		do {
			name = {
				firstName: random.pick(FIRST_NAMES),
				lastName: random.pick(LAST_NAMES)
			};
		} while (taken.has(toEmail(name)));
		taken.add(toEmail(name));
		return name;
	};
}

function participantBackground(random: Random): Background {
	const levelOfStudy = random.weighted(PARTICIPANT_LEVELS);
	const [minAge, maxAge] = AGE_RANGES[levelOfStudy];
	const school =
		levelOfStudy === "secondary"
			? random.pick(HIGH_SCHOOLS)
			: levelOfStudy === "code_school"
				? random.pick(CODE_SCHOOLS)
				: random.weighted(UNIVERSITIES);
	return { age: random.int(minAge, maxAge), levelOfStudy, school };
}

// 555-0100 to 555-0199 are reserved for fiction, so these numbers reach no one.
function createPhoneNumber(random: Random, countryOfResidence: string) {
	const areaCode =
		countryOfResidence === "US"
			? random.pick(["206", "312", "415"])
			: random.weighted([
					["403", 6],
					["587", 3],
					["825", 1]
				]);
	return `+1${areaCode}55501${String(random.int(0, 99)).padStart(2, "0")}`;
}

function createFoodPreferences(random: Random) {
	const wantsFood = random.chance(0.92);
	const restrictions = new Set<DietaryRestriction>();
	if (wantsFood && random.chance(0.3)) {
		const count = random.chance(0.85) ? 1 : 2;
		while (restrictions.size < count) {
			restrictions.add(random.weighted(DIETARY_RESTRICTION_WEIGHTS));
		}
	}
	return {
		wantsFood,
		dietaryRestrictions: toDietaryRestrictions([...restrictions])
	};
}

function createUser(
	random: Random,
	{
		name,
		email,
		role,
		signedUpAt,
		background
	}: {
		name: Name;
		email: string;
		role: Role;
		signedUpAt: Date;
		background: Background;
	}
): typeof user.$inferInsert {
	// Onboarding takes a few minutes after signing up.
	const registeredAt = addMinutes(signedUpAt, random.int(3, 20));
	const countryOfResidence = random.chance(0.97) ? "CA" : "US";
	return {
		id: generateId(),
		name: getFullName(name.firstName, name.lastName),
		email,
		emailVerified: true,
		image: getAvatarSrc(random.pick(AVATAR_IDS)),
		role,
		...name,
		...background,
		program: asksForMajor(background.school)
			? random.weighted(PROGRAM_WEIGHTS)
			: null,
		phoneNumber: createPhoneNumber(random, countryOfResidence),
		countryOfResidence,
		...createFoodPreferences(random),
		mlhCodeOfConductAcceptedAt: registeredAt,
		mlhDataSharingAcceptedAt: registeredAt,
		mlhEmailOptIn: random.chance(0.35),
		completedRegistration: true,
		createdAt: signedUpAt,
		updatedAt: registeredAt
	};
}

// Admins add judges with just a name and email, and judges never onboard.
function createJudge({
	name,
	email,
	addedAt
}: {
	name: Name;
	email: string;
	addedAt: Date;
}): typeof user.$inferInsert {
	return {
		id: generateId(),
		name: getFullName(name.firstName, name.lastName),
		email,
		emailVerified: true,
		role: Role.JUDGE,
		...name,
		completedRegistration: true,
		createdAt: addedAt,
		updatedAt: addedAt
	};
}

// Sign-ups pick up as the hackathon gets closer.
function participantSignUpTime(random: Random, now: Date) {
	const minMinutesAgo = 120;
	const maxMinutesAgo = SIGN_UP_WINDOW_DAYS * MINUTES_PER_DAY;
	const minutesAgo =
		minMinutesAgo + (maxMinutesAgo - minMinutesAgo) * random.next() ** 1.5;
	return subMinutes(now, Math.round(minutesAgo));
}

export async function seedUsers() {
	console.log("Creating users...");

	const random = createRandom(1);
	const nextName = createNameGenerator(random);
	const now = new Date();

	const newAdmin = createUser(random, {
		name: nextName(),
		email: SAMPLE_EMAILS.admin,
		role: Role.ADMIN,
		signedUpAt: subDays(now, SIGN_UP_WINDOW_DAYS),
		background: ORGANIZER_BACKGROUND
	});
	const newJudges = Array.from({ length: JUDGE_COUNT }, (_, index) => {
		const name = nextName();
		return createJudge({
			name,
			email: index === 0 ? SAMPLE_EMAILS.judge : toEmail(name),
			addedAt: subMinutes(
				now,
				random.int(MINUTES_PER_DAY, (SIGN_UP_WINDOW_DAYS - 3) * MINUTES_PER_DAY)
			)
		});
	});
	const newParticipants = Array.from(
		{ length: PARTICIPANT_COUNT },
		(_, index) => {
			const name = nextName();
			return createUser(random, {
				name,
				email: index === 0 ? SAMPLE_EMAILS.participant : toEmail(name),
				role: Role.PARTICIPANT,
				signedUpAt: participantSignUpTime(random, now),
				background: participantBackground(random)
			});
		}
	);

	const users = await db
		.insert(user)
		.values([newAdmin, ...newJudges, ...newParticipants])
		.returning();

	// Signing up through Better Auth would email every seeded address a
	// verification code, so password logins are stored directly instead.
	const passwordHash = await (await auth.$context).password.hash(SEED_PASSWORD);
	await db.insert(account).values(
		users.map((seededUser) => ({
			id: generateId(),
			accountId: seededUser.id,
			providerId: "credential",
			userId: seededUser.id,
			password: passwordHash,
			createdAt: seededUser.createdAt,
			updatedAt: seededUser.createdAt
		}))
	);

	const admin = users.find((seededUser) => seededUser.role === Role.ADMIN);
	if (!admin) throw new Error("Failed to create the admin user.");
	const judges = users.filter((seededUser) => seededUser.role === Role.JUDGE);
	const participants = users.filter(
		(seededUser) => seededUser.role === Role.PARTICIPANT
	);

	console.log(
		`Created 1 admin, ${judges.length} judges and ${participants.length} participants`
	);
	return { admin, judges, participants };
}
