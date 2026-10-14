import type { Metadata } from "next";
import { ProfileView } from "@/app/components/participant/profile/ProfileView";
import { resolveAvatarSrc } from "@/lib/avatars";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { isMlhSchool } from "@/server/mlh-schools";
import { Role } from "@/types/types";

export const metadata: Metadata = {
	title: "Profile | Hack the Change"
};

export default async function ProfilePage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);

	return (
		<ProfileView
			profile={{
				name: user.name,
				email: user.email,
				avatarSrc: resolveAvatarSrc(user.image),
				firstName: user.firstName ?? null,
				lastName: user.lastName ?? null,
				age: user.age ?? null,
				phoneNumber: user.phoneNumber ?? null,
				countryOfResidence: user.countryOfResidence ?? null,
				school: user.school ?? null,
				schoolIsListed: isMlhSchool(user.school),
				levelOfStudy: user.levelOfStudy ?? null,
				program: user.program ?? null
			}}
		/>
	);
}
