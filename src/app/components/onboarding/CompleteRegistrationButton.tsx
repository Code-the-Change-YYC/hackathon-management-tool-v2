"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Spinner } from "@/app/components/ui/spinner";
import { getDashboardHref } from "@/lib/routes";
import { api } from "@/trpc/react";

export function CompleteRegistrationButton({
	variant = "default"
}: {
	variant?: "default" | "outline";
}) {
	const router = useRouter();
	const completeRegistration = api.users.completeRegistration.useMutation({
		onSuccess: ({ role }) => {
			toast.success("You're registered for Hack the Change 2026!");
			router.replace(getDashboardHref(role));
		},
		onError: (error) => toast.error(error.message)
	});
	// Stay busy after success while the dashboard loads.
	const isBusy =
		completeRegistration.isPending || completeRegistration.isSuccess;

	return (
		<Button
			className="w-full"
			disabled={isBusy}
			onClick={() => completeRegistration.mutate()}
			type="button"
			variant={variant}
		>
			{isBusy && <Spinner data-icon="inline-start" />}
			Complete registration
		</Button>
	);
}
