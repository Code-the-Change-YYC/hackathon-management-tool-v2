import type {
	OrganizationInsertType,
	OrganizationSelectType,
	UserInsertType,
	UserSelectType
} from "@/server/db/auth-schema";
import { PROGRAMS } from "@/server/db/auth-schema";

export type User = UserSelectType;
export type UserInsert = UserInsertType;

export type Organization = OrganizationSelectType;
export type OrganizationInsert = OrganizationInsertType;

export { PROGRAMS };
export type Program = (typeof PROGRAMS)[number];

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
};

export const ALL_ROLES: Role[] = [Role.ADMIN, Role.JUDGE, Role.PARTICIPANT];

export const ALL_ORGANIZATION_ROLES: OrganizationRole[] = [
	OrganizationRole.MEMBER,
	OrganizationRole.ADMIN,
	OrganizationRole.OWNER
];
