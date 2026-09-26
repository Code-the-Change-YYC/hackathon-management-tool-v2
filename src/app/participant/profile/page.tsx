import PageHeader from "@/app/components/PageHeader";
import { PersonalInformation } from "@/app/components/profile/PersonalInformation";
import { ProfileSummary } from "@/app/components/profile/ProfileSummary";
import type { Profile } from "@/app/components/profile/types";
import { resolveAvatarSrc } from "@/lib/avatars";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";

export default async function ProfilePage() {
	const { user } = await requireRole([Role.PARTICIPANT, Role.ADMIN]);
	const profile: Profile = {
		name: user.name,
		email: user.email,
		avatarSrc: resolveAvatarSrc(user.image),
		school: user.school ?? null,
		program: user.program ?? null
	};

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-8 lg:px-6">
			<PageHeader title="Profile" />
			<ProfileSummary profile={profile} />
			<PersonalInformation profile={profile} />
		</div>
	);
}
