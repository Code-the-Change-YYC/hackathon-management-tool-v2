/**
 * Preset avatars participants can pick from. The images live in
 * `public/avatars` and a user's choice is stored as its path in `user.image`,
 * so anything that renders `user.image` shows the avatar without extra lookups.
 */
export const AVATAR_IDS = [
	"magnifying-glass",
	"flag",
	"trophy",
	"pizza",
	"question",
	"breakfast",
	"gift",
	"megaphone",
	"cola",
	"discord",
	"star",
	"ice-cream"
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_LABELS = {
	"magnifying-glass": "Magnifying glass",
	flag: "Flag",
	trophy: "Trophy",
	pizza: "Pizza",
	question: "Question marks",
	breakfast: "Breakfast",
	gift: "Gift",
	megaphone: "Megaphone",
	cola: "Cola",
	discord: "Discord",
	star: "Star",
	"ice-cream": "Ice cream"
} satisfies Record<AvatarId, string>;

export const DEFAULT_AVATAR_ID: AvatarId = "star";

export function getAvatarSrc(avatarId: AvatarId) {
	return `/avatars/${avatarId}.webp`;
}

export function isAvatarId(value: unknown): value is AvatarId {
	return AVATAR_IDS.some((avatarId) => avatarId === value);
}

/** The preset a stored image points at, if it is one of ours. */
export function getAvatarId(image: string | null | undefined) {
	return AVATAR_IDS.find((avatarId) => getAvatarSrc(avatarId) === image);
}

/** The image to show for a user, falling back to the default preset. */
export function resolveAvatarSrc(image: string | null | undefined) {
	return image || getAvatarSrc(DEFAULT_AVATAR_ID);
}
