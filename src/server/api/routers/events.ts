import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { formatDateKey, isSameCalgaryDay } from "@/lib/datetime";
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
	createEventTicketToken,
	hashEventTicketToken,
	isValidMealScannerLease,
	mealAvailabilityEnd
} from "@/server/lib/event-tickets";
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
		status: z.enum(EVENT_STATUSES),
		startTime: z.coerce.date(),
		endTime: z.coerce.date(),
		lastCallEndsAt: z.coerce.date().nullable().optional()
	})
	.refine((data) => data.endTime > data.startTime, {
		message: "End time must be after start time.",
		path: ["endTime"]
	})
	.refine((data) => isSameCalgaryDay(data.startTime, data.endTime), {
		message: "End time must be on the same day as the start time.",
		path: ["endTime"]
	})
	.refine(
		(data) =>
			data.type !== EventType.FOOD ||
			!data.lastCallEndsAt ||
			data.lastCallEndsAt >= data.endTime,
		{
			message: "Last call must end at or after the meal end time.",
			path: ["lastCallEndsAt"]
		}
	);

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

const ticketTokenSchema = z
	.string()
	.regex(EVENT_TICKET_TOKEN_PATTERN, "Invalid event ticket format.");

function assertNoMealStartOverlap(
	candidate: {
		id?: string;
		startTime: Date;
		endTime: Date;
		lastCallEndsAt: Date | null;
	},
	meals: {
		id: string;
		startTime: Date;
		endTime: Date;
		lastCallEndsAt: Date | null;
	}[]
) {
	const lastCall = mealAvailabilityEnd(candidate);
	const overlaps = meals.some(
		(meal) =>
			meal.id !== candidate.id &&
			((meal.startTime >= candidate.startTime && meal.startTime < lastCall) ||
				(candidate.startTime >= meal.startTime &&
					candidate.startTime < mealAvailabilityEnd(meal)))
	);
	if (overlaps) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "A meal's last call cannot overlap another meal's start time."
		});
	}
}

function supportsQrTickets(type: EventType) {
	return QR_EVENT_TYPES.some((qrType) => qrType === type);
}

export const eventsRouter = createTRPCRouter({
	addEvent: adminProcedure
		.input(eventInputSchema)
		.mutation(async ({ input, ctx }) => {
			await assertDuringHackathon(ctx.db, input.startTime);
			return ctx.db.transaction(async (tx) => {
				const values = {
					...input,
					lastCallEndsAt:
						input.type === EventType.FOOD
							? (input.lastCallEndsAt ?? null)
							: null
				};
				if (values.type === EventType.FOOD) {
					await tx.execute(sql`select pg_advisory_xact_lock(9917731)`);
					const meals = await tx.query.event.findMany({
						where: eq(event.type, EventType.FOOD)
					});
					assertNoMealStartOverlap(values, meals);
				}
				const [newEvent] = await tx.insert(event).values(values).returning();
				return newEvent;
			});
		}),

	updateEvent: adminProcedure
		.input(eventInputSchema.and(eventIdSchema))
		.mutation(async ({ ctx, input: { id, ...values } }) => {
			await assertDuringHackathon(ctx.db, values.startTime);
			return ctx.db.transaction(async (tx) => {
				const current = await tx.query.event.findFirst({
					where: eq(event.id, id)
				});
				if (!current) throw eventNotFound();
				const updates = {
					...values,
					lastCallEndsAt:
						values.type === EventType.FOOD
							? (values.lastCallEndsAt ?? null)
							: null
				};
				if (
					updates.type === EventType.FOOD ||
					current.type === EventType.FOOD
				) {
					await tx.execute(sql`select pg_advisory_xact_lock(9917731)`);
					if (updates.type === EventType.FOOD) {
						const meals = await tx.query.event.findMany({
							where: eq(event.type, EventType.FOOD)
						});
						assertNoMealStartOverlap({ id, ...updates }, meals);
					}
				}
				const [updated] = await tx
					.update(event)
					.set(updates)
					.where(eq(event.id, id))
					.returning();
				if (!updated) throw eventNotFound();
				await tx
					.update(eventTicket)
					.set({
						expiresAt:
							updated.type === EventType.FOOD
								? mealAvailabilityEnd(updated)
								: updated.endTime
					})
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

	rotateParticipantEventTicket: protectedProcedure
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

				if (ticketEvent.status !== EventStatus.ACTIVE) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event is not active."
					});
				}

				const now = new Date();
				const availableUntil =
					ticketEvent.type === EventType.FOOD
						? mealAvailabilityEnd(ticketEvent)
						: ticketEvent.endTime;
				if (availableUntil <= now) {
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

				const attendance = await tx.query.eventAttendance.findFirst({
					columns: { createdAt: true },
					where: and(
						eq(eventAttendance.userId, ctx.session.user.id),
						eq(eventAttendance.eventId, input.eventId)
					)
				});

				const eventDetails = {
					id: ticketEvent.id,
					title: ticketEvent.title,
					type: ticketEvent.type,
					startTime: ticketEvent.startTime,
					endTime: ticketEvent.endTime,
					availableUntil
				};

				if (attendance) {
					return {
						status: EventTicketStatus.ALREADY_CHECKED_IN,
						checkedInAt: attendance.createdAt,
						event: eventDetails
					} as const;
				}

				const token = createEventTicketToken();
				await tx
					.insert(eventTicket)
					.values({
						userId: ctx.session.user.id,
						eventId: input.eventId,
						tokenHash: hashEventTicketToken(token),
						expiresAt: availableUntil
					})
					.onConflictDoUpdate({
						target: [eventTicket.userId, eventTicket.eventId],
						set: {
							tokenHash: hashEventTicketToken(token),
							expiresAt: availableUntil,
							updatedAt: now
						}
					});

				return {
					status: EventTicketStatus.ACTIVE,
					token,
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
						participantRole: user.role,
						participantCheckedIn: user.checkedIn,
						eventTitle: event.title,
						eventType: event.type,
						eventStatus: event.status,
						eventStartTime: event.startTime,
						eventEndTime: event.endTime,
						eventLastCallEndsAt: event.lastCallEndsAt
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

				const availableUntil =
					ticket.eventType === EventType.FOOD
						? mealAvailabilityEnd({
								endTime: ticket.eventEndTime,
								lastCallEndsAt: ticket.eventLastCallEndsAt
							})
						: ticket.eventEndTime;
				const canFinishMealLine =
					ticket.eventType === EventType.FOOD &&
					isValidMealScannerLease(
						input.scannerLease,
						ticket.eventId,
						ctx.session.user.id,
						now,
						availableUntil
					);
				if (
					(ticket.eventType === EventType.FOOD
						? availableUntil <= now
						: ticket.expiresAt <= now || ticket.eventEndTime <= now) &&
					!canFinishMealLine
				) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "This event ticket has expired."
					});
				}

				const [record] = await tx
					.insert(eventAttendance)
					.values({
						eventId: ticket.eventId,
						userId: ticket.userId
					})
					.onConflictDoNothing({
						target: [eventAttendance.userId, eventAttendance.eventId]
					})
					.returning();

				const attendance =
					record ??
					(await tx.query.eventAttendance.findFirst({
						where: and(
							eq(eventAttendance.userId, ticket.userId),
							eq(eventAttendance.eventId, ticket.eventId)
						)
					}));
				if (!attendance) {
					throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
				}

				return {
					status: record
						? ("checked_in" as const)
						: ("already_checked_in" as const),
					attendanceId: attendance.id,
					checkedInAt: attendance.createdAt,
					participant: {
						id: ticket.userId,
						name: ticket.participantName,
						email: ticket.participantEmail
					},
					event: {
						id: ticket.eventId,
						title: ticket.eventTitle,
						type: ticket.eventType
					}
				};
			});
		}),

	getEventAttendees: adminProcedure
		.input(z.object({ eventId: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			return ctx.db
				.select({
					id: eventAttendance.id,
					userId: eventAttendance.userId,
					eventId: eventAttendance.eventId,
					userName: user.name,
					createdAt: eventAttendance.createdAt,
					updatedAt: eventAttendance.updatedAt
				})
				.from(eventAttendance)
				.innerJoin(user, eq(eventAttendance.userId, user.id))
				.where(eq(eventAttendance.eventId, input.eventId))
				.orderBy(desc(eventAttendance.createdAt), desc(eventAttendance.id));
		}),

	getMealAttendanceCount: adminProcedure.query(async ({ ctx }) => {
		const [result] = await ctx.db
			.select({
				count: count(eventAttendance.id)
			})
			.from(eventAttendance)
			.innerJoin(event, eq(eventAttendance.eventId, event.id))
			.where(eq(event.type, EventType.FOOD));

		return result?.count ?? 0;
	})
});
