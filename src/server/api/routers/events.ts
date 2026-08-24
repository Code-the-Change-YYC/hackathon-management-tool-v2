import { createHash, randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure
} from "@/server/api/trpc";
import { user } from "@/server/db/auth-schema";
import { event, eventAttendance, eventTicket } from "@/server/db/event-schema";
import {
	EVENT_STATUSES,
	EVENT_TICKET_TOKEN_PATTERN,
	EVENT_TYPES,
	EventStatus,
	EventTicketStatus,
	type EventType,
	QR_EVENT_TYPES,
	Role
} from "@/types/types";

const eventTimeRangeSchema = z
	.object({
		title: z.string().trim().min(1),
		description: z.string().trim().min(1),
		startTime: z.coerce.date(),
		endTime: z.coerce.date()
	})
	.refine((data) => data.endTime > data.startTime, {
		message: "End time must be after start time.",
		path: ["endTime"]
	});

const ticketTokenSchema = z
	.string()
	.regex(EVENT_TICKET_TOKEN_PATTERN, "Invalid event ticket format.");

function hashTicketToken(token: string) {
	return createHash("sha256").update(token).digest("hex");
}

function createTicketToken() {
	return `evt1_${randomBytes(32).toString("base64url")}`;
}

function supportsQrTickets(type: EventType) {
	return QR_EVENT_TYPES.some((qrType) => qrType === type);
}

export const eventsRouter = createTRPCRouter({
	addEvent: adminProcedure
		.input(
			eventTimeRangeSchema.and(
				z.object({
					type: z.enum(EVENT_TYPES),
					status: z.enum(EVENT_STATUSES).default(EventStatus.DRAFT)
				})
			)
		)
		.mutation(async ({ input, ctx }) => {
			const [newEvent] = await ctx.db.insert(event).values(input).returning();
			return newEvent;
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

	getEvent: adminProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ input, ctx }) => {
			const selectedEvent = await ctx.db.query.event.findFirst({
				where: eq(event.id, input.id)
			});
			return selectedEvent ?? null;
		}),

	setEventStatus: adminProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				status: z.enum(EVENT_STATUSES)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [updatedEvent] = await ctx.db
				.update(event)
				.set({ status: input.status })
				.where(eq(event.id, input.id))
				.returning();

			if (!updatedEvent) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Event not found."
				});
			}

			return updatedEvent;
		}),

	rotateParticipantEventTicket: protectedProcedure
		.input(z.object({ eventId: z.string().uuid() }))
		.mutation(async ({ input, ctx }) => {
			if (ctx.session.user.role !== Role.PARTICIPANT) {
				throw new TRPCError({ code: "FORBIDDEN" });
			}

			return ctx.db.transaction(async (tx) => {
				const ticketEvent = await tx.query.event.findFirst({
					where: eq(event.id, input.eventId)
				});

				if (!ticketEvent) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Event not found."
					});
				}

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
					endTime: ticketEvent.endTime
				};

				if (attendance) {
					return {
						status: EventTicketStatus.ALREADY_CHECKED_IN,
						checkedInAt: attendance.createdAt,
						event: eventDetails
					} as const;
				}

				const token = createTicketToken();
				await tx
					.insert(eventTicket)
					.values({
						userId: ctx.session.user.id,
						eventId: input.eventId,
						tokenHash: hashTicketToken(token),
						expiresAt: ticketEvent.endTime
					})
					.onConflictDoUpdate({
						target: [eventTicket.userId, eventTicket.eventId],
						set: {
							tokenHash: hashTicketToken(token),
							expiresAt: ticketEvent.endTime,
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
				token: ticketTokenSchema
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
						eventTitle: event.title,
						eventType: event.type,
						eventStatus: event.status,
						eventStartTime: event.startTime,
						eventEndTime: event.endTime
					})
					.from(eventTicket)
					.innerJoin(user, eq(eventTicket.userId, user.id))
					.innerJoin(event, eq(eventTicket.eventId, event.id))
					.where(eq(eventTicket.tokenHash, hashTicketToken(input.token)))
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

				if (ticket.expiresAt <= now || ticket.eventEndTime <= now) {
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

				if (!record) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Participant is already checked in for this event."
					});
				}

				return {
					attendanceId: record.id,
					checkedInAt: record.createdAt,
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
				.orderBy(eventAttendance.updatedAt);
		})
});
