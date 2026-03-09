import { MEMBER_ROLE_VALUES } from "@/constants/member-roles";
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

export const MEMBER_ROLES = {
	OWNER: "owner",
	MEMBER: "member",
	ADMIN: "admin"
} as const;

export const ALL_ROLES: Role[] = [Role.ADMIN, Role.JUDGE, Role.PARTICIPANT];

export const ALL_ORGANIZATION_ROLES: OrganizationRole[] = [
	OrganizationRole.MEMBER,
	OrganizationRole.ADMIN,
	OrganizationRole.OWNER
];
