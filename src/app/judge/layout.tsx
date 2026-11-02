import { resolveAvatarSrc } from "@/lib/avatars";
import { getNameParts } from "@/lib/names";
import { requireJudge } from "@/server/better-auth/auth-helpers/helpers";
import { JudgeHeader } from "../components/judge/JudgeHeader";
import PageContainer from "../components/PageContainer";

export default async function JudgeLayout({
	children
}: {
	children: React.ReactNode;
}) {
	const { user } = await requireJudge();

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
