import { eq } from "drizzle-orm";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import { Role, type User } from "@/types/types";

type CreateUserInput = {
	email: string;
	password: string;
	name: string;
	role?: User["role"];
};

async function createOrGetUser({
	email,
	password,
	name,
	role
}: CreateUserInput): Promise<User> {
	const existingUser = await db.query.user.findFirst({
		where: eq(user.email, email)
	});

	if (existingUser) {
		console.log(`User already exists: ${email}`);
		return existingUser as User;
	}

	// Create user via Better Auth
	const res = await auth.api.signUpEmail({
		body: {
			name,
			email,
			password
		}
	});

	console.log(`User created: ${email}`);

	// Optionally update role
	if (role) {
		await db.update(user).set({ role }).where(eq(user.email, email));

		console.log(`User role updated to ${role.toUpperCase()}`);
	}

	return res.user as User;
}

const DEFAULT_PASSWORD = "Password123!";
const JUDGE_EMAILS = [
	"judge1@hackathon.com",
	"judge2@hackathon.com",
	"judge3@hackathon.com"
];

export type SeedUsersResult = {
	adminUser: User;
	judges: User[];
	participantUser: User;
	credentials: {
		adminEmail: string;
		adminPassword: string;
		participantEmail: string;
	};
};

export async function seedUsers(): Promise<SeedUsersResult> {
	console.log("Creating users...");

	const adminEmail = process.env.ADMIN_EMAIL || "admin@hackathon.com";
	const adminPassword = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
	const adminName = process.env.ADMIN_NAME || "Admin User";
	const participantEmail =
		process.env.PARTICIPANT_EMAIL || "participant@hackathon.com";
	const participantPassword =
		process.env.PARTICIPANT_PASSWORD || DEFAULT_PASSWORD;
	const participantName = process.env.PARTICIPANT_NAME || "Participant User";

	const adminUser = await createOrGetUser({
		email: adminEmail,
		password: adminPassword,
		name: adminName,
		role: Role.ADMIN
	});

	for (const email of JUDGE_EMAILS) {
		await createOrGetUser({
			email,
			password: DEFAULT_PASSWORD,
			name: email.split("@")[0] ?? "Unknown Judge".toUpperCase(),
			role: Role.JUDGE
		});
	}

	// Include both newly created and existing judges in downstream judging data.
	const judges = (await db.query.user.findMany({
		where: eq(user.role, Role.JUDGE)
	})) as User[];

	const participantUser = await createOrGetUser({
		email: participantEmail,
		password: participantPassword,
		name: participantName,
		role: Role.PARTICIPANT
	});

	// Complete the sample participant profile for registration-dependent flows.
	await db
		.update(user)
		.set({
			role: Role.PARTICIPANT,
			dietaryRestrictions: ["halal", "gluten_free"],
			school: "Hackathon University",
			program: "computer_science",
			completedRegistration: true
		})
		.where(eq(user.id, participantUser.id));

	return {
		adminUser,
		judges,
		participantUser,
		credentials: { adminEmail, adminPassword, participantEmail }
	};
}
