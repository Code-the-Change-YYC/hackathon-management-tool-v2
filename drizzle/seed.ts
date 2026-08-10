import { generateId } from "better-auth";
import { createOrGetUser } from "drizzle/seedUtils";
import { and, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { member, organization, user } from "@/server/db/auth-schema";
import { event, eventAttendance } from "@/server/db/event-schema";
import {
	hackathonSettings,
	judgingAssignments,
	judgingRoomStaff,
	judgingRooms,
	judgingRounds
} from "@/server/db/schema";
import { criteria, scores } from "@/server/db/scores-schema";
import { EventStatus, EventType } from "@/types/types";

function getEventDate(dayOffset: number, hour: number) {
	const date = new Date();
	date.setHours(hour, 0, 0, 0);
	date.setDate(date.getDate() + dayOffset);
	return date;
}

async function main() {
	console.log("Starting seed...");

	const adminEmail = process.env.ADMIN_EMAIL || "admin@hackathon.com";
	const adminPassword = process.env.ADMIN_PASSWORD || "Password123!";
	const adminName = process.env.ADMIN_NAME || "Admin User";

	const judgeEmails = [
		"judge1@hackathon.com",
		"judge2@hackathon.com",
		"judge3@hackathon.com"
	];

	const participantEmail =
		process.env.PARTICIPANT_EMAIL || "participant@hackathon.com";
	const participantPassword =
		process.env.PARTICIPANT_PASSWORD || "Password123!";
	const participantName = process.env.PARTICIPANT_NAME || "Participant User";

	try {
		console.log("Creating admin user...");

		const adminUser = await createOrGetUser({
			email: adminEmail,
			password: adminPassword,
			name: adminName,
			role: "admin"
		});

		for (const email of judgeEmails) {
			await createOrGetUser({
				email,
				password: "Password123!",
				name: email.split("@")[0] ?? "Unknown Judge".toUpperCase(),
				role: "judge"
			});
		}

		const judges = await db.select().from(user).where(eq(user.role, "judge"));

		const participantUser = await createOrGetUser({
			email: participantEmail,
			password: participantPassword,
			name: participantName,
			role: "participant"
		});

		await db
			.update(user)
			.set({
				role: "participant",
				dietaryRestrictions: ["halal", "gluten_free"],
				school: "Hackathon University",
				program: "computer_science",
				completedRegistration: true
			})
			.where(eq(user.id, participantUser.id));

		console.log("\nCreating Teams...");

		const orgs = [
			{ name: "Team One", slug: "team-1" },
			{ name: "Team Two", slug: "team-2" },
			{ name: "Team Three", slug: "team-3" },
			{ name: "Team Four", slug: "team-4" },
			{ name: "Team Five", slug: "team-5" },
			{ name: "Team Six", slug: "team-6" }
		];

		const createdTeams = [];

		for (const org of orgs) {
			try {
				// Check if organization already exists
				const existingOrg = await db
					.select()
					.from(organization)
					.where(eq(organization.slug, org.slug))
					.limit(1);

				if (existingOrg.length > 0) {
					const firstOrg = existingOrg[0];
					if (firstOrg) {
						createdTeams.push(firstOrg);
						console.log(`Team already exists: ${org.name}`);
					}
					continue;
				}

				// Create organization directly in database
				const [newOrg] = await db
					.insert(organization)
					.values({
						id: generateId(),
						name: org.name,
						slug: org.slug,
						createdAt: new Date()
					})
					.returning();

				// Add admin user as owner of the organization
				if (newOrg) {
					await db.insert(member).values({
						id: generateId(),
						organizationId: newOrg.id,
						userId: adminUser.id,
						role: "owner",
						createdAt: new Date()
					});

					createdTeams.push(newOrg);
					console.log(`Created Team: ${org.name}`);
				} else {
					console.error(
						`Failed to create member for team: ${org.name} (team not created)`
					);
				}
			} catch (error) {
				console.error(`Failed to create ${org.name}:`, error);
			}
		}

		const participantTeam = createdTeams[0];
		if (participantTeam) {
			const existingMembership = await db
				.select({ id: member.id })
				.from(member)
				.where(
					and(
						eq(member.organizationId, participantTeam.id),
						eq(member.userId, participantUser.id)
					)
				)
				.limit(1);

			if (existingMembership.length === 0) {
				await db.insert(member).values({
					id: generateId(),
					organizationId: participantTeam.id,
					userId: participantUser.id,
					role: "member",
					createdAt: new Date()
				});
				console.log(`Added participant to ${participantTeam.name}`);
			}
		}

		console.log("\nCreating meals and sample attendance...");
		const mealSchedule = [
			{ title: "Day 1 Breakfast", day: 0, startHour: 8, endHour: 10 },
			{ title: "Day 1 Lunch", day: 0, startHour: 12, endHour: 14 },
			{ title: "Day 1 Dinner", day: 0, startHour: 18, endHour: 20 },
			{ title: "Day 2 Breakfast", day: 1, startHour: 8, endHour: 10 },
			{ title: "Day 2 Lunch", day: 1, startHour: 12, endHour: 14 },
			{ title: "Day 2 Dinner", day: 1, startHour: 18, endHour: 20 }
		];
		const createdMeals = [];

		for (const scheduledMeal of mealSchedule) {
			const startTime = getEventDate(
				scheduledMeal.day,
				scheduledMeal.startHour
			);
			const endTime = getEventDate(scheduledMeal.day, scheduledMeal.endHour);
			const [existingMeal] = await db
				.select()
				.from(event)
				.where(
					and(
						eq(event.title, scheduledMeal.title),
						eq(event.startTime, startTime),
						eq(event.type, EventType.FOOD)
					)
				)
				.limit(1);

			const [createdMeal] = existingMeal
				? await db
						.update(event)
						.set({ endTime, status: EventStatus.ACTIVE })
						.where(eq(event.id, existingMeal.id))
						.returning()
				: await db
						.insert(event)
						.values({
							title: scheduledMeal.title,
							type: EventType.FOOD,
							status: EventStatus.ACTIVE,
							startTime,
							endTime
						})
						.returning();

			if (createdMeal) {
				createdMeals.push(createdMeal);
			}
		}

		const attendanceSamples = [
			{ seededMeal: createdMeals[0], attendees: [participantUser] }
		];

		for (const { seededMeal, attendees } of attendanceSamples) {
			if (!seededMeal) continue;

			for (const attendee of attendees) {
				await db
					.insert(eventAttendance)
					.values({ eventId: seededMeal.id, userId: attendee.id })
					.onConflictDoNothing({
						target: [eventAttendance.userId, eventAttendance.eventId]
					});
			}
		}

		console.log(`Created or updated ${createdMeals.length} meals`);

		console.log("\nCreating Judging rounds...");
		const [round1] = await db
			.insert(judgingRounds)
			.values({
				name: "Preliminary Round",
				startTime: new Date(),
				endTime: new Date(Date.now() + 3600 * 1000)
			})
			.returning();

		const [round2] = await db
			.insert(judgingRounds)
			.values({
				name: "Finals",
				startTime: new Date(Date.now() + 7200 * 1000),
				endTime: new Date(Date.now() + 10800 * 1000)
			})
			.returning();

		if (round1) {
			console.log("\nCreating hackathon settings...");
			await db
				.insert(hackathonSettings)
				.values({
					id: 1,
					startDate: getEventDate(0, 8),
					endDate: getEventDate(1, 20),
					isActive: true,
					currentRoundId: round1.id
				})
				.onConflictDoUpdate({
					target: hackathonSettings.id,
					set: {
						startDate: getEventDate(0, 8),
						endDate: getEventDate(1, 20),
						isActive: true,
						currentRoundId: round1.id
					}
				});
		}

		console.log("\nCreating Main Criteria and Sidepots...");
		const criteriaList = await db
			.insert(criteria)
			.values([
				{ name: "Technical Execution", maxScore: 10, isSidepot: false },
				{ name: "Innovation", maxScore: 10, isSidepot: false },
				{ name: "Best use of AI", maxScore: 5, isSidepot: true },
				{ name: "Best UI", maxScore: 5, isSidepot: true }
			])
			.returning();

		console.log("\nCreating Judging Assignments and Random Scores...");
		const rounds = [round1, round2].filter(Boolean);

		for (const round of rounds) {
			if (!round) continue;
			for (const judge of judges) {
				const [room] = await db
					.insert(judgingRooms)
					.values({
						roundId: round.id,
						roomLink: "https://zoom.us/"
					})
					.returning();

				if (room) {
					await db.insert(judgingRoomStaff).values({
						roomId: room.id,
						staffId: judge.id
					});

					for (const team of createdTeams) {
						const [assignment] = await db
							.insert(judgingAssignments)
							.values({
								teamId: team.id,
								roomId: room.id,
								timeSlot: new Date()
							})
							.returning();

						// Only add scores if not team 6 to test create score functionality
						if (assignment && team.slug !== "team-6") {
							const scoreValues = criteriaList.map((crit) => ({
								assignmentId: assignment.id,
								criteriaId: crit.id,
								value: Math.floor(Math.random() * (crit.maxScore + 1))
							}));
							await db.insert(scores).values(scoreValues);
						}
					}
				}
			}
		}

		// ==================== SUMMARY ====================
		console.log("\nSeed completed successfully!\n");
		console.log("Summary:");
		console.log(`Admin user: ${adminEmail}`);
		console.log(`Organizations created: ${orgs.length}`);
		console.log(`Meals created or updated: ${createdMeals.length}`);
		console.log(`Participant user: ${participantEmail}`);
		console.log("\nLogin credentials:");
		console.log(`   Email: ${adminEmail}`);
		console.log(`   Password: ${adminPassword}`);
		console.log("remember to change this email in prod");

		process.exit(0);
	} catch (error) {
		console.error("Seed failed:", error);
		process.exit(1);
	}
}

main();
