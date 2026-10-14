import {
	Avatar,
	AvatarFallback,
	AvatarImage
} from "@/app/components/ui/avatar";
import { getInitials } from "@/lib/names";
import { AvatarPicker } from "./AvatarPicker";
import type { Profile } from "./types";

export function ProfileSummary({ profile }: { profile: Profile }) {
	return (
		<div className="flex items-start gap-4">
			<div className="relative shrink-0">
				<Avatar className="size-16">
					<AvatarImage alt="Your avatar" src={profile.avatarSrc} />
					<AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
				</Avatar>
				<div className="-right-1.5 absolute bottom-0.5">
					<AvatarPicker currentAvatarSrc={profile.avatarSrc} />
				</div>
			</div>

			<div className="flex min-h-16 min-w-0 flex-1 flex-col justify-center gap-0.5">
				<p className="wrap-break-word font-medium text-[22px] leading-7">
					{profile.name}
				</p>
				<p className="truncate font-medium text-gray-500 text-sm">
					{profile.email}
				</p>
			</div>
		</div>
	);
}
