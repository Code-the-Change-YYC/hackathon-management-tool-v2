import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/server/better-auth/server";

export default async function layout({
	children
}: Readonly<{ children: React.ReactNode }>) {
	const session = await getSession();
	const isCompleted = session?.user.completedRegistration;
	if (isCompleted) redirect("/");

	return (
		<main className="relative min-h-screen overflow-x-hidden bg-auth-surface text-auth-text">
			<Image
				alt=""
				aria-hidden="true"
				className="pointer-events-none absolute inset-0 size-full object-cover"
				fill
				priority
				sizes="100vw"
				src={"/background/signup-background.png"}
			/>
			<section className="relative flex min-h-screen w-full justify-start">
				<div className="flex min-h-screen w-full flex-col gap-6 overflow-y-auto bg-auth-surface px-6 py-8 sm:px-12 lg:w-160 lg:shrink-0 lg:rounded-tr-2xl lg:rounded-br-2xl lg:px-24 lg:py-12">
					<div className="flex h-22.5 shrink-0 items-center justify-center">
						<Image
							alt="Hack the Change"
							className="h-22.5 w-43.25 object-contain"
							height={90}
							src="/svgs/CTCLogoWithText.svg"
							width={173}
						/>
					</div>
					{children}
				</div>
			</section>
		</main>
	);
}
