import { Card, CardContent } from "@/app/components/ui/card";
import { cn } from "@/lib/utils";

export function JudgeRoundStats({
	name,
	assigned,
	scored
}: {
	name: string;
	assigned: number;
	scored: number;
}) {
	return (
		<div className="flex flex-col gap-2">
			<h2 className="m-0 font-medium text-xl leading-6">{name}</h2>
			<Card>
				<CardContent>
					<dl className="grid grid-cols-3 gap-2 text-center">
						{[
							{ label: "Assigned", value: assigned, color: "text-foreground" },
							{ label: "Scored", value: scored, color: "text-judging-success" },
							{
								label: "Remaining",
								value: assigned - scored,
								color: "text-judging-pending"
							}
						].map(({ label, value, color }) => (
							<div className="flex min-w-0 flex-col-reverse gap-2" key={label}>
								<dt className="text-xs uppercase">{label}</dt>
								<dd className={cn("m-0 text-5xl tabular-nums", color)}>
									{value}
								</dd>
							</div>
						))}
					</dl>
				</CardContent>
			</Card>
		</div>
	);
}
