import type { UserSelectType } from "@/server/db/auth-schema";

export type User = UserSelectType;

export enum Role {
	ADMIN = "admin",
	JUDGE = "judge",
	PARTICIPANT = "participant",
}

export enum OrganizationRole {
	MEMBER = "member",
	ADMIN = "admin",
	OWNER = "owner",
}

export const ALL_ROLES: Role[] = [Role.ADMIN, Role.JUDGE, Role.PARTICIPANT];

export const ALL_ORGANIZATION_ROLES: OrganizationRole[] = [
	OrganizationRole.MEMBER,
	OrganizationRole.ADMIN,
	OrganizationRole.OWNER,
];
