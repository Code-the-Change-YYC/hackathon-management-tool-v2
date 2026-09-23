"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import z from "zod";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { db } from "@/server/db";
import { criteria } from "@/server/db/scores-schema";
import { Role } from "@/types/types";

const criteriaFieldsSchema = z.object({
	name: z.string().trim().min(1).optional(),
	description: z.string().optional(),
	displayOrder: z.number().int().optional(),
	maxScore: z.number().int().optional(),
	isSidepot: z.boolean().optional()
});

const createCriteriaSchema = criteriaFieldsSchema.extend({
	name: z.string().trim().min(1),
	description: z.string().default(""),
	displayOrder: z.number().int().default(0),
	maxScore: z.number().int().default(10),
	isSidepot: z.boolean().default(false)
});

const updateCriteriaSchema = criteriaFieldsSchema
	.extend({ id: z.string().uuid() })
	.refine(
		({ id: _id, ...data }) =>
			Object.values(data).some((value) => value !== undefined),
		"At least one criteria field must be provided."
	);

const deleteCriteriaSchema = z.object({ id: z.string().uuid() });

export type CreateCriteriaInput = z.input<typeof createCriteriaSchema>;
export type UpdateCriteriaInput = z.input<typeof updateCriteriaSchema>;
export type DeleteCriteriaInput = z.input<typeof deleteCriteriaSchema>;

async function requireAdmin() {
	await requireRole([Role.ADMIN]);
}

function revalidateCriteriaPages() {
	revalidatePath("/");
	revalidatePath("/admin");
}

export async function createCriteria(input: CreateCriteriaInput) {
	await requireAdmin();
	const data = createCriteriaSchema.parse(input);
	const [created] = await db.insert(criteria).values(data).returning();

	revalidateCriteriaPages();
	return created;
}

export async function updateCriteria(input: UpdateCriteriaInput) {
	await requireAdmin();
	const { id, ...data } = updateCriteriaSchema.parse(input);
	const [updated] = await db
		.update(criteria)
		.set(data)
		.where(eq(criteria.id, id))
		.returning();

	revalidateCriteriaPages();
	return updated;
}

export async function deleteCriteria(input: DeleteCriteriaInput) {
	await requireAdmin();
	const { id } = deleteCriteriaSchema.parse(input);
	await db.delete(criteria).where(eq(criteria.id, id));

	revalidateCriteriaPages();
	return { success: true };
}
