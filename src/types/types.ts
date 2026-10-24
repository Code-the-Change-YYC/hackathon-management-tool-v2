// Type-only, so client components that import from this file don't bundle
// drizzle-orm and the database schema
import type {
	OrganizationInsertType,
	OrganizationSelectType,
	PRESCREEN_STATUS_VALUES,
	PROGRAMS,
	UserInsertType,
	UserSelectType
} from "@/server/db/auth-schema";

export type User = UserSelectType;
export type UserInsert = UserInsertType;

export type Organization = OrganizationSelectType;
export type OrganizationInsert = OrganizationInsertType;

export type Program = (typeof PROGRAMS)[number];
export type PrescreenStatus = (typeof PRESCREEN_STATUS_VALUES)[number];

export enum Role {
	ADMIN = "admin",
	JUDGE = "judge",
	PARTICIPANT = "participant"
}

export enum OrganizationRole {
	MEMBER = "member",
	ADMIN = "admin",
	OWNER = "owner"
}

export enum EventType {
	FOOD = "food",
	ACTIVITY = "activity",
	PROJECT = "project",
	CEREMONY = "ceremony"
}

export enum EventStatus {
	DRAFT = "draft",
	ACTIVE = "active"
}

export enum EventTicketStatus {
	ACTIVE = "active",
	ALREADY_CHECKED_IN = "already_checked_in"
}

export const EVENT_TICKET_TOKEN_PATTERN = /^evt1_[A-Za-z0-9_-]{43}$/;

export const EVENT_TYPES = [
	EventType.FOOD,
	EventType.ACTIVITY,
	EventType.PROJECT,
	EventType.CEREMONY
] as const;

export const EVENT_STATUSES = [EventStatus.DRAFT, EventStatus.ACTIVE] as const;

export const QR_EVENT_TYPES = [EventType.FOOD, EventType.ACTIVITY] as const;

export const MEMBER_ROLES = {
	OWNER: "owner",
	MEMBER: "member",
	ADMIN: "admin"
} as const;

export type TeamRanking = {
	id: string;
	name: string;
	totalScore: number;
	submittedScorecards: number;
	expectedScorecards: number;
	legacyScores: number;
};

export const ALL_ROLES: Role[] = [Role.ADMIN, Role.JUDGE, Role.PARTICIPANT];

export const ALL_ORGANIZATION_ROLES: OrganizationRole[] = [
	OrganizationRole.MEMBER,
	OrganizationRole.ADMIN,
	OrganizationRole.OWNER
];
