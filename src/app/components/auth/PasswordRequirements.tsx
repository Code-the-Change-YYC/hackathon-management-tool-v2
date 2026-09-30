import { CheckLine, CloseLine } from "@mingcute/react";
import { cn } from "@/lib/utils";
import { PASSWORD_REQUIREMENTS } from "@/lib/validation/auth";

/** Live checklist under the sign-up password: an X until each rule is met. */
export function PasswordRequirements({ password }: { password: string }) {
	return (
		<ul className="flex flex-col gap-1 pt-0.5">
			{PASSWORD_REQUIREMENTS.map(({ label, isMet }) => {
				const met = isMet(password);
				const Icon = met ? CheckLine : CloseLine;

				return (
					<li
						className={cn(
							"flex items-center gap-1 font-medium text-[11px] leading-4",
							met ? "text-green-800" : "text-muted-foreground"
						)}
						key={label}
					>
						<Icon aria-hidden="true" className="size-3 shrink-0" />
						{label}
						<span className="sr-only">{met ? "(done)" : "(not done)"}</span>
					</li>
				);
			})}
		</ul>
	);
}
