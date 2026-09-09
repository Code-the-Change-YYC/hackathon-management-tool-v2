import { redirect } from "next/navigation";
import SignupForm from "@/app/components/auth/signup/SignupForm";
import { getSession } from "@/server/better-auth/server";

export default async function SignupPage() {
	const session = await getSession();
	const isCompleted = session?.user.completedRegistration;
	if (isCompleted) redirect("/");

	return <SignupForm />;
}
