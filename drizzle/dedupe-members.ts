// Run before pushing the `member_userId_idx` unique index (see
// src/server/db/auth-schema.ts). This repo uses `drizzle-kit push` rather
// than generated SQL migrations, so there's no migration file to attach a
// backfill to; instead this script is a one-off backfill: it finds any user
// who already belongs to more than one team, keeps their oldest membership
// (preferring an OWNER row if one exists), and deletes the rest so the
// unique index can be created without failing on pre-existing duplicates.
// Safe to run repeatedly - it's a no-op once there are no duplicates left.
import { asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { member } from "@/server/db/auth-schema";
import { MEMBER_ROLES } from "@/types/types";

async function main() {
	const duplicateUserIds = await db
		.select({ userId: member.userId })
		.from(member)
		.groupBy(member.userId)
		.having(sql`count(*) > 1`);

	if (duplicateUserIds.length === 0) {
		console.log("No duplicate memberships found, nothing to do.");
		return;
	}

	console.log(
		`Found ${duplicateUserIds.length} user(s) with more than one membership.`
	);

	for (const { userId } of duplicateUserIds) {
		const memberships = await db
			.select()
			.from(member)
			.where(eq(member.userId, userId))
			.orderBy(asc(member.createdAt));

		const keep =
			memberships.find((m) => m.role === MEMBER_ROLES.OWNER) ?? memberships[0];
		const toDelete = memberships
			.filter((m) => m.id !== keep?.id)
			.map((m) => m.id);

		if (toDelete.length > 0) {
			await db.delete(member).where(inArray(member.id, toDelete));
			console.log(
				`User ${userId}: kept membership ${keep?.id}, removed ${toDelete.length} duplicate(s).`
			);
		}
	}

	console.log("Done.");
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
