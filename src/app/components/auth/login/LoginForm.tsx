"use client";

import Link from "next/link";
import { type SubmitEventHandler, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import {
	ENABLED_SOCIAL_PROVIDERS,
	type SocialProviderId
} from "../social-providers";
import { useLoginMutations } from "../useAuthMutations";

export default function LoginForm() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const { emailSignIn, error, isPending, socialSignIn } = useLoginMutations();

	const handleSubmit: SubmitEventHandler<HTMLFormElement> = (event) => {
		event.preventDefault();
		socialSignIn.reset();
		emailSignIn.mutate({ email, password });
	};

	const handleSocialSignIn = (provider: SocialProviderId) => {
		emailSignIn.reset();
		socialSignIn.mutate({ provider });
	};

	return (
		<form className="flex flex-col gap-4" onSubmit={handleSubmit}>
			<div className="flex flex-col gap-1">
				<label className="font-medium text-sm" htmlFor="email">
					Email
				</label>
				<input
					className="h-10 w-full rounded-full border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
					disabled={isPending}
					id="email"
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
					required
					type="email"
					value={email}
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label className="font-medium text-sm" htmlFor="password">
					Password
				</label>
				<input
					className="h-10 w-full rounded-full border border-ehhh-grey bg-pale-grey px-4 text-sm outline-none transition focus:border-awesomer-purple"
					disabled={isPending}
					id="password"
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Password"
					required
					type="password"
					value={password}
				/>
			</div>

			<div className="flex items-center justify-between text-sm">
				<label className="group inline-flex cursor-pointer items-center gap-2 text-grey-purple transition-colors hover:text-awesomer-purple">
					<input
						className="cursor-pointer accent-awesomer-purple transition-colors group-hover:accent-awesomer-purple"
						type="checkbox"
					/>
					<span>Remember me?</span>
				</label>
				<button
					className="cursor-pointer text-grey-purple transition-colors hover:text-awesomer-purple"
					type="button"
				>
					Forgot Password?
				</button>
			</div>

			{error && (
				<p className="rounded-md bg-pastel-pink px-3 py-2 text-sm text-strawberry-red">
					{error.message}
				</p>
			)}

			<button
				className="h-10 w-full cursor-pointer rounded-full bg-awesomer-purple font-semibold text-pale-grey text-sm transition hover:bg-awesome-purple disabled:cursor-not-allowed disabled:opacity-70"
				disabled={isPending}
				type="submit"
			>
				{emailSignIn.isPending ? "Signing in..." : "Sign in"}
			</button>

			<div aria-hidden="true" className="flex items-center gap-3">
				<Separator className="flex-1" />
				<span className="text-dark-grey/60 text-xs">OR</span>
				<Separator className="flex-1" />
			</div>

			{ENABLED_SOCIAL_PROVIDERS.map(({ icon: Icon, id, label }) => (
				<Button
					className="w-full rounded-full"
					disabled={isPending}
					key={id}
					onClick={() => handleSocialSignIn(id)}
					type="button"
					variant="outline"
				>
					<Icon aria-hidden="true" data-icon="inline-start" />
					{socialSignIn.isPending ? "Redirecting…" : `Continue with ${label}`}
				</Button>
			))}

			<p className="pt-2 text-center text-dark-grey/75 text-sm">
				Don&apos;t have an account?{" "}
				<Link
					className="font-semibold text-awesomer-purple hover:text-awesome-purple"
					href="/signup"
				>
					CREATE AN ACCOUNT
				</Link>
			</p>
		</form>
	);
}
