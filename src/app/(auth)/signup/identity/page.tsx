import { redirect } from "next/navigation";
import SignupIdentityForm from "@/app/components/auth/signup/SignupIdentityForm";
import { getSession } from "@/server/better-auth/server";

export default async function SignupIdentityPage() {
	const session = await getSession();
	const isCompleted = session?.user.completedRegistration;
	if (isCompleted) redirect("/");

	return <SignupIdentityForm user={session?.user} />;
}
