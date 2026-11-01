import { resolveAvatarSrc } from "@/lib/avatars";
import { getNameParts } from "@/lib/names";
import { requireRole } from "@/server/better-auth/auth-helpers/helpers";
import { Role } from "@/types/types";
import { JudgeHeader } from "../components/judge/JudgeHeader";
import PageContainer from "../components/PageContainer";

export default async function JudgeLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireRole([Role.JUDGE, Role.ADMIN]);

	return (
		<div className="flex min-h-svh flex-col">
			<JudgeHeader
				avatarUrl={resolveAvatarSrc(user.image)}
				userName={
					user.firstName || getNameParts(user.name).firstName || "Judge"
				}
			/>
			<main className="mx-auto w-full max-w-4xl">
				<PageContainer>{children}</PageContainer>
			</main>
		</div>
	);
}
