"use client";

import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from "@/app/components/ui/dialog";

export default function SuccessModal({
	open,
	onFinish,
	title,
	description,
	image,
	imageAlt
}: {
	open: boolean;
	onFinish: () => void;
	title: React.ReactNode;
	description: React.ReactNode;
	image: string;
	imageAlt: string;
}) {
	return (
		<Dialog onOpenChange={(next) => !next && onFinish()} open={open}>
			<DialogContent showCloseButton={false}>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>

				<div className="flex justify-center py-2">
					<Image alt={imageAlt} height={180} src={image} width={180} />
				</div>

				<DialogFooter>
					<Button onClick={onFinish} type="button">
						Finish
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
