import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// [0, 1, …, length - 1], e.g. for rendering a fixed number of skeleton rows.
export function range(length: number) {
	return Array.from({ length }, (_, index) => index);
}

// Types for the result object with discriminated union
type Success<T> = {
	data: T;
	error: null;
};

type Failure<E> = {
	data: null;
	error: E;
};

type Result<T, E = Error> = Success<T> | Failure<E>;

// Main wrapper function
export async function tryCatch<T, E = Error>(
	promise: Promise<T>
): Promise<Result<T, E>> {
	try {
		const data = await promise;
		return { data, error: null };
	} catch (error) {
		return { data: null, error: error as E };
	}
}

// Letters from any language (including accents), numbers, spaces, hyphens, underscores.
export const TEAM_NAME_PATTERN = /^[\p{L}\p{M}\p{N} _-]+$/u;
export const TEAM_NAME_MAX = 50;

export function isValidTeamName(name: string): boolean {
	const trimmed = name.trim();
	return (
		trimmed.length > 0 &&
		trimmed.length <= TEAM_NAME_MAX &&
		TEAM_NAME_PATTERN.test(trimmed)
	);
}
