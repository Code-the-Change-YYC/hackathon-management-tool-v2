"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { tryCatch } from "@/lib/utils";
import {
	type CreateCriteriaInput,
	createCriteria,
	type DeleteCriteriaInput,
	deleteCriteria,
	type UpdateCriteriaInput,
	updateCriteria
} from "./actions";

async function runCriteriaAction<T>(action: Promise<T>): Promise<T> {
	const { data, error } = await tryCatch(action);

	if (error) throw error;
	return data;
}

export function useCreateCriteria() {
	const router = useRouter();

	return useMutation({
		mutationFn: (input: CreateCriteriaInput) =>
			runCriteriaAction(createCriteria(input)),
		onSuccess: () => router.refresh()
	});
}

export function useUpdateCriteria() {
	const router = useRouter();

	return useMutation({
		mutationFn: (input: UpdateCriteriaInput) =>
			runCriteriaAction(updateCriteria(input)),
		onSuccess: () => router.refresh()
	});
}

export function useDeleteCriteria() {
	const router = useRouter();

	return useMutation({
		mutationFn: (input: DeleteCriteriaInput) =>
			runCriteriaAction(deleteCriteria(input)),
		onSuccess: () => router.refresh()
	});
}
