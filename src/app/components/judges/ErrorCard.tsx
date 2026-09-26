import { Card, CardContent } from "@/app/components/ui/card";

export function ErrorCard({ message }: { message: string }) {
	return (
		<Card>
			<CardContent>
				<p className="m-0 text-destructive">{message}</p>
			</CardContent>
		</Card>
	);
}
