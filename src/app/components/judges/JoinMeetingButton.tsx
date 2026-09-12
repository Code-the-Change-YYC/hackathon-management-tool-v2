import { VideoLine } from "@mingcute/react";
import { Button } from "@/app/components/ui/button";

export function JoinMeetingButton({ href }: { href: string }) {
	if (!href) {
		return (
			<Button disabled type="button" variant="secondary">
				<VideoLine data-icon="inline-start" />
				Join Zoom Meeting
			</Button>
		);
	}

	return (
		<Button
			render={
				<a href={href} rel="noreferrer" target="_blank">
					<VideoLine data-icon="inline-start" />
					Join Zoom Meeting
				</a>
			}
		/>
	);
}
