import PageHeader from "@/app/components/PageHeader";
import { PersonalInformation } from "./PersonalInformation";
import { ProfileSummary } from "./ProfileSummary";
import type { Profile } from "./types";

export function ProfileView({ profile }: { profile: Profile }) {
	return (
		<div className="flex flex-col gap-6">
			<PageHeader title="Profile" />
			<ProfileSummary profile={profile} />
			<PersonalInformation profile={profile} />
		</div>
	);
}
