import { redirect } from "next/navigation";
import SignupEventDetailsForm from "@/app/components/auth/signup/SignupEventDetailsForm";
import { getSession } from "@/server/better-auth/server";

export default async function SignupEventDetailsPage() {
	const session = await getSession();
	const { user } = session || {};
	if (user?.completedRegistration) redirect("/");

	return <SignupEventDetailsForm user={user} />;
}
