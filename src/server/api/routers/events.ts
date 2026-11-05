import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, gt } from "drizzle-orm";
import { z } from "zod";
import { formatDateKey, isSameCalgaryDay } from "@/lib/datetime";
import {
	createEventTicketToken,
	hashEventTicketToken,
	isValidMealScannerLease
} from "@/lib/event-tickets";
import { eventNavigationUrlSchema } from "@/lib/participant-events";
import {
	EVENT_DESCRIPTION_MAX_LENGTH,
	EVENT_LOCATION_MAX_LENGTH,
	EVENT_TITLE_MAX_LENGTH,
	isDuringHackathon,
	outsideHackathonMessage,
	toHackathonDates
} from "@/lib/validation/event";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import type { db as dbType } from "@/server/db";
import { hackathonSettings } from "@/server/db/admin-schema";
import { user } from "@/server/db/auth-schema";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import {
	EVENT_STATUSES,
	EVENT_TICKET_TOKEN_PATTERN,
	EVENT_TYPES,
	EventStatus,
	EventTicketStatus,
	EventType,
	QR_EVENT_TYPES,
	Role
} from "@/types/types";

const eventInputSchema = z
	.object({
		title: z.string().trim().min(1).max(EVENT_TITLE_MAX_LENGTH),
		description: z.string().trim().min(1).max(EVENT_DESCRIPTION_MAX_LENGTH),
		location: z.string().trim().max(EVENT_LOCATION_MAX_LENGTH).nullable(),
		navigationUrl: eventNavigationUrlSchema.nullable(),
		type: z.enum(EVENT_TYPES),
		mealRounds: z.number().int().min(1).max(2_147_483_647).default(1),
		status: z.enum(EVENT_STATUSES),
		startTime: z.coerce.date(),
		endTime: z.coerce.date()
	})
	.refine((data) => data.type === EventType.FOOD || data.mealRounds === 1, {
		message: "Only meals can have multiple scans.",
		path: ["mealRounds"]
	})
	.refine((data) => data.endTime > data.startTime, {
		message: "End time must be after start time.",
		path: ["endTime"]
	})
	.refine((data) => isSameCalgaryDay(data.startTime, data.endTime), {
		message: "End time must be on the same day as the start time.",
		path: ["endTime"]
	});

async function assertDuringHackathon(db: typeof dbType, startTime: Date) {
	const settings = await db.query.hackathonSettings.findFirst({
		where: eq(hackathonSettings.id, 1)
	});
	const hackathonDates = toHackathonDates(settings ?? null);
	if (
		hackathonDates &&
		!isDuringHackathon(formatDateKey(startTime), hackathonDates)
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: outsideHackathonMessage(hackathonDates)
		});
	}
}

const eventIdSchema = z.object({ id: z.string().uuid() });

const eventNotFound = () =>
	new TRPCError({ code: "NOT_FOUND", message: "Event not found." });

const notCheckedIn = () =>
	new TRPCError({
		code: "FORBIDDEN",
		message: "This participant has not checked in yet."
	});

function mealPreferenceRequired(wantsFood: boolean | null | undefined) {
	return new TRPCError({
		code: "FORBIDDEN",
		message:
			wantsFood === false
				? "You opted out of meals during onboarding."
				: "Complete your meal preferences during onboarding to receive a meal ticket."
	});
}

const ticketTokenSchema = z
	.string()
	.regex(EVENT_TICKET_TOKEN_PATTERN, "Invalid event ticket format.");

function supportsQrTickets(type: EventType) {
	return QR_EVENT_TYPES.some((qrType) => qrType === type);
}

export const eventsRouter = createTRPCRouter({
	addEvent: adminProcedure
		.input(eventInputSchema)
		.mutation(async ({ input, ctx }) => {
			await assertDuringHackathon(ctx.db, input.startTime);
			const [newEvent] = await ctx.db.insert(event).values(input).returning();
			return newEvent;
		}),

	updateEvent: adminProcedure
		.input(eventInputSchema.and(eventIdSchema))
		.mutation(async ({ ctx, input: { id, ...values } }) => {
			await assertDuringHackathon(ctx.db, values.startTime);
			return ctx.db.transaction(async (tx) => {
				const [updated] = await tx
					.update(event)
					.set(values)
					.where(eq(event.id, id))
					.returning();
				if (!updated) throw eventNotFound();
				const [overLimit] = await tx
					.select({ userId: eventAttendance.userId })
					.from(eventAttendance)
					.where(eq(eventAttendance.eventId, id))
					.groupBy(eventAttendance.userId)
					.having(gt(count(eventAttendance.id), updated.mealRounds))
					.limit(1);
				if (overLimit) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message:
							"The scan allowance cannot be lower than scans already used."
					});
				}
				await tx
					.update(eventTicket)
					.set({ expiresAt: updated.endTime })
					.where(eq(eventTicket.eventId, id));
				return updated;
			});
		}),

	deleteEvent: adminProcedure
		.input(eventIdSchema)
		.mutation(async ({ ctx, input }) => {
			const [deleted] = await ctx.db
				.delete(event)
				.where(eq(event.id, input.id))
				.returning({ id: event.id });
			if (!deleted) throw eventNotFound();
			return deleted;
		}),

	getAllEvents: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.query.event.findMany({
			orderBy: [asc(event.startTime)]
		});
	}),

	getActiveEvents: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.query.event.findMany({
			where: eq(event.status, EventStatus.ACTIVE),
			orderBy: [asc(event.startTime)]
		});
	}),

	issueParticipantEventTicket: protectedProcedure
		.input(z.object({ eventId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			if (ctx.session.user.role !== Role.PARTICIPANT) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			if (!ctx.session.user.checkedIn) {
				throw notCheckedIn();
			}

			return ctx.db.transaction(async (tx) => {
				const ticketEvent = await tx.query.event.findFirst({
					where: eq(event.id, input.eventId)
				});

				if (!ticketEvent) throw eventNotFound();

				if (!supportsQrTickets(ticketEvent.type)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event does not support QR tickets."
					});
				}

				if (ticketEvent.type === EventType.FOOD) {
					const participant = await tx.query.user.findFirst({
						where: eq(user.id, ctx.session.user.id),
						columns: { wantsFood: true }
					});
					if (participant?.wantsFood !== true) {
						throw mealPreferenceRequired(participant?.wantsFood);
					}
				}

				if (ticketEvent.status !== EventStatus.ACTIVE) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event is not active."
					});
				}

				const now = new Date();
				if (ticketEvent.endTime <= now) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event has ended."
					});
				}

				await tx
					.select({ id: eventTicket.id })
					.from(eventTicket)
					.where(
						and(
							eq(eventTicket.userId, ctx.session.user.id),
							eq(eventTicket.eventId, input.eventId)
						)
					)
					.for("update");

				const attendance = await tx.query.eventAttendance.findMany({
					columns: { createdAt: true },
					where: and(
						eq(eventAttendance.userId, ctx.session.user.id),
						eq(eventAttendance.eventId, input.eventId)
					),
					orderBy: [desc(eventAttendance.createdAt)]
				});

				const eventDetails = {
					id: ticketEvent.id,
					title: ticketEvent.title,
					type: ticketEvent.type,
					startTime: ticketEvent.startTime,
					endTime: ticketEvent.endTime
				};
				const scanLimit =
					ticketEvent.type === EventType.FOOD ? ticketEvent.mealRounds : 1;

				if (attendance.length >= scanLimit && attendance[0]) {
					return {
						status: EventTicketStatus.ALREADY_CHECKED_IN,
						checkedInAt: attendance[0].createdAt,
						scansUsed: attendance.length,
						scanLimit,
						event: eventDetails
					} as const;
				}

				const token = createEventTicketToken(
					input.eventId,
					ctx.session.user.id
				);
				const tokenHash = hashEventTicketToken(token);
				await tx
					.insert(eventTicket)
					.values({
						userId: ctx.session.user.id,
						eventId: input.eventId,
						tokenHash,
						expiresAt: ticketEvent.endTime
					})
					.onConflictDoUpdate({
						target: [eventTicket.userId, eventTicket.eventId],
						// Same hash on every visit; this only replaces rows from
						// random tokens or an older secret.
						set: {
							tokenHash,
							expiresAt: ticketEvent.endTime,
							updatedAt: now
						}
					});

				return {
					status: EventTicketStatus.ACTIVE,
					token,
					scansUsed: attendance.length,
					scanLimit,
					event: eventDetails
				} as const;
			});
		}),

	redeemEventTicket: adminProcedure
		.input(
			z.object({
				eventId: z.string().uuid(),
				token: ticketTokenSchema,
				scannerLease: z.string().optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			return ctx.db.transaction(async (tx) => {
				const [ticket] = await tx
					.select({
						id: eventTicket.id,
						userId: eventTicket.userId,
						eventId: eventTicket.eventId,
						expiresAt: eventTicket.expiresAt,
						participantName: user.name,
						participantEmail: user.email,
						participantDietaryRestrictions: user.dietaryRestrictions,
						participantRole: user.role,
						participantCheckedIn: user.checkedIn,
						participantWantsFood: user.wantsFood,
						eventMealRounds: event.mealRounds,
						eventTitle: event.title,
						eventType: event.type,
						eventStatus: event.status,
						eventStartTime: event.startTime,
						eventEndTime: event.endTime
					})
					.from(eventTicket)
					.innerJoin(user, eq(eventTicket.userId, user.id))
					.innerJoin(event, eq(eventTicket.eventId, event.id))
					.where(eq(eventTicket.tokenHash, hashEventTicketToken(input.token)))
					.limit(1)
					.for("update");

				if (!ticket) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "This event ticket is invalid or has been replaced."
					});
				}

				if (ticket.participantRole !== Role.PARTICIPANT) {
					throw new TRPCError({
						code: "FORBIDDEN",
						message: "Only participant tickets can be redeemed."
					});
				}

				if (!ticket.participantCheckedIn) {
					throw notCheckedIn();
				}

				if (
					ticket.eventType === EventType.FOOD &&
					ticket.participantWantsFood !== true
				) {
					throw mealPreferenceRequired(ticket.participantWantsFood);
				}

				if (ticket.eventId !== input.eventId) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This ticket belongs to a different event."
					});
				}

				if (!supportsQrTickets(ticket.eventType)) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event does not support QR check-in."
					});
				}

				if (ticket.eventStatus !== EventStatus.ACTIVE) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event is not active."
					});
				}

				const now = new Date();
				if (ticket.eventStartTime > now) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event has not started yet."
					});
				}

				const canFinishMealLine =
					ticket.eventType === EventType.FOOD &&
					isValidMealScannerLease(
						input.scannerLease,
						ticket.eventId,
						ctx.session.user.id,
						now,
						ticket.eventEndTime
					);
				if (
					(ticket.expiresAt <= now || ticket.eventEndTime <= now) &&
					!canFinishMealLine
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event ticket has expired."
					});
				}

				// The locked ticket row serializes scans for this participant and event.
				const previousScans = await tx.query.eventAttendance.findMany({
					columns: { id: true, createdAt: true },
					where: and(
						eq(eventAttendance.userId, ticket.userId),
						eq(eventAttendance.eventId, ticket.eventId)
					),
					orderBy: [desc(eventAttendance.createdAt)]
				});
				const scanLimit =
					ticket.eventType === EventType.FOOD ? ticket.eventMealRounds : 1;
				const alreadyCheckedIn = previousScans.length >= scanLimit;
				const attendance = alreadyCheckedIn
					? previousScans[0]
					: (
							await tx
								.insert(eventAttendance)
								.values({
									eventId: ticket.eventId,
									userId: ticket.userId
								})
								.returning()
						)[0];
				if (!attendance) {
					throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
				}

				return {
					status: alreadyCheckedIn
						? ("already_checked_in" as const)
						: ("checked_in" as const),
					attendanceId: attendance.id,
					checkedInAt: attendance.createdAt,
					scansUsed: alreadyCheckedIn
						? previousScans.length
						: previousScans.length + 1,
					scanLimit,
					participant: {
						id: ticket.userId,
						name: ticket.participantName,
						email: ticket.participantEmail,
						dietaryRestrictions: ticket.participantDietaryRestrictions
					},
					event: {
						id: ticket.eventId,
						title: ticket.eventTitle,
						type: ticket.eventType
					}
				};
			});
		})
});
